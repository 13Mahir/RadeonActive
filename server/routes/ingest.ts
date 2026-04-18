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
