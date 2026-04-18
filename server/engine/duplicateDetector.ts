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

  // Group by aadhaar+scheme
  const aadhaarSchemeMap = new Map<string, typeof transactions[0][]>();
  for (const txn of transactions) {
    const key = `${txn.aadhaar}__${txn.scheme}`;
    if (!aadhaarSchemeMap.has(key)) aadhaarSchemeMap.set(key, []);
    aadhaarSchemeMap.get(key)!.push(txn);
  }

  // Detect exact Aadhaar duplicates within same scheme
  for (const [key, group] of aadhaarSchemeMap.entries()) {
    if (group.length <= 1) continue;

    group.sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));
    const [first, ...rest] = group;

    for (const duplicate of rest) {
      const riskScore = 96;
      const riskReason =
        `Exact Aadhaar duplicate within scheme ${duplicate.scheme}. ` +
        `Beneficiary ${duplicate.name} (Aadhaar: ${duplicate.aadhaar}) received ` +
        `₹${duplicate.amount} on ${duplicate.transaction_date}. ` +
        `Previous payment of ₹${first.amount} already processed on ${first.transaction_date}. ` +
        `Total duplicate amount: ₹${group.reduce((s, t) => s + t.amount, 0)}.`;

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
          detection_method: 'EXACT_AADHAAR_SAME_SCHEME',
          original_transaction_id: first.id,
          original_transaction_date: first.transaction_date,
          original_amount: first.amount,
          total_occurrences: group.length,
          duplicate_count: rest.length
        })
      });
    }
  }

  // Detect fuzzy name duplicates within same scheme+district
  const schemDistrictMap = new Map<string, typeof transactions[0][]>();
  for (const txn of transactions) {
    const key = `${txn.scheme}__${txn.district}`;
    if (!schemDistrictMap.has(key)) schemDistrictMap.set(key, []);
    schemDistrictMap.get(key)!.push(txn);
  }

  const alreadyFlagged = new Set(flags.map(f => f.transaction_id));

  for (const [, group] of schemDistrictMap.entries()) {
    const limit = Math.min(group.length, 500);
    const sample = group.slice(0, limit);

    for (let i = 0; i < sample.length; i++) {
      const txnA = sample[i];
      if (alreadyFlagged.has(txnA.id)) continue;

      for (let j = i + 1; j < sample.length; j++) {
        const txnB = sample[j];
        if (alreadyFlagged.has(txnB.id)) continue;
        if (txnA.aadhaar === txnB.aadhaar) continue;

        const sim = nameSimilarity(txnA.name, txnB.name);
        if (sim < FUZZY_NAME_THRESHOLD) continue;

        const riskScore = Math.min(95, Math.floor(sim * 0.92 + 8));
        const riskReason =
          `Fuzzy name match: "${txnA.name}" vs "${txnB.name}" — ${sim.toFixed(1)}% similarity ` +
          `(Gujarati-transliteration aware). Both enrolled in ${txnB.scheme}, ${txnB.district}. ` +
          `Aadhaar: ${txnA.aadhaar} vs ${txnB.aadhaar}. Possible duplicate identity. ` +
          `Combined amount: ₹${txnA.amount + txnB.amount}.`;

        alreadyFlagged.add(txnB.id);
        flags.push({
          transaction_id: txnB.id,
          beneficiary_id: txnB.beneficiary_id,
          aadhaar: txnB.aadhaar,
          name: txnB.name,
          scheme: txnB.scheme,
          district: txnB.district,
          amount: txnB.amount,
          transaction_date: txnB.transaction_date,
          leakage_type: 'DUPLICATE',
          risk_score: riskScore,
          risk_reason: riskReason,
          evidence_json: JSON.stringify({
            detection_method: 'FUZZY_NAME_SAME_SCHEME_DISTRICT',
            matched_with_id: txnA.id,
            matched_with_name: txnA.name,
            matched_with_aadhaar: txnA.aadhaar,
            name_similarity_pct: sim.toFixed(1),
            threshold_used: FUZZY_NAME_THRESHOLD
          })
        });
      }
    }
  }

  return flags;
}
