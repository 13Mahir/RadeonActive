// server/db/seedUsers.ts
import { getDb } from './database.js';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  // Simple SHA-256 for hackathon prototype.
  // Production: replace with bcrypt.hashSync(password, 10)
  return createHash('sha256').update(password + 'dbt-salt-2024').digest('hex');
}

export function seedUsers(): void {
  const db = getDb();

  const existing = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  if (existing > 0) {
    // Users already seeded — skip
    return;
  }

  const insert = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, district, staff_id, is_active)
    VALUES (@username, @password_hash, @full_name, @role, @district, @staff_id, 1)
  `);

  const seedData = [
    {
      username: 'dfo_admin',
      password_hash: hashPassword('dfo123'),
      full_name: 'DFO ADMIN',
      role: 'DFO',
      district: 'Ahmedabad',
      staff_id: 'IU-5463'
    },
    {
      username: 'verifier_01',
      password_hash: hashPassword('verify123'),
      full_name: 'Anita Patel',
      role: 'VERIFIER',
      district: 'Ahmedabad',
      staff_id: 'FV-2769'
    },
    {
      username: 'auditor_01',
      password_hash: hashPassword('audit123'),
      full_name: 'Dr. Vivek Sharma',
      role: 'AUDITOR',
      district: 'Statewide',
      staff_id: 'AT-9667'
    },
    {
      username: 'state_admin',
      password_hash: hashPassword('admin123'),
      full_name: 'System Administrator',
      role: 'ADMIN',
      district: 'Statewide',
      staff_id: 'SA-0001'
    },
  ];

  const batchSeed = db.transaction(() => {
    for (const user of seedData) {
      insert.run(user);
    }
  });

  batchSeed();
  console.log('✅ Demo users seeded:');
  console.log('   dfo_admin / dfo123 (DFO)');
  console.log('   verifier_01 / verify123 (Verifier)');
  console.log('   auditor_01 / audit123 (Auditor)');
  console.log('   state_admin / admin123 (Admin)');
}
