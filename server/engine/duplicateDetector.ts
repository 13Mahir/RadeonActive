import { FlaggedCase } from './riskEngine.js';
import { nameSimilarity } from './gujaratiNormalizer.js';

const FUZZY_NAME_THRESHOLD = 82;
const HIGH_CONFIDENCE_THRESHOLD = 95;

export function detectDuplicates(
  transactions: Array<{
    id: number; beneficiary_id: string; aadhaar: string; name: string;
    name_normalized: string; scheme: string; district: string; amount: number;
    transaction_date: string; withdrawn: number; status: string;
  }>
): FlaggedCase[] {
  const flags: FlaggedCase[] = [];

  // Group by aadhaar
  const groups = new Map<string, typeof transactions[0][]>();
  for (const txn of transactions) {
    if (!groups.has(txn.aadhaar)) groups.set(txn.aadhaar, []);
    groups.get(txn.aadhaar)!.push(txn);
  }

  for (const [aadhaar, recs] of groups.entries()) {
    if (recs.length < 2) continue;

    const names = new Set(recs.map(r => r.name.toLowerCase().trim()));
    const ids = new Set(recs.map(r => r.beneficiary_id));

    if (names.size > 1 || ids.size > 1) {
      for (const duplicate of recs) {
        const riskScore = 95;
        const riskReason = `Aadhaar ${aadhaar} was used multiple times with different names or beneficiary IDs. ` +
          `Clear identity conflict indicating potential fraud.`;

        flags.push({
          transaction_id: duplicate.id,
          beneficiary_id: duplicate.beneficiary_id,
          aadhaar: duplicate.aadhaar,
          name: duplicate.name,
          scheme: duplicate.scheme,
          district: duplicate.district,
          amount: duplicate.amount,
          transaction_date: duplicate.transaction_date,
          leakage_type: 'DUPLICATE',
          risk_score: riskScore,
          risk_reason: riskReason,
          evidence_json: JSON.stringify({
            detection_method: 'CONFLICTING_IDENTITY_AADHAAR',
            unique_names_count: names.size,
            unique_ids_count: ids.size,
            total_occurrences: recs.length
          })
        });
      }
    }
  }

  return flags;
}
