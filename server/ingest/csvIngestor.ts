import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { getDb } from '../db/database.js';
import { normalizeGujarati } from '../engine/gujaratiNormalizer.js';
import { runRiskEngine } from '../engine/riskEngine.js';
import dotenv from 'dotenv';

dotenv.config();

export interface IngestResult {
  transactionsIngested: number;
  deathRecordsIngested: number;
  casesFlagged: number;
  durationMs: number;
  errors: string[];
}

export async function ingestData(
  txnCsvPath?: string,
  deathCsvPath?: string
): Promise<IngestResult> {
  const db = getDb();
  const startTime = Date.now();
  const errors: string[] = [];

  const txnPath = txnCsvPath || process.env.CSV_TRANSACTIONS || './data/TS-PS4-1.csv';
  const deathPath = deathCsvPath || process.env.CSV_DEATHS || './data/TS-PS4-2.csv';

  console.log('\n📥 Starting data ingestion...');
  console.log(`   Transactions: ${txnPath}`);
  console.log(`   Death Register: ${deathPath}`);

  const runStmt = db.prepare(`
    INSERT INTO processing_runs (run_type, status)
    VALUES ('INGEST', 'RUNNING')
  `);
  const runId = runStmt.run().lastInsertRowid as number;

  let transactionsIngested = 0;
  let deathRecordsIngested = 0;
  let casesFlagged = 0;

  try {
    // Clear old data
    db.exec('DELETE FROM flagged_cases');
    db.exec('DELETE FROM transactions');
    db.exec('DELETE FROM death_register');
    db.exec('DELETE FROM case_audit_log');
    console.log('   ✓ Cleared old data');

    // Ingest transactions
    if (fs.existsSync(txnPath)) {
      const txnCsv = fs.readFileSync(txnPath, 'utf-8');
      const records = parse(txnCsv, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true
      }) as Array<{
        beneficiary_id: string;
        aadhaar: string;
        name: string;
        scheme: string;
        district: string;
        amount: number;
        transaction_date: string;
        withdrawn: number;
        status: string;
      }>;

      console.log(`   📊 Parsed ${records.length} transaction records`);

      const insertTxn = db.prepare(`
        INSERT INTO transactions
          (beneficiary_id, aadhaar, name, name_normalized, scheme, district,
           amount, transaction_date, withdrawn, status)
        VALUES
          (@beneficiary_id, @aadhaar, @name, @name_normalized, @scheme, @district,
           @amount, @transaction_date, @withdrawn, @status)
      `);

      const batchInsert = db.transaction((rows: typeof records) => {
        for (const row of rows) {
          try {
            insertTxn.run({
              ...row,
              name_normalized: normalizeGujarati(row.name),
              aadhaar: String(row.aadhaar).trim(),
              amount: Number(row.amount),
              withdrawn: Number(row.withdrawn)
            });
            transactionsIngested++;
          } catch (e: any) {
            errors.push(`TXN row error: ${e.message}`);
          }
        }
      });

      batchInsert(records);
      console.log(`   ✅ Ingested ${transactionsIngested} transactions`);
    } else {
      errors.push(`Transactions CSV not found: ${txnPath}`);
      console.error(`   ❌ Transactions CSV not found: ${txnPath}`);
    }

    // Ingest death register
    if (fs.existsSync(deathPath)) {
      const deathCsv = fs.readFileSync(deathPath, 'utf-8');
      const deathRecords = parse(deathCsv, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }) as Array<{
        aadhaar: string;
        name: string;
        death_date: string;
      }>;

      console.log(`   📊 Parsed ${deathRecords.length} death records`);

      const insertDeath = db.prepare(`
        INSERT INTO death_register (aadhaar, name, name_normalized, death_date)
        VALUES (@aadhaar, @name, @name_normalized, @death_date)
      `);

      const batchDeaths = db.transaction((rows: typeof deathRecords) => {
        for (const row of rows) {
          try {
            insertDeath.run({
              ...row,
              aadhaar: String(row.aadhaar).trim(),
              name_normalized: normalizeGujarati(row.name)
            });
            deathRecordsIngested++;
          } catch (e: any) {
            errors.push(`Death row error: ${e.message}`);
          }
        }
      });

      batchDeaths(deathRecords);
      console.log(`   ✅ Ingested ${deathRecordsIngested} death records`);
    } else {
      errors.push(`Death CSV not found: ${deathPath}`);
      console.error(`   ❌ Death CSV not found: ${deathPath}`);
    }

    // Run risk engine
    if (transactionsIngested > 0) {
      console.log('\n🧠 Running risk detection engine...');
      casesFlagged = await runRiskEngine();
      console.log(`   ✅ Flagged ${casesFlagged} suspicious cases`);
    }

    const durationMs = Date.now() - startTime;

    db.prepare(`
      UPDATE processing_runs SET
        transactions_processed = ?,
        cases_flagged = ?,
        duration_ms = ?,
        status = 'COMPLETE',
        completed_at = datetime('now')
      WHERE id = ?
    `).run(transactionsIngested, casesFlagged, durationMs, runId);

    console.log(`\n✅ Ingestion complete in ${durationMs}ms`);
    return { transactionsIngested, deathRecordsIngested, casesFlagged, durationMs, errors };

  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    db.prepare(`
      UPDATE processing_runs SET status = 'ERROR', error_message = ?, completed_at = datetime('now')
      WHERE id = ?
    `).run(err.message, runId);
    throw err;
  }
}

// CLI entry point
if (process.argv[1] && process.argv[1].includes('csvIngestor')) {
  import('../db/database.js').then(({ initDatabase }) => {
    initDatabase().then(() => {
      ingestData().then(result => {
        console.log('\n📊 Final Result:', result);
        process.exit(0);
      }).catch(err => {
        console.error('❌ Ingestion failed:', err);
        process.exit(1);
      });
    });
  });
}
