// Core metric card type
export interface Metric {
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: string; isUp: boolean };
  icon?: string;
  color?: string;
}

// Frontend case display type
export interface Case {
  id: number;
  transaction_id: number;
  beneficiary_id: string;
  aadhaar: string;
  name: string;
  scheme: string;
  district: string;
  amount: number;
  transaction_date: string;
  leakage_type: LeakageType;
  risk_score: number;
  risk_reason: string;
  evidence_json?: string;
  status: CaseStatus;
  assigned_to: string | null;
  verification_remarks: string | null;
  verification_lat: number | null;
  verification_lng: number | null;
  verification_timestamp: string | null;
  date_flagged: string;
}

export type LeakageType = 'DECEASED' | 'DUPLICATE' | 'UNWITHDRAWN' | 'CROSS_SCHEME' | 'SUSPICIOUS_ACCOUNT';

export type CaseStatus = 'Flagged' | 'Reviewing' | 'Verified' | 'Fraud' | 'Cleared';

export interface Transaction {
  id: number;
  beneficiary_id: string;
  aadhaar: string;
  name: string;
  name_normalized: string;
  scheme: string;
  district: string;
  amount: number;
  transaction_date: string;
  withdrawn: number;
  status: 'SUCCESS' | 'FAILED';
}

export interface AnalyticsSummary {
  total_transactions: number;
  successful_transactions: number;
  total_flagged: number;
  action_required: number;
  high_risk_cases: number;
  total_disbursed: number;
  flagged_amount: number;
  leakage_percentage: string;
}

export interface DistrictHeatmapItem {
  district: string;
  flagged_count: number;
  avg_risk_score: number;
  max_risk_score: number;
  total_amount_at_risk: number;
  deceased_count: number;
  duplicate_count: number;
  unwithdrawn_count: number;
  cross_scheme_count: number;
  high_risk_count: number;
}

export interface ProcessingRun {
  id: number;
  run_type: string;
  transactions_processed: number;
  cases_flagged: number;
  duration_ms: number;
  status: string;
  started_at: string;
  completed_at: string;
}

export interface CaseEvidence {
  detection_method: string;
  name_similarity_pct?: string;
  death_date?: string;
  transaction_date?: string;
  days_since_death?: number;
  matched_with_name?: string;
  matched_with_aadhaar?: string;
  schemes_enrolled?: string[];
  total_amount_disbursed?: number;
  [key: string]: any;
}
