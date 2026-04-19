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

// GET /api/auth/verifiers — list active field verifiers for assignment dropdown
router.get('/verifiers', (req, res) => {
  const db = getDb();
  const verifiers = db.prepare(`
    SELECT id, full_name, staff_id, district
    FROM users
    WHERE role = 'VERIFIER' AND is_active = 1
    ORDER BY district, full_name
  `).all();
  res.json({ verifiers });
});

// POST /api/auth/register — self-registration for new users
router.post('/register', (req, res) => {
  const { username, password, full_name, role, district } = req.body;

  if (!username || !password || !full_name || !role) {
    return res.status(400).json({ error: 'Username, password, full name, and role are required' });
  }

  const validRoles = ['DFO', 'VERIFIER', 'AUDITOR', 'ADMIN'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const db = getDb();

  // Check if username exists
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const hashed = hashPassword(password);
  const staffId = `${role.substring(0, 3)}-${Date.now().toString(36).toUpperCase()}`;

  const result = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, district, staff_id, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(username, hashed, full_name, role, district || null, staffId);

  // Auto-login after registration
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO user_sessions (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `).run(result.lastInsertRowid, token, expiresAt);

  res.json({
    success: true,
    token,
    user: {
      id: result.lastInsertRowid,
      username,
      full_name,
      role,
      district: district || null,
      staff_id: staffId
    },
    expires_at: expiresAt
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE OAUTH ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/google-userinfo
// Called by frontend after it fetches userinfo from Google using access_token
// Frontend sends: { google_id, email, full_name, avatar_url, email_verified }
router.post('/google-userinfo', (req, res) => {
  const { google_id, email, full_name, avatar_url, email_verified } = req.body;

  if (!google_id || !email) {
    return res.status(400).json({ error: 'google_id and email are required' });
  }

  if (!email_verified) {
    return res.status(401).json({ error: 'Google email not verified' });
  }

  const db = getDb();

  // Look for existing user by google_id first, then email fallback
  let user = db.prepare(
    'SELECT * FROM users WHERE google_id = ? AND is_active = 1'
  ).get(google_id) as any;

  if (!user && email) {
    user = db.prepare(
      'SELECT * FROM users WHERE email = ? AND is_active = 1'
    ).get(email) as any;

    if (user) {
      // Link google_id to existing email-matched user
      db.prepare('UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?')
        .run(google_id, avatar_url || null, user.id);
    }
  }

  // ── EXISTING USER → auto-login ─────────────────────────────────────────────
  if (user) {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.prepare('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)')
      .run(user.id, token, expiresAt);

    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

    return res.json({
      success: true,
      registered: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        district: user.district,
        staff_id: user.staff_id,
        avatar_url: user.avatar_url || avatar_url
      },
      expires_at: expiresAt
    });
  }

  // ── NEW USER → return profile for role selection ───────────────────────────
  return res.json({
    success: true,
    registered: false,
    google_profile: { google_id, email, full_name, avatar_url: avatar_url || null }
  });
});

// POST /api/auth/google
// Frontend sends: { credential: "eyJ..." }  (Google ID token from @react-oauth/google)
// Backend verifies with Google's tokeninfo API — no extra npm package needed
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Google credential is required' });
  }

  let googlePayload: {
    sub: string;
    email: string;
    name: string;
    picture: string;
    email_verified: boolean;
    aud: string;
  };

  try {
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );

    if (!tokenInfoRes.ok) {
      return res.status(401).json({ error: 'Invalid Google credential' });
    }

    googlePayload = await tokenInfoRes.json() as typeof googlePayload;

    const expectedAud = process.env.GOOGLE_CLIENT_ID;
    if (expectedAud && googlePayload.aud !== expectedAud) {
      return res.status(401).json({ error: 'Token audience mismatch' });
    }

    if (!googlePayload.email_verified) {
      return res.status(401).json({ error: 'Google email not verified' });
    }

  } catch (err: any) {
    console.error('[Google OAuth] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Failed to verify Google credential' });
  }

  const db = getDb();

  let user = db.prepare(
    'SELECT * FROM users WHERE google_id = ? AND is_active = 1'
  ).get(googlePayload.sub) as any;

  if (!user && googlePayload.email) {
    user = db.prepare(
      'SELECT * FROM users WHERE email = ? AND is_active = 1'
    ).get(googlePayload.email) as any;

    if (user) {
      db.prepare(
        'UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?'
      ).run(googlePayload.sub, googlePayload.picture, user.id);
    }
  }

  if (user) {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.prepare(
      'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
    ).run(user.id, token, expiresAt);

    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

    return res.json({
      success: true,
      registered: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        district: user.district,
        staff_id: user.staff_id,
        avatar_url: user.avatar_url || googlePayload.picture
      },
      expires_at: expiresAt
    });
  }

  return res.json({
    success: true,
    registered: false,
    google_profile: {
      google_id: googlePayload.sub,
      email: googlePayload.email,
      full_name: googlePayload.name,
      avatar_url: googlePayload.picture
    }
  });
});


// POST /api/auth/google/register
// Called when a new Google user picks their role
router.post('/google/register', (req, res) => {
  const { role, google_profile } = req.body as {
    role: string;
    google_profile: {
      google_id: string;
      email: string;
      full_name: string;
      avatar_url: string;
    };
  };

  if (!role || !google_profile?.google_id || !google_profile?.email) {
    return res.status(400).json({ error: 'Role and Google profile are required' });
  }

  const validRoles = ['DFO', 'VERIFIER', 'AUDITOR', 'ADMIN'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
  }

  const db = getDb();

  const alreadyExists = db.prepare(
    'SELECT id FROM users WHERE google_id = ? OR email = ?'
  ).get(google_profile.google_id, google_profile.email) as any;

  if (alreadyExists) {
    return res.status(409).json({ error: 'An account with this Google profile already exists' });
  }

  const baseUsername = google_profile.email.split('@')[0].replace(/[^a-z0-9._]/gi, '').toLowerCase();
  let username = baseUsername;

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    username = `${baseUsername}_${Date.now().toString(36)}`;
  }

  const staffId = `${role.substring(0, 3)}-${Date.now().toString(36).toUpperCase()}`;

  const result = db.prepare(`
    INSERT INTO users
      (username, password_hash, full_name, role, district, staff_id, is_active, google_id, email, avatar_url)
    VALUES
      (?, '', ?, ?, NULL, ?, 1, ?, ?, ?)
  `).run(
    username,
    google_profile.full_name,
    role,
    staffId,
    google_profile.google_id,
    google_profile.email,
    google_profile.avatar_url || null
  );

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).run(result.lastInsertRowid, token, expiresAt);

  res.json({
    success: true,
    token,
    user: {
      id: result.lastInsertRowid,
      username,
      full_name: google_profile.full_name,
      role,
      district: null,
      staff_id: staffId,
      avatar_url: google_profile.avatar_url
    },
    expires_at: expiresAt
  });
});

export default router;
