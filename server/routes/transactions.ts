import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// GET /api/transactions — paginated list with filters
router.get('/', (req, res) => {
  const db = getDb();
  const {
    page = '1',
    limit = '50',
    scheme,
    district,
    status,
    withdrawn,
    search
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(200, parseInt(limit));
  const offset = (pageNum - 1) * limitNum;

  const conditions: string[] = [];
  const params: any[] = [];

  if (scheme) { conditions.push('scheme = ?'); params.push(scheme); }
  if (district) { conditions.push('district = ?'); params.push(district); }
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (withdrawn !== undefined) { conditions.push('withdrawn = ?'); params.push(Number(withdrawn)); }
  if (search) {
    conditions.push('(name LIKE ? OR beneficiary_id LIKE ? OR aadhaar LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = (db.prepare(`SELECT COUNT(*) as count FROM transactions ${where}`).get(...params) as any).count;
  const rows = db.prepare(`SELECT * FROM transactions ${where} ORDER BY id LIMIT ? OFFSET ?`).all(...params, limitNum, offset);

  res.json({
    transactions: rows,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
  });
});

// GET /api/transactions/:id — single transaction with flag info
router.get('/:id', (req, res) => {
  const db = getDb();
  const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });

  const flags = db.prepare('SELECT * FROM flagged_cases WHERE transaction_id = ?').all(req.params.id);
  res.json({ transaction: txn, flags });
});

export default router;
