import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// GET /api/analytics/summary — dashboard metrics
router.get('/summary', (req, res) => {
  const db = getDb();

  const totalTxns = (db.prepare('SELECT COUNT(*) as c FROM transactions').get() as any).c;
  const successTxns = (db.prepare("SELECT COUNT(*) as c FROM transactions WHERE status='SUCCESS'").get() as any).c;
  const totalFlagged = (db.prepare('SELECT COUNT(*) as c FROM flagged_cases').get() as any).c;
  const actionRequired = (db.prepare("SELECT COUNT(*) as c FROM flagged_cases WHERE status='Flagged'").get() as any).c;
  const highRisk = (db.prepare("SELECT COUNT(*) as c FROM flagged_cases WHERE risk_score >= 85").get() as any).c;

  const totalAmount = (db.prepare("SELECT SUM(amount) as s FROM transactions").get() as any).s || 0;
  
  // Estimated Leakage = Sum of amounts of HIGH-RISK cases (risk_score >= 85) ONLY for UNIQUE transactions
  const flaggedAmount = (db.prepare(`
    SELECT SUM(amount) as s 
    FROM (
      SELECT MAX(amount) as amount
      FROM flagged_cases 
      WHERE risk_score >= 85
      GROUP BY transaction_id
    )
  `).get() as any).s || 0;
  
  const leakagePct = totalAmount > 0 ? ((flaggedAmount / totalAmount) * 100).toFixed(2) : '0.00';

  const byType = db.prepare(`
    SELECT leakage_type, COUNT(DISTINCT transaction_id) as count, SUM(amount) as total_amount
    FROM (
      SELECT leakage_type, transaction_id, MAX(amount) as amount
      FROM flagged_cases
      GROUP BY leakage_type, transaction_id
    )
    GROUP BY leakage_type
    ORDER BY count DESC
  `).all();

  const byScheme = db.prepare(`
    SELECT scheme, COUNT(*) as flagged
    FROM flagged_cases
    GROUP BY scheme
  `).all();

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM flagged_cases
    GROUP BY status
  `).all();

  const lastRun = db.prepare(`
    SELECT * FROM processing_runs
    WHERE status = 'COMPLETE'
    ORDER BY completed_at DESC LIMIT 1
  `).get();

  res.json({
    summary: {
      total_transactions: totalTxns,
      successful_transactions: successTxns,
      total_flagged: totalFlagged,
      action_required: actionRequired,
      high_risk_cases: highRisk,
      total_disbursed: totalAmount,
      flagged_amount: flaggedAmount,
      leakage_percentage: leakagePct
    },
    by_leakage_type: byType,
    by_scheme: byScheme,
    by_status: byStatus,
    last_processing_run: lastRun
  });
});

// GET /api/analytics/district-heatmap
router.get('/district-heatmap', (req, res) => {
  const db = getDb();
  const {
    scheme,          // 'All Schemes' | 'PM-KISAN' | 'Pension' | 'Scholarship'
    layer,           // 'scheme' | 'leakage_type' | 'risk_level' | 'amount' | 'deceased' | 'unwithdrawn'
    leakage_type,    // 'DECEASED' | 'DUPLICATE' | 'UNWITHDRAWN' | 'CROSS_SCHEME'
    min_risk,        // '85' | '70' | '55' | '0'
    max_risk,        // '100' | '84' | '69' | '54'
  } = req.query as Record<string, string>;

  const conditions: string[] = [];
  const params: any[] = [];

  // Scheme filter (existing behaviour)
  if (scheme && scheme !== 'All Schemes' && scheme !== 'undefined') {
    conditions.push('scheme = ?');
    params.push(scheme);
  }

  // Leakage type filter (for layer = 'leakage_type' or specific layers)
  if (leakage_type) {
    conditions.push('leakage_type = ?');
    params.push(leakage_type);
  }

  // Layer: deceased only
  if (layer === 'deceased') {
    conditions.push("leakage_type = 'DECEASED'");
  }

  // Layer: unwithdrawn only
  if (layer === 'unwithdrawn') {
    conditions.push("leakage_type = 'UNWITHDRAWN'");
  }

  // Risk level filter
  if (min_risk) {
    conditions.push('risk_score >= ?');
    params.push(Number(min_risk));
  }
  if (max_risk) {
    conditions.push('risk_score <= ?');
    params.push(Number(max_risk));
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const query = `
    SELECT
      h.district,
      SUM(h.flag_count) as flagged_count,
      AVG(h.avg_risk) as avg_risk_score,
      MAX(h.max_risk) as max_risk_score,
      SUM(h.amount) as total_amount_at_risk,
      SUM(h.deceased) as deceased_count,
      SUM(h.duplicate) as duplicate_count,
      SUM(h.unwithdrawn) as unwithdrawn_count,
      SUM(h.cross_scheme) as cross_scheme_count,
      SUM(h.high_risk) as high_risk_count,
      SUM(h.critical_risk) as critical_risk_count
    FROM (
      SELECT
        district,
        transaction_id,
        MAX(amount) as amount,
        COUNT(*) as flag_count,
        AVG(risk_score) as avg_risk,
        MAX(risk_score) as max_risk,
        MAX(CASE WHEN leakage_type='DECEASED' THEN 1 ELSE 0 END) as deceased,
        MAX(CASE WHEN leakage_type='DUPLICATE' THEN 1 ELSE 0 END) as duplicate,
        MAX(CASE WHEN leakage_type='UNWITHDRAWN' THEN 1 ELSE 0 END) as unwithdrawn,
        MAX(CASE WHEN leakage_type='CROSS_SCHEME' THEN 1 ELSE 0 END) as cross_scheme,
        MAX(CASE WHEN risk_score >= 70 THEN 1 ELSE 0 END) as high_risk,
        MAX(CASE WHEN risk_score >= 85 THEN 1 ELSE 0 END) as critical_risk
      FROM flagged_cases
      ${whereClause}
      GROUP BY district, transaction_id
    ) h
    GROUP BY h.district
    ORDER BY flagged_count DESC
  `;

  const heatmap = params.length > 0
    ? db.prepare(query).all(...params)
    : db.prepare(query).all();

  res.json({ heatmap, layer: layer || 'scheme', applied_filters: { scheme, layer, leakage_type, min_risk, max_risk } });
});

// GET /api/analytics/leakage-trend
router.get('/leakage-trend', (req, res) => {
  const db = getDb();

  const trend = db.prepare(`
    SELECT
      substr(transaction_date, 1, 7) as month,
      COUNT(*) as flagged_count,
      SUM(amount) as amount_at_risk,
      COUNT(CASE WHEN leakage_type='DECEASED' THEN 1 END) as deceased,
      COUNT(CASE WHEN leakage_type='DUPLICATE' THEN 1 END) as duplicate,
      COUNT(CASE WHEN leakage_type='UNWITHDRAWN' THEN 1 END) as unwithdrawn,
      COUNT(CASE WHEN leakage_type='CROSS_SCHEME' THEN 1 END) as cross_scheme
    FROM flagged_cases
    GROUP BY month
    ORDER BY month ASC
  `).all();

  res.json({ trend });
});

// GET /api/analytics/scheme-comparison
router.get('/scheme-comparison', (req, res) => {
  const db = getDb();

  const comparison = db.prepare(`
    SELECT
      t.scheme,
      COUNT(DISTINCT t.id) as total_transactions,
      COUNT(DISTINCT f.transaction_id) as flagged_count,
      SUM(t.amount) as total_disbursed,
      SUM(CASE WHEN f.id IS NOT NULL THEN t.amount ELSE 0 END) as flagged_amount,
      ROUND(COUNT(DISTINCT f.transaction_id) * 100.0 / COUNT(DISTINCT t.id), 2) as flag_rate_pct
    FROM transactions t
    LEFT JOIN flagged_cases f ON f.transaction_id = t.id
    GROUP BY t.scheme
    ORDER BY flagged_count DESC
  `).all();

  res.json({ comparison });
});

// GET /api/analytics/rules
router.get('/rules', (req, res) => {
  const db = getDb();
  const rules = db.prepare(`SELECT key, value FROM system_config WHERE key LIKE 'RULE_%'`).all() as any[];
  
  // Default to true if not set
  const config = {
    DECEASED: true,
    DUPLICATE: true,
    UNWITHDRAWN: true,
    CROSS_SCHEME: true
  };

  for (const r of rules) {
    const name = r.key.replace('RULE_', '');
    if (name in config) {
      (config as any)[name] = r.value === 'true';
    }
  }
  
  res.json(config);
});

// POST /api/analytics/rules
router.post('/rules', (req, res) => {
  const db = getDb();
  const { id, enabled } = req.body;
  const key = `RULE_${id}`;
  const val = enabled ? 'true' : 'false';

  db.prepare(`
    INSERT INTO system_config (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = ?
  `).run(key, val, val);

  res.json({ success: true, id, enabled });
});

export default router;
