import { Router } from 'express';
import { getDb } from '../db/database.js';
import { ingestData } from '../ingest/csvIngestor.js';

const router = Router();

// POST /api/ingest/process — trigger ingestion (uses default CSV paths)
router.post('/process', async (req, res) => {
  try {
    const result = await ingestData();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Set up secure file storage for database changes
const uploadDir = path.join(process.cwd(), 'server', 'data', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}.csv`);
  }
});

const upload = multer({ storage });

// POST /api/ingest/upload — Change Database
router.post('/upload', upload.fields([
  { name: 'transactions', maxCount: 1 },
  { name: 'deaths', maxCount: 1 }
]), async (req: any, res) => {
  try {
    if (!req.files || !req.files['transactions'] || !req.files['deaths']) {
      return res.status(400).json({ error: 'Both transactions and deaths CSV files are required' });
    }

    const txnFile = req.files['transactions'][0];
    const deathFile = req.files['deaths'][0];

    const result = await ingestData(txnFile.path, deathFile.path);

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Upload Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ingest/status — current DB stats
router.get('/status', (req, res) => {
  const db = getDb();

  const txnCount = (db.prepare('SELECT COUNT(*) as c FROM transactions').get() as any).c;
  const deathCount = (db.prepare('SELECT COUNT(*) as c FROM death_register').get() as any).c;
  const caseCount = (db.prepare('SELECT COUNT(*) as c FROM flagged_cases').get() as any).c;

  const lastRun = db.prepare(`
    SELECT * FROM processing_runs ORDER BY started_at DESC LIMIT 1
  `).get();

  res.json({
    database_loaded: txnCount > 0,
    transactions: txnCount,
    death_records: deathCount,
    flagged_cases: caseCount,
    last_run: lastRun
  });
});

export default router;
