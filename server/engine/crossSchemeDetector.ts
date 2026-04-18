import { FlaggedCase } from './riskEngine.js';
import { nameSimilarity } from './gujaratiNormalizer.js';

const CROSS_SCHEME_NAME_THRESHOLD = 80;

export function detectCrossScheme(
  transactions: Array<{
    id: number; beneficiary_id: string; aadhaar: string; name: string;
    name_normalized: string; scheme: string; district: string; amount: number;
    transaction_date: string; withdrawn: number; status: string;
  }>
): FlaggedCase[] {
  const flags: FlaggedCase[] = [];

  // Group transactions by aadhaar across ALL schemes
  const aadhaarMap = new Map<string, typeof transactions[0][]>();
  for (const txn of transactions) {
    if (!aadhaarMap.has(txn.aadhaar)) aadhaarMap.set(txn.aadhaar, []);
    aadhaarMap.get(txn.aadhaar)!.push(txn);
  }

  // Detect same Aadhaar across multiple schemes
  for (const [aadhaar, group] of aadhaarMap.entries()) {
    const schemes = [...new Set(group.map(t => t.scheme))];
    if (schemes.length <= 1) continue;

    const schemeFirstMap = new Map<string, typeof transactions[0]>();
    for (const txn of group) {
      if (!schemeFirstMap.has(txn.scheme)) {
        schemeFirstMap.set(txn.scheme, txn);
      }
    }

    const schemeCount = schemes.length;
    const totalAmount = group.reduce((s, t) => s + t.amount, 0);
    // Dynamic risk scoring: varies by scheme count, total value, and frequency
    const schemeBonus = schemeCount === 2 ? 60 : schemeCount === 3 ? 78 : 90;
    const amountBonus = totalAmount > 50000 ? 10 : totalAmount > 20000 ? 6 : totalAmount > 10000 ? 3 : 0;
    const freqBonus = group.length > 5 ? 8 : group.length > 3 ? 4 : 0;
    const baseScore = Math.min(99, schemeBonus + amountBonus + freqBonus);

    for (const txn of group) {
      const otherSchemes = schemes.filter(s => s !== txn.scheme);
      const riskReason =
        `Cross-scheme duplication detected. Aadhaar ${txn.aadhaar} (${txn.name}) ` +
        `receiving benefits under ${txn.scheme} AND ${otherSchemes.join(', ')}. ` +
        `Total of ${schemeCount} active scheme enrollments. Combined disbursement: ` +
        `₹${totalAmount}. This Aadhaar appears ${group.length} times across schemes.`;

      flags.push({
        transaction_id: txn.id,
        beneficiary_id: txn.beneficiary_id,
        aadhaar: txn.aadhaar,
        name: txn.name,
        scheme: txn.scheme,
        district: txn.district,
        amount: txn.amount,
        transaction_date: txn.transaction_date,
        leakage_type: 'CROSS_SCHEME',
        risk_score: baseScore,
        risk_reason: riskReason,
        evidence_json: JSON.stringify({
          aadhaar: aadhaar,
          schemes_enrolled: schemes,
          scheme_count: schemeCount,
          total_transactions: group.length,
          total_amount_disbursed: totalAmount,
          occurrences: group.map(t => ({
            id: t.id,
            scheme: t.scheme,
            amount: t.amount,
            date: t.transaction_date,
            district: t.district
          }))
        })
      });
    }
  }

  return flags;
}
