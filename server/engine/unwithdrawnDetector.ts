import { FlaggedCase } from './riskEngine.js';

const UNWITHDRAWN_DAYS_THRESHOLD = 90;
const HIGH_RISK_DAYS = 180;

export function detectUnwithdrawn(
  transactions: Array<{
    id: number; beneficiary_id: string; aadhaar: string; name: string;
    name_normalized: string; scheme: string; district: string; amount: number;
    transaction_date: string; withdrawn: number; status: string;
  }>
): FlaggedCase[] {
  const flags: FlaggedCase[] = [];
  const today = new Date();

  for (const txn of transactions) {
    if (String(txn.withdrawn) !== '0') continue;

    const txnDate = new Date(txn.transaction_date);
    const daysSince = Math.floor((today.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24));

    let riskScore: number;
    if (daysSince >= HIGH_RISK_DAYS) {
      riskScore = Math.min(88, 60 + Math.floor((daysSince - HIGH_RISK_DAYS) / 30));
    } else {
      riskScore = Math.floor(45 + (daysSince) / 3);
    }

    const riskReason =
      `Funds unclaimed for ${daysSince} days. ₹${txn.amount} credited to ` +
      `${txn.name} (Aadhaar: ${txn.aadhaar}) on ${txn.transaction_date} under ` +
      `${txn.scheme} scheme but never withdrawn. Possible: beneficiary unnotified, ` +
      `account inactive, or middleman interception. District: ${txn.district}.`;

    flags.push({
      transaction_id: txn.id,
      beneficiary_id: txn.beneficiary_id,
      aadhaar: txn.aadhaar,
      name: txn.name,
      scheme: txn.scheme,
      district: txn.district,
      amount: txn.amount,
      transaction_date: txn.transaction_date,
      leakage_type: 'UNWITHDRAWN',
      risk_score: riskScore,
      risk_reason: riskReason,
      evidence_json: JSON.stringify({
        days_since_transaction: daysSince,
        threshold_days: UNWITHDRAWN_DAYS_THRESHOLD,
        transaction_date: txn.transaction_date,
        amount_at_risk: txn.amount,
        scheme: txn.scheme
      })
    });
  }

  return flags;
}
