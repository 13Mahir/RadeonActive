import { getDb } from '../db/database.js';
import { detectDeceased } from './deceasedDetector.js';
import { detectDuplicates } from './duplicateDetector.js';
import { detectUnwithdrawn } from './unwithdrawnDetector.js';
import { detectCrossScheme } from './crossSchemeDetector.js';

export interface FlaggedCase {
  transaction_id: number;
  beneficiary_id: string;
  aadhaar: string;
  name: string;
  scheme: string;
  district: string;
  amount: number;
  transaction_date: string;
  leakage_type: 'DECEASED' | 'DUPLICATE' | 'UNWITHDRAWN' | 'CROSS_SCHEME' | 'SUSPICIOUS_ACCOUNT';
  risk_score: number;
  risk_reason: string;
  evidence_json: string;
}

export async function runRiskEngine(): Promise<number> {
  const db = getDb();
  const startTime = Date.now();

  const transactions = db.prepare('SELECT * FROM transactions').all() as Array<{
    id: number; beneficiary_id: string; aadhaar: string; name: string;
    name_normalized: string; scheme: string; district: string; amount: number;
    transaction_date: string; withdrawn: number; status: string;
  }>;

  const deathRecords = db.prepare('SELECT * FROM death_register').all() as Array<{
    id: number; aadhaar: string; name: string; name_normalized: string; death_date: string;
  }>;

  console.log(`   Processing ${transactions.length} transactions against ${deathRecords.length} death records...`);

  const allFlags: FlaggedCase[] = [
    ...detectDeceased(transactions, deathRecords),
    ...detectDuplicates(transactions),
    ...detectUnwithdrawn(transactions),
    ...detectCrossScheme(transactions),
  ];

  // Deduplicate: keep highest risk score per transaction_id, merge compound flags
  const flagMap = new Map<number, FlaggedCase>();
  for (const flag of allFlags) {
    const existing = flagMap.get(flag.transaction_id);
    if (!existing || flag.risk_score > existing.risk_score) {
      flagMap.set(flag.transaction_id, flag);
    } else if (existing && flag.leakage_type !== existing.leakage_type) {
      const compoundScore = Math.min(100, existing.risk_score + Math.floor(flag.risk_score * 0.3));
      const mergedEvidence = {
        ...JSON.parse(existing.evidence_json),
        additional_flag: {
          type: flag.leakage_type,
          reason: flag.risk_reason
        }
      };
      flagMap.set(flag.transaction_id, {
        ...existing,
        risk_score: compoundScore,
        risk_reason: `${existing.risk_reason} | ALSO: ${flag.risk_reason}`,
        evidence_json: JSON.stringify(mergedEvidence)
      });
    }
  }

  const uniqueFlags = Array.from(flagMap.values());

  const insertFlag = db.prepare(`
    INSERT INTO flagged_cases
      (transaction_id, beneficiary_id, aadhaar, name, scheme, district, amount,
       transaction_date, leakage_type, risk_score, risk_reason, evidence_json, status)
    VALUES
      (@transaction_id, @beneficiary_id, @aadhaar, @name, @scheme, @district, @amount,
       @transaction_date, @leakage_type, @risk_score, @risk_reason, @evidence_json, 'Flagged')
  `);

  const batchInsert = db.transaction((flags: FlaggedCase[]) => {
    for (const flag of flags) {
      insertFlag.run(flag);
    }
  });

  batchInsert(uniqueFlags);

  const duration = Date.now() - startTime;
  console.log(`   ⚡ Risk engine completed in ${duration}ms for ${transactions.length} records`);
  console.log(`   🚨 Total flagged: ${uniqueFlags.length}`);

  const breakdown: Record<string, number> = {};
  for (const f of uniqueFlags) {
    breakdown[f.leakage_type] = (breakdown[f.leakage_type] || 0) + 1;
  }
  console.log('   📊 Breakdown:', breakdown);

  return uniqueFlags.length;
}
