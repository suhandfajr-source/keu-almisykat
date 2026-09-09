import { Account, Category, MonthlyReportSummary, Transaction, YearlyReportRow, YearlyReportSummary } from '@/types/finance';

/**
 * Format integer amount to Indonesian Rupiah representation: Rp238.957.146
 */
export function formatRupiah(amount: number | bigint, options: { withPrefix?: boolean; showSign?: boolean } = {}): string {
  const { withPrefix = true, showSign = false } = options;
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  const isNegative = num < 0;
  const absVal = Math.abs(num);
  
  // Format with dots as thousand separators
  const formattedAbs = absVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  let result = formattedAbs;
  if (withPrefix) {
    result = `Rp${formattedAbs}`;
  }
  
  if (isNegative) {
    return `-${result}`;
  } else if (showSign && num > 0) {
    return `+${result}`;
  }
  
  return result;
}

/**
 * Parse string or formatted Rupiah input into clean integer
 */
export function parseRupiahInput(input: string | number): number {
  if (typeof input === 'number') {
    return Math.round(input);
  }
  const clean = input.replace(/[^0-9-]/g, '');
  if (!clean || clean === '-') return 0;
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate current balance for each account and system total
 */
export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[],
  asOfDate?: string
): {
  accountBalances: Record<string, number>;
  accountSummaries: {
    account: Account;
    current_balance: number;
    total_income: number;
    total_expense: number;
    total_transfer_in: number;
    total_transfer_out: number;
  }[];
  totalBalance: number;
} {
  const accountMap = new Map<string, Account>();
  const balances: Record<string, bigint> = {};
  const totalIncome: Record<string, bigint> = {};
  const totalExpense: Record<string, bigint> = {};
  const transferIn: Record<string, bigint> = {};
  const transferOut: Record<string, bigint> = {};

  for (const acc of accounts) {
    accountMap.set(acc.id, acc);
    balances[acc.id] = BigInt(acc.opening_balance);
    totalIncome[acc.id] = 0n;
    totalExpense[acc.id] = 0n;
    transferIn[acc.id] = 0n;
    transferOut[acc.id] = 0n;
  }

  // Filter transactions up to asOfDate if provided
  const relevantTrx = asOfDate
    ? transactions.filter((t) => t.transaction_date <= asOfDate)
    : transactions;

  for (const trx of relevantTrx) {
    const amt = BigInt(trx.amount);
    if (trx.type === 'INCOME') {
      if (trx.destination_account_id && balances[trx.destination_account_id] !== undefined) {
        balances[trx.destination_account_id] += amt;
        totalIncome[trx.destination_account_id] += amt;
      }
    } else if (trx.type === 'EXPENSE') {
      if (trx.source_account_id && balances[trx.source_account_id] !== undefined) {
        balances[trx.source_account_id] -= amt;
        totalExpense[trx.source_account_id] += amt;
      }
    } else if (trx.type === 'TRANSFER') {
      if (trx.source_account_id && balances[trx.source_account_id] !== undefined) {
        balances[trx.source_account_id] -= amt;
        transferOut[trx.source_account_id] += amt;
      }
      if (trx.destination_account_id && balances[trx.destination_account_id] !== undefined) {
        balances[trx.destination_account_id] += amt;
        transferIn[trx.destination_account_id] += amt;
      }
    }
  }

  let totalSystemBigInt = 0n;
  const summaries = accounts.map((acc) => {
    const bal = balances[acc.id] || 0n;
    totalSystemBigInt += bal;
    return {
      account: acc,
      current_balance: Number(bal),
      total_income: Number(totalIncome[acc.id] || 0n),
      total_expense: Number(totalExpense[acc.id] || 0n),
      total_transfer_in: Number(transferIn[acc.id] || 0n),
      total_transfer_out: Number(transferOut[acc.id] || 0n),
    };
  });

  const numBalances: Record<string, number> = {};
  for (const [id, val] of Object.entries(balances)) {
    numBalances[id] = Number(val);
  }

  return {
    accountBalances: numBalances,
    accountSummaries: summaries,
    totalBalance: Number(totalSystemBigInt),
  };
}

/**
 * Calculate Monthly Report for a given YYYY-MM
 */
export function generateMonthlyReport(
  accounts: Account[],
  categories: Category[],
  transactions: Transaction[],
  yearMonth: string // e.g. "2026-08"
): MonthlyReportSummary {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // Month boundary dates in Asia/Jakarta local business format YYYY-MM-DD
  const monthPadded = month.toString().padStart(2, '0');
  const startDate = `${year}-${monthPadded}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${monthPadded}-${lastDay.toString().padStart(2, '0')}`;

  // 1. Calculate opening balance as of end of previous month
  // Transactions strictly before startDate
  const prevTrx = transactions.filter((t) => t.transaction_date < startDate);
  const periodTrx = transactions.filter(
    (t) => t.transaction_date >= startDate && t.transaction_date <= endDate
  );

  // Account balances right before the current month starts
  const openingCalc = calculateAccountBalances(accounts, prevTrx);
  const monthOpeningBalance = openingCalc.totalBalance;

  // Account period breakdown
  const accountBreakdown = accounts.map((acc) => {
    const accOpening = openingCalc.accountBalances[acc.id] ?? acc.opening_balance;
    let income = 0n;
    let expense = 0n;
    let transferIn = 0n;
    let transferOut = 0n;

    for (const trx of periodTrx) {
      const amt = BigInt(trx.amount);
      if (trx.type === 'INCOME' && trx.destination_account_id === acc.id) {
        income += amt;
      } else if (trx.type === 'EXPENSE' && trx.source_account_id === acc.id) {
        expense += amt;
      } else if (trx.type === 'TRANSFER') {
        if (trx.source_account_id === acc.id) {
          transferOut += amt;
        }
        if (trx.destination_account_id === acc.id) {
          transferIn += amt;
        }
      }
    }

    const accClosing = BigInt(accOpening) + income - expense + transferIn - transferOut;

    return {
      account_id: acc.id,
      account_code: acc.code,
      account_name: acc.name,
      opening_balance: accOpening,
      income: Number(income),
      expense: Number(expense),
      transfer_in: Number(transferIn),
      transfer_out: Number(transferOut),
      closing_balance: Number(accClosing),
    };
  });

  // Calculate total income and expense in period (transfers strictly excluded)
  let totalIncomeBigInt = 0n;
  let totalExpenseBigInt = 0n;
  const incomeCatTotals: Record<string, bigint> = {};
  const expenseCatTotals: Record<string, bigint> = {};

  for (const trx of periodTrx) {
    const amt = BigInt(trx.amount);
    if (trx.type === 'INCOME') {
      totalIncomeBigInt += amt;
      if (trx.category_id) {
        incomeCatTotals[trx.category_id] = (incomeCatTotals[trx.category_id] || 0n) + amt;
      }
    } else if (trx.type === 'EXPENSE') {
      totalExpenseBigInt += amt;
      if (trx.category_id) {
        expenseCatTotals[trx.category_id] = (expenseCatTotals[trx.category_id] || 0n) + amt;
      }
    }
  }

  const totalIncome = Number(totalIncomeBigInt);
  const totalExpense = Number(totalExpenseBigInt);
  const surplusDeficit = totalIncome - totalExpense;
  const closingBalance = monthOpeningBalance + surplusDeficit;

  // Income by category
  const incomeCategories = categories
    .filter((c) => c.type === 'INCOME')
    .map((c) => ({
      category_id: c.id,
      category_code: c.code,
      category_name: c.name,
      total: Number(incomeCatTotals[c.id] || 0n),
    }))
    .sort((a, b) => (b.total !== a.total ? b.total - a.total : a.category_code.localeCompare(b.category_code)));

  // Expense by category
  const expenseCategories = categories
    .filter((c) => c.type === 'EXPENSE')
    .map((c) => ({
      category_id: c.id,
      category_code: c.code,
      category_name: c.name,
      total: Number(expenseCatTotals[c.id] || 0n),
    }))
    .sort((a, b) => (b.total !== a.total ? b.total - a.total : a.category_code.localeCompare(b.category_code)));

  return {
    period: yearMonth,
    opening_balance: monthOpeningBalance,
    total_income: totalIncome,
    total_expense: totalExpense,
    surplus_deficit: surplusDeficit,
    closing_balance: closingBalance,
    account_breakdown: accountBreakdown,
    income_by_category: incomeCategories,
    expense_by_category: expenseCategories,
    transactions: periodTrx.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)),
  };
}

/**
 * Calculate Yearly Report
 */
export function generateYearlyReport(
  accounts: Account[],
  categories: Category[],
  transactions: Transaction[],
  year: number
): YearlyReportSummary {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const rows: YearlyReportRow[] = [];
  let yearlyOpening = 0;
  let yearTotalIncome = 0;
  let yearTotalExpense = 0;

  if (year === 2026) {
    // Cut-off position per 31 July 2026
    const totalOpeningBal = accounts.reduce((acc, a) => acc + a.opening_balance, 0);
    yearlyOpening = totalOpeningBal;

    rows.push({
      period: 'Posisi Saldo Awal / Jan-Jul',
      is_legacy: true,
      opening_balance: totalOpeningBal,
      income: 0,
      expense: 0,
      net: 0,
      closing_balance: totalOpeningBal,
    });

    let rollingClosing = totalOpeningBal;

    // Months August (08) to December (12)
    for (let m = 8; m <= 12; m++) {
      const monthKey = `2026-${m.toString().padStart(2, '0')}`;
      const rep = generateMonthlyReport(accounts, categories, transactions, monthKey);
      
      yearTotalIncome += rep.total_income;
      yearTotalExpense += rep.total_expense;
      rollingClosing = rep.closing_balance;

      rows.push({
        period: `${monthNames[m - 1]} 2026`,
        period_key: monthKey,
        is_legacy: false,
        opening_balance: rep.opening_balance,
        income: rep.total_income,
        expense: rep.total_expense,
        net: rep.surplus_deficit,
        closing_balance: rep.closing_balance,
      });
    }

    return {
      year: 2026,
      opening_balance: yearlyOpening,
      total_income: yearTotalIncome,
      total_expense: yearTotalExpense,
      net_surplus_deficit: yearTotalIncome - yearTotalExpense,
      closing_balance: rollingClosing,
      rows: rows,
    };
  } else {
    // Other years: months 1 to 12
    const firstDay = `${year}-01-01`;
    const prevTrx = transactions.filter((t) => t.transaction_date < firstDay);
    const startBal = calculateAccountBalances(accounts, prevTrx).totalBalance;
    yearlyOpening = startBal;
    let rollingClosing = startBal;

    for (let m = 1; m <= 12; m++) {
      const monthKey = `${year}-${m.toString().padStart(2, '0')}`;
      const rep = generateMonthlyReport(accounts, categories, transactions, monthKey);

      yearTotalIncome += rep.total_income;
      yearTotalExpense += rep.total_expense;
      rollingClosing = rep.closing_balance;

      rows.push({
        period: `${monthNames[m - 1]} ${year}`,
        period_key: monthKey,
        is_legacy: false,
        opening_balance: rep.opening_balance,
        income: rep.total_income,
        expense: rep.total_expense,
        net: rep.surplus_deficit,
        closing_balance: rep.closing_balance,
      });
    }

    return {
      year,
      opening_balance: yearlyOpening,
      total_income: yearTotalIncome,
      total_expense: yearTotalExpense,
      net_surplus_deficit: yearTotalIncome - yearTotalExpense,
      closing_balance: rollingClosing,
      rows,
    };
  }
}

/**
 * Generate sequential transaction number TRX-YYMM-XXXX
 */
export function formatTransactionNumber(year: number, month: number, sequence: number): string {
  const yy = (year % 100).toString().padStart(2, '0');
  const mm = month.toString().padStart(2, '0');
  const seq = sequence.toString().padStart(4, '0');
  return `TRX-${yy}${mm}-${seq}`;
}
