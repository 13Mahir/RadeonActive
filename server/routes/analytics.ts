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
  const schemeFilter = req.query.scheme as string;
  
  let whereClause = '';
  // Notice we must match the case or normalize it. 
  if (schemeFilter && schemeFilter !== 'All Schemes') {
    // Basic sanitization/protection assumption via exact binding
    whereClause = `WHERE scheme = ?`;
  }

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
      SUM(h.high_risk) as high_risk_count
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
        MAX(CASE WHEN risk_score >= 85 THEN 1 ELSE 0 END) as high_risk
      FROM flagged_cases
      ${whereClause}
      GROUP BY district, transaction_id
    ) h
    GROUP BY h.district
    ORDER BY flagged_count DESC
  `;

  const heatmap = whereClause ? db.prepare(query).all(schemeFilter) : db.prepare(query).all();
  res.json({ heatmap });
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

export default router;
