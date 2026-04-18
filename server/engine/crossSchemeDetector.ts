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
    const baseScore = schemeCount === 2 ? 72 : schemeCount === 3 ? 88 : 95;
    const totalAmount = group.reduce((s, t) => s + t.amount, 0);

    for (const txn of group) {
      const isFirst = schemeFirstMap.get(txn.scheme)?.id === txn.id;
      if (isFirst && schemeCount === 2) continue;

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

  // BONUS: Fuzzy name cross-scheme detection
  const schemeMap = new Map<string, typeof transactions[0][]>();
  for (const txn of transactions) {
    if (!schemeMap.has(txn.scheme)) schemeMap.set(txn.scheme, []);
    schemeMap.get(txn.scheme)!.push(txn);
  }

  const schemeNames = [...schemeMap.keys()];
  const alreadyCrossFlagged = new Set(flags.map(f => f.transaction_id));

  for (let i = 0; i < schemeNames.length - 1; i++) {
    for (let j = i + 1; j < schemeNames.length; j++) {
      const schemeA = schemeMap.get(schemeNames[i])!;
      const schemeB = schemeMap.get(schemeNames[j])!;

      const sampleA = schemeA.slice(0, 300);
      const sampleB = schemeB.slice(0, 300);

      for (const txnA of sampleA) {
        for (const txnB of sampleB) {
          if (txnA.aadhaar === txnB.aadhaar) continue;
          if (alreadyCrossFlagged.has(txnB.id)) continue;

          const sim = nameSimilarity(txnA.name, txnB.name);
          if (sim < CROSS_SCHEME_NAME_THRESHOLD) continue;

          const sameDistrict = txnA.district === txnB.district;
          const riskScore = Math.min(91, Math.floor(sim * 0.85 + (sameDistrict ? 10 : 3)));

          alreadyCrossFlagged.add(txnB.id);
          flags.push({
            transaction_id: txnB.id,
            beneficiary_id: txnB.beneficiary_id,
            aadhaar: txnB.aadhaar,
            name: txnB.name,
            scheme: txnB.scheme,
            district: txnB.district,
            amount: txnB.amount,
            transaction_date: txnB.transaction_date,
            leakage_type: 'CROSS_SCHEME',
            risk_score: riskScore,
            risk_reason:
              `Cross-scheme fuzzy identity match: "${txnA.name}" in ${txnA.scheme} matches ` +
              `"${txnB.name}" in ${txnB.scheme} with ${sim.toFixed(1)}% name similarity ` +
              `(Gujarati-transliteration aware). ${sameDistrict ? `Same district: ${txnA.district}.` : ''} ` +
              `Different Aadhaar: ${txnA.aadhaar} vs ${txnB.aadhaar}. Possible identity fragmentation.`,
            evidence_json: JSON.stringify({
              detection_method: 'FUZZY_NAME_CROSS_SCHEME',
              matched_txn_id: txnA.id,
              matched_name: txnA.name,
              matched_aadhaar: txnA.aadhaar,
              matched_scheme: txnA.scheme,
              name_similarity_pct: sim.toFixed(1),
              same_district: sameDistrict,
              threshold_used: CROSS_SCHEME_NAME_THRESHOLD
            })
          });
        }
      }
    }
  }

  return flags;
}
