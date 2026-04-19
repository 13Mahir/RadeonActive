import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// POST /api/citizens/login
// A lightweight login system that issues a simple payload back to the frontend based on Aadhaar
router.post('/login', (req, res) => {
  const { aadhaar, mobile } = req.body;
  if (!aadhaar || !mobile) {
    return res.status(400).json({ error: 'Aadhaar and mobile number are required.' });
  }

  const db = getDb();
  
  // As a mock feature, we will assume any strict 12-digit Aadhaar & 10-digit Mobile is valid for login,
  // but we can optionally check if transactions exist for them.
  const checkTxns = db.prepare('SELECT COUNT(*) as c FROM transactions WHERE aadhaar = ?').get(aadhaar) as any;
  
  res.json({
    success: true,
    citizen: {
      aadhaar,
      mobile,
      hasRecords: checkTxns.c > 0
    }
  });
});

// GET /api/citizens/transactions
// Fetches strictly transactions for the given Aadhaar via query params
router.get('/transactions', (req, res) => {
  const { aadhaar, mobile } = req.query;
  if (!aadhaar) return res.status(400).json({ error: 'Aadhaar is required.' });

  const db = getDb();
  try {
    const transactions = db.prepare(`
      SELECT * FROM transactions 
      WHERE aadhaar = ? 
      ORDER BY transaction_date DESC
    `).all(aadhaar);

    res.json(transactions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/citizens/grievances
// Fetches tickets for a citizen
router.get('/grievances', (req, res) => {
  const { aadhaar } = req.query;
  if (!aadhaar) return res.status(400).json({ error: 'Aadhaar is required.' });

  const db = getDb();
  try {
    const grievances = db.prepare(`
      SELECT g.*, t.scheme, t.amount, t.transaction_date 
      FROM citizen_grievances g
      LEFT JOIN transactions t ON g.transaction_id = t.id
      WHERE g.aadhaar = ?
      ORDER BY g.created_at DESC
    `).all(aadhaar);

    res.json(grievances);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/citizens/grievances
// Submits a new grievance
router.post('/grievances', (req, res) => {
  const { aadhaar, mobile, transaction_id, subject, description } = req.body;
  if (!aadhaar || !mobile || !subject || !description) {
    return res.status(400).json({ error: 'Missing required fields for grievance.' });
  }

  const db = getDb();
  try {
    const insert = db.prepare(`
      INSERT INTO citizen_grievances (aadhaar, mobile, transaction_id, subject, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    // SQLite returns info object with lastInsertRowid
    const result = insert.run(aadhaar, mobile, transaction_id || null, subject, description);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
