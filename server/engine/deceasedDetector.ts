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

  for (const txn of transactions) {
    // Only EXACT Aadhaar Match
    const matchedDeath = deathByAadhaar.get(txn.aadhaar);
    if (!matchedDeath) continue;

    const txnDate = new Date(txn.transaction_date);
    const deathDate = new Date(matchedDeath.death_date);
    
    // Transaction AFTER this date -> FRAUD
    if (txnDate <= deathDate) continue;

    const daysSinceDeath = Math.floor((txnDate.getTime() - deathDate.getTime()) / (1000 * 60 * 60 * 24));

    const riskScore = 100; // Critical Fraud
    const riskReason = `Beneficiary ${txn.name} (Aadhaar: ${txn.aadhaar}) is registered deceased since ` +
        `${matchedDeath.death_date}. Transaction of ₹${txn.amount} occurred ${daysSinceDeath} days ` +
        `after death. Scheme: ${txn.scheme}.`;

    const evidence = {
      detection_method: 'AADHAAR_EXACT',
      death_date: matchedDeath.death_date,
      transaction_date: txn.transaction_date,
      days_since_death: daysSinceDeath,
      death_register_name: matchedDeath.name,
      death_aadhaar: matchedDeath.aadhaar,
      transaction_amount: txn.amount,
      was_withdrawn: String(txn.withdrawn) === '1'
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
