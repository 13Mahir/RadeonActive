import { Router } from 'express';
import { getDb } from '../db/database.js';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// GET /api/cases — priority-sorted investigation queue
router.get('/', (req, res) => {
  const db = getDb();
  const {
    page = '1',
    limit = '20',
    type,
    status,
    district,
    minRisk,
    search
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const offset = (pageNum - 1) * limitNum;

  const conditions: string[] = [];
  const params: any[] = [];

  if (type) { conditions.push('leakage_type = ?'); params.push(type); }
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (district) { conditions.push('district = ?'); params.push(district); }
  if (minRisk) { conditions.push('risk_score >= ?'); params.push(Number(minRisk)); }
  if (search) {
    conditions.push('(name LIKE ? OR beneficiary_id LIKE ? OR aadhaar LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = (db.prepare(`SELECT COUNT(*) as count FROM flagged_cases ${where}`).get(...params) as any).count;

  const cases = db.prepare(`
    SELECT * FROM flagged_cases ${where}
    ORDER BY
      risk_score DESC,
      CASE leakage_type WHEN 'DECEASED' THEN 0 WHEN 'DUPLICATE' THEN 1 WHEN 'CROSS_SCHEME' THEN 2 ELSE 3 END,
      transaction_date ASC
    LIMIT ? OFFSET ?
  `).all(...params, limitNum, offset);

  res.json({
    cases,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
  });
});

// GET /api/cases/export/pdf-data — data for PDF audit report
// NOTE: This must come BEFORE /:id to avoid route conflicts
router.get('/export/pdf-data', (req, res) => {
  const db = getDb();
  const { district, type, minRisk = '60' } = req.query as Record<string, string>;

  const conditions = [`risk_score >= ${Number(minRisk)}`];
  if (district) conditions.push(`district = '${district}'`);
  if (type) conditions.push(`leakage_type = '${type}'`);

  const where = `WHERE ${conditions.join(' AND ')}`;

  const cases = db.prepare(`
    SELECT * FROM flagged_cases ${where}
    ORDER BY risk_score DESC, leakage_type ASC
    LIMIT 500
  `).all();

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(amount) as total_amount,
      COUNT(CASE WHEN risk_score >= 85 THEN 1 END) as critical,
      COUNT(CASE WHEN leakage_type='DECEASED' THEN 1 END) as deceased,
      COUNT(CASE WHEN leakage_type='DUPLICATE' THEN 1 END) as duplicate,
      COUNT(CASE WHEN leakage_type='UNWITHDRAWN' THEN 1 END) as unwithdrawn,
      COUNT(CASE WHEN leakage_type='CROSS_SCHEME' THEN 1 END) as cross_scheme
    FROM flagged_cases ${where}
  `).get();

  res.json({
    report_date: new Date().toISOString(),
    filters: { district, type, min_risk: minRisk },
    summary,
    cases
  });
});

// GET /api/cases/:id — single case with evidence
router.get('/:id', (req, res) => {
  const db = getDb();
  const caseRecord = db.prepare('SELECT * FROM flagged_cases WHERE id = ?').get(req.params.id);
  if (!caseRecord) return res.status(404).json({ error: 'Case not found' });

  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get((caseRecord as any).transaction_id);
  const auditLog = db.prepare('SELECT * FROM case_audit_log WHERE case_id = ? ORDER BY timestamp DESC').all(req.params.id);

  let evidence = {};
  try { evidence = JSON.parse((caseRecord as any).evidence_json); } catch {}

  res.json({ case: caseRecord, transaction, evidence, audit_log: auditLog });
});

// POST /api/cases/:id/assign
router.post('/:id/assign', (req, res) => {
  const db = getDb();
  const { investigator_id, actor_id = 'DFO' } = req.body;

  if (!investigator_id) return res.status(400).json({ error: 'investigator_id required' });

  const caseRecord = db.prepare('SELECT * FROM flagged_cases WHERE id = ?').get(req.params.id);
  if (!caseRecord) return res.status(404).json({ error: 'Case not found' });

  db.prepare('UPDATE flagged_cases SET assigned_to = ?, status = ?, date_flagged = date_flagged WHERE id = ?')
    .run(investigator_id, 'Reviewing', req.params.id);

  db.prepare(`
    INSERT INTO case_audit_log (case_id, action, actor_id, old_value, new_value)
    VALUES (?, 'ASSIGNED', ?, ?, ?)
  `).run(req.params.id, actor_id, (caseRecord as any).assigned_to || 'unassigned', investigator_id);

  res.json({ success: true, message: `Case assigned to ${investigator_id}` });
});

// PATCH /api/cases/:id/status
router.patch('/:id/status', (req, res) => {
  const db = getDb();
  const { status, actor_id = 'system', remarks } = req.body;

  const validStatuses = ['Flagged', 'Reviewing', 'Verified', 'Fraud', 'Cleared'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const caseRecord = db.prepare('SELECT * FROM flagged_cases WHERE id = ?').get(req.params.id);
  if (!caseRecord) return res.status(404).json({ error: 'Case not found' });

  db.prepare(`
    UPDATE flagged_cases SET status = ?, verification_remarks = COALESCE(?, verification_remarks)
    WHERE id = ?
  `).run(status, remarks || null, req.params.id);

  db.prepare(`
    INSERT INTO case_audit_log (case_id, action, actor_id, old_value, new_value)
    VALUES (?, 'STATUS_CHANGED', ?, ?, ?)
  `).run(req.params.id, actor_id, (caseRecord as any).status, status);

  res.json({ success: true, status });
});

// POST /api/cases/:id/verify — GPS-stamped field verification
router.post('/:id/verify', (req, res) => {
  const db = getDb();
  const { status, remarks, lat, lng, actor_id = 'VERIFIER' } = req.body;

  const validStatuses = ['Verified', 'Fraud', 'Cleared'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Verification status must be: ${validStatuses.join(', ')}` });
  }

  const caseRecord = db.prepare('SELECT * FROM flagged_cases WHERE id = ?').get(req.params.id);
  if (!caseRecord) return res.status(404).json({ error: 'Case not found' });

  const timestamp = new Date().toISOString();

  db.prepare(`
    UPDATE flagged_cases SET
      status = ?,
      verification_remarks = ?,
      verification_lat = ?,
      verification_lng = ?,
      verification_timestamp = ?
    WHERE id = ?
  `).run(status, remarks || '', lat || null, lng || null, timestamp, req.params.id);

  db.prepare(`
    INSERT INTO case_audit_log (case_id, action, actor_id, old_value, new_value)
    VALUES (?, 'VERIFIED', ?, ?, ?)
  `).run(req.params.id, actor_id, (caseRecord as any).status, `${status} (GPS: ${lat},${lng} at ${timestamp})`);

  res.json({ success: true, status, timestamp, location: { lat, lng } });
});

// GET /api/cases/:id/ai-summary — Gemini AI narrative
router.get('/:id/ai-summary', async (req, res) => {
  const db = getDb();
  const caseRecord = db.prepare('SELECT * FROM flagged_cases WHERE id = ?').get(req.params.id) as any;
  if (!caseRecord) return res.status(404).json({ error: 'Case not found' });

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      summary: `This ${caseRecord.leakage_type} case (Risk: ${caseRecord.risk_score}/100) requires investigation. ${caseRecord.risk_reason}`,
      generated_by: 'fallback'
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let evidence = {};
    try { evidence = JSON.parse(caseRecord.evidence_json); } catch {}

    const prompt = `You are a senior fraud analyst for the Gujarat DBT (Direct Benefit Transfer) system.

Analyze this flagged transaction and write a concise 3-sentence investigation brief for the District Finance Officer.

Case Data:
- Beneficiary: ${caseRecord.name}
- Aadhaar: ${caseRecord.aadhaar}
- Scheme: ${caseRecord.scheme}
- District: ${caseRecord.district}
- Amount: ₹${caseRecord.amount}
- Transaction Date: ${caseRecord.transaction_date}
- Leakage Type: ${caseRecord.leakage_type}
- Risk Score: ${caseRecord.risk_score}/100
- Detection Reason: ${caseRecord.risk_reason}
- Evidence: ${JSON.stringify(evidence)}

Write the brief in plain English. Start with the key risk. Mention specific amounts and dates. End with recommended action. Do not use bullet points. Max 100 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt
    });

    res.json({
      summary: response.text || caseRecord.risk_reason,
      generated_by: 'gemini-2.0-flash'
    });
  } catch (err: any) {
    if (process.env.GROQ_API_KEY) {
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
             model: 'llama-3.3-70b-versatile',
             messages: [{ 
               role: 'user', 
               content: prompt 
             }]
          })
        });
        
        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          return res.json({
            summary: groqData.choices[0].message.content,
            generated_by: 'groq/llama-3.3-70b'
          });
        }
      } catch (groqErr) {
        console.error("Groq Fallback Failed:", groqErr);
      }
    }

    let errorMsg = "AI summary currently unavailable due to heavy system load.";
    if (err.message && err.message.includes("429")) {
      errorMsg = "AI rate limit exceeded. Please wait a moment and try again.";
    }

    res.json({
      summary: `[AI UNAVAILABLE] ${errorMsg}\n\nOriginal Flag Reason: ${caseRecord.risk_reason}`,
      generated_by: 'fallback',
      error: err.message
    });
  }
});

export default router;
