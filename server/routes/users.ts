import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// GET /api/users
router.get('/', (req, res) => {
  const db = getDb();
  
  const users = db.prepare(`
    SELECT
      staff_id as id,
      full_name as name,
      role,
      district,
      CASE WHEN is_active = 1 THEN 'Active' ELSE 'Suspended' END as status,
      0 as cases
    FROM users
    ORDER BY role ASC, full_name ASC
  `).all();

  // Let's dynamically calculate cases for each user if needed, or just leave it out for now.
  // Actually, we can count assignments if we join, but let's keep it simple.
  const usersWithCases = users.map((u: any) => {
    let roleStr = u.role;
    if (u.role === 'DFO') roleStr = 'DFO Admin';
    if (u.role === 'VERIFIER') roleStr = 'Field Verifier';
    if (u.role === 'AUDITOR') roleStr = 'Compliance Auditor';
    if (u.role === 'ADMIN') roleStr = 'State Admin';
    
    return { ...u, role: roleStr };
  });

  const total = usersWithCases.length;
  const verifiers = usersWithCases.filter((u: any) => u.role === 'Field Verifier').length;
  const suspended = usersWithCases.filter((u: any) => u.status === 'Suspended').length;

  res.json({
    users: usersWithCases,
    stats: {
      totalActive: total - suspended,
      verifiers,
      pending: 0,
      suspended
    }
  });
});

import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'dbt-salt-2024').digest('hex');
}

// POST /api/users
router.post('/', (req, res) => {
  const db = getDb();
  const { name, role, district } = req.body;
  
  if (!name || !role) {
    return res.status(400).json({ error: 'Name and role are required' });
  }

  // Generate staff ID based on role
  const prefix = role === 'VERIFIER' ? 'FV' : role === 'AUDITOR' ? 'AT' : role === 'DFO' ? 'IU' : 'SA';
  const staffId = `${prefix}-${Math.floor(Math.random() * 9000 + 1000)}`;
  
  const username = name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 1000);
  const tempPassword = 'password123';

  const insert = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, district, staff_id, is_active)
    VALUES (@username, @password_hash, @full_name, @role, @district, @staff_id, 1)
  `);

  try {
    insert.run({
      username,
      password_hash: hashPassword(tempPassword),
      full_name: name,
      role,
      district: district || 'Statewide',
      staff_id: staffId
    });

    res.json({ success: true, staffId, username });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/users/:staffId — Edit profile
router.patch('/:staffId', (req, res) => {
  const db = getDb();
  const { staffId } = req.params;
  const { name, district } = req.body;
  try {
    db.prepare(`UPDATE users SET full_name = ?, district = ? WHERE staff_id = ?`)
      .run(name, district, staffId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/users/:staffId/suspend — Toggle suspend
router.patch('/:staffId/suspend', (req, res) => {
  const db = getDb();
  const { staffId } = req.params;
  try {
    const user: any = db.prepare(`SELECT is_active FROM users WHERE staff_id = ?`).get(staffId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newState = user.is_active === 1 ? 0 : 1;
    db.prepare(`UPDATE users SET is_active = ? WHERE staff_id = ?`).run(newState, staffId);
    res.json({ success: true, is_active: newState });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users/:staffId/reset-credentials — Reset password
router.post('/:staffId/reset-credentials', (req, res) => {
  const db = getDb();
  const { staffId } = req.params;
  try {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const newPassword = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    db.prepare(`UPDATE users SET password_hash = ? WHERE staff_id = ?`)
      .run(hashPassword(newPassword), staffId);
    res.json({ success: true, newPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:staffId/audit-trail — View audit actions
router.get('/:staffId/audit-trail', (req, res) => {
  const db = getDb();
  const { staffId } = req.params;
  try {
    // Get recent case audit actions for the user
    const logs = db.prepare(`
      SELECT al.case_id, al.action, al.actor_id, al.timestamp, al.new_value,
             fc.name as beneficiary_name, fc.leakage_type
      FROM audit_log al
      LEFT JOIN flagged_cases fc ON al.case_id = fc.id
      WHERE al.actor_id = ?
      ORDER BY al.timestamp DESC
      LIMIT 20
    `).all(staffId);

    // If no logs by staff_id, return sample activity
    res.json({ logs: logs.length > 0 ? logs : [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
