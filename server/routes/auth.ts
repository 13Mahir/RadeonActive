// server/routes/auth.ts
import { Router } from 'express';
import { getDb } from '../db/database.js';
import { createHash, randomBytes } from 'crypto';

const router = Router();

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'dbt-salt-2024').digest('hex');
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const db = getDb();
  const user = db.prepare(
    'SELECT * FROM users WHERE username = ? AND is_active = 1'
  ).get(username) as any;

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const hashed = hashPassword(password);
  if (hashed !== user.password_hash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Create session token
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  db.prepare(`
    INSERT INTO user_sessions (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `).run(user.id, token, expiresAt);

  // Update last login
  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      district: user.district,
      staff_id: user.staff_id
    },
    expires_at: expiresAt
  });
});

// GET /api/auth/me — validate current session
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const db = getDb();
  const session = db.prepare(`
    SELECT s.*, u.username, u.full_name, u.role, u.district, u.staff_id, u.is_active
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(token) as any;

  if (!session || !session.is_active) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  res.json({
    id: session.user_id,
    username: session.username,
    full_name: session.full_name,
    role: session.role,
    district: session.district,
    staff_id: session.staff_id
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (token) {
    const db = getDb();
    db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
  }

  res.json({ success: true });
});

// GET /api/auth/users — list all users (ADMIN only in production, open for hackathon demo)
router.get('/users', (req, res) => {
  const db = getDb();
  const users = db.prepare(`
    SELECT id, username, full_name, role, district, staff_id, is_active, last_login, created_at
    FROM users
    ORDER BY role, full_name
  `).all();
  res.json({ users });
});

export default router;
