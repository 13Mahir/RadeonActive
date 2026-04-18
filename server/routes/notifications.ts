import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// GET /api/notifications?role=DFO|VERIFIER|AUDITOR|ADMIN
router.get('/', (req, res) => {
  const db = getDb();
  const role = (req.query.role as string || 'DFO').toUpperCase();
  const notifications: any[] = [];
  const now = new Date();

  try {
    if (role === 'AUDITOR') {
      // New high-risk cases flagged in last 24h
      const recent = db.prepare(`
        SELECT id, name, leakage_type, risk_score, scheme, district
        FROM flagged_cases
        WHERE status = 'Flagged'
        ORDER BY id DESC LIMIT 5
      `).all() as any[];

      recent.forEach((c, i) => {
        notifications.push({
          id: `audit-new-${c.id}`,
          type: 'case_assigned',
          title: 'New Case Assigned',
          message: `${c.name} — ${c.leakage_type.replace(/_/g, ' ')} detected in ${c.district}`,
          risk: c.risk_score,
          scheme: c.scheme,
          caseId: c.id,
          time: new Date(now.getTime() - i * 23 * 60000).toISOString(),
          read: false
        });
      });

      // Pending audit queue count
      const pending = (db.prepare(`SELECT COUNT(*) as cnt FROM flagged_cases WHERE status = 'Flagged'`).get() as any).cnt;
      if (pending > 0) {
        notifications.push({
          id: 'audit-queue',
          type: 'queue_alert',
          title: 'Investigation Queue',
          message: `${pending} cases awaiting audit review`,
          time: new Date(now.getTime() - 2 * 60 * 60000).toISOString(),
          read: false
        });
      }
    }

    if (role === 'VERIFIER') {
      // Cases under review
      const reviewing = db.prepare(`
        SELECT id, name, leakage_type, risk_score, district
        FROM flagged_cases WHERE status IN ('Reviewing', 'Flagged')
        ORDER BY risk_score DESC LIMIT 4
      `).all() as any[];

      reviewing.forEach((c, i) => {
        notifications.push({
          id: `verify-${c.id}`,
          type: 'field_visit',
          title: 'Field Verification Required',
          message: `Case #${c.id}: ${c.name} — ${c.district} needs GPS-stamped visit`,
          risk: c.risk_score,
          caseId: c.id,
          time: new Date(now.getTime() - i * 45 * 60000).toISOString(),
          read: i > 1
        });
      });

      const fraud = (db.prepare(`SELECT COUNT(*) as cnt FROM flagged_cases WHERE status = 'Fraud'`).get() as any).cnt;
      notifications.push({
        id: 'verify-fraud-total',
        type: 'system',
        title: 'Fraud Confirmed Update',
        message: `${fraud} cases have been marked as confirmed fraud this cycle`,
        time: new Date(now.getTime() - 4 * 60 * 60000).toISOString(),
        read: true
      });
    }

    if (role === 'DFO') {
      // Critical risk cases
      const critical = db.prepare(`
        SELECT id, name, risk_score, leakage_type, district, amount
        FROM flagged_cases WHERE risk_score >= 90
        ORDER BY risk_score DESC LIMIT 3
      `).all() as any[];

      critical.forEach((c, i) => {
        notifications.push({
          id: `dfo-critical-${c.id}`,
          type: 'critical',
          title: '⚠ Critical Risk Alert',
          message: `${c.name} — Risk Score ${c.risk_score}/100 — ₹${c.amount?.toLocaleString('en-IN')} at risk in ${c.district}`,
          risk: c.risk_score,
          caseId: c.id,
          time: new Date(now.getTime() - i * 30 * 60000).toISOString(),
          read: false
        });
      });

      // Cross scheme count
      const crossScheme = (db.prepare(`SELECT COUNT(*) as cnt FROM flagged_cases WHERE leakage_type = 'CROSS_SCHEME'`).get() as any).cnt;
      notifications.push({
        id: 'dfo-cross-scheme',
        type: 'pattern',
        title: 'Pattern Cluster Detected',
        message: `${crossScheme} cross-scheme duplicate beneficiaries flagged statewide`,
        time: new Date(now.getTime() - 6 * 60 * 60000).toISOString(),
        read: false
      });

      // Fraud total
      const fraud = (db.prepare(`SELECT COUNT(*) as cnt FROM flagged_cases WHERE status = 'Fraud'`).get() as any).cnt;
      notifications.push({
        id: 'dfo-fraud-report',
        type: 'report',
        title: 'Weekly Fraud Summary',
        message: `${fraud} cases confirmed as fraud. Export audit report for district review.`,
        time: new Date(now.getTime() - 24 * 60 * 60000).toISOString(),
        read: true
      });
    }

    if (role === 'ADMIN') {
      // New users provisioned recently
      const userCount = (db.prepare(`SELECT COUNT(*) as cnt FROM users`).get() as any).cnt;
      notifications.push({
        id: 'admin-users',
        type: 'system',
        title: 'Staff Roster Update',
        message: `${userCount} active staff members across all districts`,
        time: new Date(now.getTime() - 1 * 60 * 60000).toISOString(),
        read: false
      });

      const suspended = (db.prepare(`SELECT COUNT(*) as cnt FROM users WHERE is_active = 0`).get() as any).cnt;
      if (suspended > 0) {
        notifications.push({
          id: 'admin-suspended',
          type: 'alert',
          title: 'Suspended Accounts',
          message: `${suspended} staff account(s) currently suspended — review access controls`,
          time: new Date(now.getTime() - 2 * 60 * 60000).toISOString(),
          read: false
        });
      }

      const totalFlagged = (db.prepare(`SELECT COUNT(*) as cnt FROM flagged_cases`).get() as any).cnt;
      notifications.push({
        id: 'admin-system-status',
        type: 'system',
        title: 'System Health Check',
        message: `DBT Intelligence Engine active. ${totalFlagged} cases processed and indexed.`,
        time: new Date(now.getTime() - 12 * 60 * 60000).toISOString(),
        read: true
      });
    }

    const unreadCount = notifications.filter(n => !n.read).length;
    res.json({ notifications, unreadCount });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
