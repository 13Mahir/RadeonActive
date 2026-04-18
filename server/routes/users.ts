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

export default router;
