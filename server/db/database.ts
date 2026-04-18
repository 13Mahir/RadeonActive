import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedUsers } from './seedUsers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/dbt.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return _db;
}

export async function initDatabase(): Promise<void> {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  _db = new Database(DB_PATH);

  // Performance settings
  _db.pragma('journal_mode = WAL');
  _db.pragma('synchronous = NORMAL');
  _db.pragma('cache_size = -64000');
  _db.pragma('temp_store = MEMORY');
  _db.pragma('mmap_size = 268435456');

  // Apply schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  _db.exec(schema);

  // Seed demo users if not already seeded
  seedUsers();

  console.log(`✅ Database initialized: ${DB_PATH}`);
}

export function closeDatabase(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
