import { FlaggedCase } from './riskEngine.js';
import { nameSimilarity } from './gujaratiNormalizer.js';

const DECEASED_NAME_THRESHOLD = 70;
const DAYS_AFTER_DEATH_PENALTY = 30;

export function detectDeceased(
  transactions: Array<{
    id: number; beneficiary_id: string; aadhaar: string; name: string;
    name_normalized: string; scheme: string; district: string; amount: number;
    transaction_date: string; withdrawn: number; status: string;
  }>,
  deathRecords: Array<{
    id: number; aadhaar: string; name: string; name_normalized: string; death_date: string;
  }>
): FlaggedCase[] {
  const flags: FlaggedCase[] = [];

  const deathByAadhaar = new Map<string, typeof deathRecords[0]>();
  for (const d of deathRecords) {
    deathByAadhaar.set(d.aadhaar, d);
  }

  const deathByName = deathRecords;

  for (const txn of transactions) {
    if (txn.status !== 'SUCCESS') continue;

    let matchedDeath: typeof deathRecords[0] | null = null;
    let matchMethod = '';
    let nameSimScore = 0;

    // Method 1: Exact Aadhaar match
    const aadhaarMatch = deathByAadhaar.get(txn.aadhaar);
    if (aadhaarMatch) {
      const txnDate = new Date(txn.transaction_date);
      const deathDate = new Date(aadhaarMatch.death_date);
      if (txnDate > deathDate) {
        matchedDeath = aadhaarMatch;
        matchMethod = 'AADHAAR_EXACT';
        nameSimScore = 100;
      }
    }

    // Method 2: Fuzzy name match
    if (!matchedDeath) {
      for (const dr of deathByName) {
        const sim = nameSimilarity(txn.name, dr.name);
        if (sim >= DECEASED_NAME_THRESHOLD) {
          const txnDate = new Date(txn.transaction_date);
          const deathDate = new Date(dr.death_date);
          if (txnDate > deathDate) {
            matchedDeath = dr;
            matchMethod = 'FUZZY_NAME';
            nameSimScore = sim;
            break;
          }
        }
      }
    }

    if (!matchedDeath) continue;

    const txnDate = new Date(txn.transaction_date);
    const deathDate = new Date(matchedDeath.death_date);
    const daysSinceDeath = Math.floor((txnDate.getTime() - deathDate.getTime()) / (1000 * 60 * 60 * 24));
    const monthsAfterDeath = Math.floor(daysSinceDeath / 30);

    let riskScore = matchMethod === 'AADHAAR_EXACT' ? 92 : Math.floor(nameSimScore * 0.9);
    riskScore = Math.min(100, riskScore + Math.min(monthsAfterDeath * 2, 8));
    if (txn.withdrawn === 0) riskScore = Math.min(100, riskScore + 5);

    const riskReason =
      matchMethod === 'AADHAAR_EXACT'
        ? `Beneficiary ${txn.name} (Aadhaar: ${txn.aadhaar}) is registered deceased since ` +
          `${matchedDeath.death_date}. Transaction of ₹${txn.amount} occurred ${daysSinceDeath} days ` +
          `after death. Scheme: ${txn.scheme}.`
        : `Name similarity ${nameSimScore.toFixed(1)}% match with deceased record ` +
          `"${matchedDeath.name}" (death: ${matchedDeath.death_date}). Transaction ₹${txn.amount} ` +
          `occurred ${daysSinceDeath} days after death. Scheme: ${txn.scheme}.`;

    const evidence = {
      detection_method: matchMethod,
      name_similarity_pct: nameSimScore.toFixed(1),
      death_date: matchedDeath.death_date,
      transaction_date: txn.transaction_date,
      days_since_death: daysSinceDeath,
      death_register_name: matchedDeath.name,
      death_aadhaar: matchedDeath.aadhaar,
      transaction_amount: txn.amount,
      was_withdrawn: txn.withdrawn === 1
    };

    flags.push({
      transaction_id: txn.id,
      beneficiary_id: txn.beneficiary_id,
      aadhaar: txn.aadhaar,
      name: txn.name,
      scheme: txn.scheme,
      district: txn.district,
      amount: txn.amount,
      transaction_date: txn.transaction_date,
      leakage_type: 'DECEASED',
      risk_score: riskScore,
      risk_reason: riskReason,
      evidence_json: JSON.stringify(evidence)
    });
  }

  return flags;
}
