export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Profile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  opening_balance: number; // Stored as integer (Rupiah)
  opening_balance_date: string; // YYYY-MM-DD (2026-07-31)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  type: CategoryType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionAttachment {
  id: string;
  transaction_id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface Transaction {
  id: string;
  transaction_number: string;
  transaction_date: string; // YYYY-MM-DD
  type: TransactionType;
  source_account_id?: string | null;
  destination_account_id?: string | null;
  category_id?: string | null;
  amount: number; // Stored as integer
  description: string;
  note?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  
  // Populated relations
  source_account?: Account | null;
  destination_account?: Account | null;
  category?: Category | null;
  attachments?: TransactionAttachment[];
}

export interface LegacySummary {
  id: string;
  period_start: string;
  period_end: string;
  total_income: number | null;
  total_expense: number | null;
  closing_balance: number;
  note?: string | null;
}

export interface AccountBalanceSummary {
  account: Account;
  current_balance: number;
  total_income: number;
  total_expense: number;
  total_transfer_in: number;
  total_transfer_out: number;
}

export interface MonthlyReportSummary {
  period: string; // YYYY-MM
  opening_balance: number;
  total_income: number;
  total_expense: number;
  surplus_deficit: number;
  closing_balance: number;
  account_breakdown: {
    account_id: string;
    account_code: string;
    account_name: string;
    opening_balance: number;
    income: number;
    expense: number;
    transfer_in: number;
    transfer_out: number;
    closing_balance: number;
  }[];
  income_by_category: {
    category_id: string;
    category_code: string;
    category_name: string;
    total: number;
  }[];
  expense_by_category: {
    category_id: string;
    category_code: string;
    category_name: string;
    total: number;
  }[];
  transactions: Transaction[];
}

export interface YearlyReportRow {
  period: string; // e.g. "Posisi Saldo Awal / Jan-Jul" or "Agustus 2026"
  period_key?: string; // "2026-08"
  is_legacy?: boolean;
  opening_balance: number;
  income: number;
  expense: number;
  net: number;
  closing_balance: number;
}

export interface YearlyReportSummary {
  year: number;
  opening_balance: number;
  total_income: number;
  total_expense: number;
  net_surplus_deficit: number;
  closing_balance: number;
  rows: YearlyReportRow[];
}

export interface AppSetting {
  id?: string;
  key: string;
  value: string;
  updated_at?: string;
  updated_by?: string;
}

export interface BrandIdentityConfig {
  appName: string;
  appSubtitle: string;
  logoUrl?: string | null;
}

