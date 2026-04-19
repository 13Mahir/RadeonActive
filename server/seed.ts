#!/usr/bin/env tsx
// server/seed.ts — Full database reset + seed + ingest
// Usage: npm run seed

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data/dbt.db');

async function seed() {
  console.log('\n🌱 DBT Intelligence System — Full Seed\n');
  console.log('═'.repeat(50));

  // Step 1: Initialize database
  const { initDatabase, getDb } = await import('./db/database.js');
  await initDatabase();
  
  const db = getDb();

  // Step 2: Clear all data (safer than deleting the file while server is running)
  console.log(`🧹 Clearing existing database records...`);
  db.exec('DELETE FROM user_sessions');
  db.exec('DELETE FROM case_audit_log');
  db.exec('DELETE FROM flagged_cases');
  db.exec('DELETE FROM transactions');
  db.exec('DELETE FROM death_register');
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM processing_runs');
  
  // Re-seed standard users
  const { seedUsers } = await import('./db/seedUsers.js');
  seedUsers();
  console.log('✅ Database initialized with schema + 4 default users');
  console.log('   📋 Default Users:');
  console.log('   ┌─────────────────┬─────────────┬──────────────────────┐');
  console.log('   │ Username        │ Password    │ Role                 │');
  console.log('   ├─────────────────┼─────────────┼──────────────────────┤');
  console.log('   │ dfo_admin       │ dfo123      │ District Finance Off │');
  console.log('   │ verifier_01     │ verify123   │ Field Verifier       │');
  console.log('   │ auditor_01      │ audit123    │ Auditor              │');
  console.log('   │ state_admin     │ admin123    │ State Admin          │');
  console.log('   └─────────────────┴─────────────┴──────────────────────┘');

  // Step 3: Ingest CSV data
  const txnPath = process.env.CSV_TRANSACTIONS || './data/TS-PS4-1.csv';
  const deathPath = process.env.CSV_DEATHS || './data/TS-PS4-2.csv';

  if (!fs.existsSync(txnPath)) {
    console.error(`\n❌ Transactions CSV not found: ${txnPath}`);
    console.log('   Set CSV_TRANSACTIONS in .env or place the file at the default path.');
    process.exit(1);
  }
  if (!fs.existsSync(deathPath)) {
    console.error(`\n❌ Deaths CSV not found: ${deathPath}`);
    console.log('   Set CSV_DEATHS in .env or place the file at the default path.');
    process.exit(1);
  }

  console.log('\n📥 Ingesting CSV data...');
  const { ingestData } = await import('./ingest/csvIngestor.js');
  const result = await ingestData(txnPath, deathPath);

  console.log('\n═'.repeat(50));
  console.log('🎉 Seed Complete!');
  console.log(`   📊 ${result.transactionsIngested} transactions ingested`);
  console.log(`   💀 ${result.deathRecordsIngested} death records ingested`);
  console.log(`   🚨 ${result.casesFlagged} cases flagged`);
  console.log(`   ⏱️  ${(result.durationMs / 1000).toFixed(1)}s total`);
  if (result.errors.length > 0) {
    console.log(`   ⚠️  ${result.errors.length} errors`);
  }
  console.log('\n🚀 Run "npm run dev" to start the system.\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
