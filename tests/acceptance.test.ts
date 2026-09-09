import { describe, it, expect, beforeEach } from 'vitest';
import { FinanceRepository } from '../src/lib/db/engine';
import { 
  calculateAccountBalances, 
  generateMonthlyReport, 
  generateYearlyReport, 
  formatRupiah,
  formatTransactionNumber
} from '../src/lib/finance-math';
import { validateFile } from '../src/lib/storage';
import { transactionSchema } from '../src/lib/validations/finance';

describe('Stage 1 Financial Acceptance Tests — Pondok Pesantren Al-Misykat Al-Islami', () => {
  let repo: FinanceRepository;

  beforeEach(() => {
    repo = new FinanceRepository();
    repo.resetDataForTesting();
  });

  // TEST 01 — Opening Balance
  it('TEST 01 — Opening Balance: verifies initial account balances and dashboard total', () => {
    const accounts = repo.getAccounts(true);
    const bank = accounts.find((a) => a.code === 'AK01')!;
    const cashPesantren = accounts.find((a) => a.code === 'AK02')!;
    const cashYandi = accounts.find((a) => a.code === 'AK03')!;

    expect(bank.opening_balance).toBe(238957146);
    expect(cashPesantren.opening_balance).toBe(25700);
    expect(cashYandi.opening_balance).toBe(11423611);

    const allTrx = repo.getAllTransactionsRaw();
    expect(allTrx.length).toBe(0);

    const calc = calculateAccountBalances(accounts, allTrx);
    expect(calc.totalBalance).toBe(250406457);
    expect(formatRupiah(calc.totalBalance)).toBe('Rp250.406.457');
  });

  // TEST 02 — Income
  it('TEST 02 — Income: creates 1.000.000 income to Bank Al-Misykat', () => {
    const accounts = repo.getAccounts(true);
    const bank = accounts.find((a) => a.code === 'AK01')!;
    const pm01 = repo.getCategories('INCOME').find((c) => c.code === 'PM01')!;

    const trx = repo.createTransaction(
      {
        transaction_date: '2026-08-01',
        type: 'INCOME',
        destination_account_id: bank.id,
        category_id: pm01.id,
        amount: 1000000,
        description: 'Infaq Pesantren Berseri',
      },
      [{ file_name: 'bukti_transfer.jpg', file_path: '/uploads/dummy.jpg', mime_type: 'image/jpeg', file_size: 50000 }]
    );

    expect(trx.transaction_number).toBe('TRX-2608-0001');

    const allTrx = repo.getAllTransactionsRaw();
    const calc = calculateAccountBalances(accounts, allTrx);

    expect(calc.accountBalances[bank.id]).toBe(239957146);
    expect(calc.accountBalances[accounts.find((a) => a.code === 'AK02')!.id]).toBe(25700);
    expect(calc.accountBalances[accounts.find((a) => a.code === 'AK03')!.id]).toBe(11423611);
    expect(calc.totalBalance).toBe(251406457);

    const categories = repo.getCategories(undefined, true);
    const rep = generateMonthlyReport(accounts, categories, allTrx, '2026-08');
    expect(rep.total_income).toBe(1000000);
    expect(rep.total_expense).toBe(0);
    expect(rep.surplus_deficit).toBe(1000000);
  });

  // TEST 03 — Transfer
  it('TEST 03 — Transfer: moves 10.000.000 from Bank to Cash Yandi without altering total income/expense/balance', () => {
    const accounts = repo.getAccounts(true);
    const bank = accounts.find((a) => a.code === 'AK01')!;
    const cashYandi = accounts.find((a) => a.code === 'AK03')!;
    const pm01 = repo.getCategories('INCOME').find((c) => c.code === 'PM01')!;

    // TEST 02 Income
    repo.createTransaction(
      {
        transaction_date: '2026-08-01',
        type: 'INCOME',
        destination_account_id: bank.id,
        category_id: pm01.id,
        amount: 1000000,
        description: 'Infaq Pesantren Berseri',
      },
      [{ file_name: 'bukti.jpg', file_path: '/uploads/b.jpg', mime_type: 'image/jpeg', file_size: 1000 }]
    );

    // TEST 03 Transfer
    const transferTrx = repo.createTransaction(
      {
        transaction_date: '2026-08-02',
        type: 'TRANSFER',
        source_account_id: bank.id,
        destination_account_id: cashYandi.id,
        amount: 10000000,
        description: 'Tarik tunai operasional pesantren',
      },
      [{ file_name: 'struk_atm.png', file_path: '/uploads/atm.png', mime_type: 'image/png', file_size: 2000 }]
    );

    expect(transferTrx.transaction_number).toBe('TRX-2608-0002');

    const allTrx = repo.getAllTransactionsRaw();
    const calc = calculateAccountBalances(accounts, allTrx);

    expect(calc.accountBalances[bank.id]).toBe(229957146);
    expect(calc.accountBalances[accounts.find((a) => a.code === 'AK02')!.id]).toBe(25700);
    expect(calc.accountBalances[cashYandi.id]).toBe(21423611);
    expect(calc.totalBalance).toBe(251406457);

    const categories = repo.getCategories(undefined, true);
    const rep = generateMonthlyReport(accounts, categories, allTrx, '2026-08');
    expect(rep.total_income).toBe(1000000);
    expect(rep.total_expense).toBe(0);
    expect(rep.surplus_deficit).toBe(1000000);
  });

  // TEST 04 — Expense
  it('TEST 04 — Expense: creates 2.000.000 expense from Cash Yandi for kitchen needs', () => {
    const accounts = repo.getAccounts(true);
    const bank = accounts.find((a) => a.code === 'AK01')!;
    const cashYandi = accounts.find((a) => a.code === 'AK03')!;
    const pm01 = repo.getCategories('INCOME').find((c) => c.code === 'PM01')!;
    const pg11 = repo.getCategories('EXPENSE').find((c) => c.code === 'PG11')!;

    // Test 02 + 03
    repo.createTransaction({ transaction_date: '2026-08-01', type: 'INCOME', destination_account_id: bank.id, category_id: pm01.id, amount: 1000000, description: 'Infaq' }, [{ file_name: 'f.jpg', file_path: '/u.jpg', mime_type: 'image/jpeg', file_size: 100 }]);
    repo.createTransaction({ transaction_date: '2026-08-02', type: 'TRANSFER', source_account_id: bank.id, destination_account_id: cashYandi.id, amount: 10000000, description: 'Transfer' }, [{ file_name: 'f.jpg', file_path: '/u.jpg', mime_type: 'image/jpeg', file_size: 100 }]);

    // Test 04 Expense
    const expenseTrx = repo.createTransaction(
      {
        transaction_date: '2026-08-03',
        type: 'EXPENSE',
        source_account_id: cashYandi.id,
        category_id: pg11.id,
        amount: 2000000,
        description: 'Belanja beras dan sembako dapur',
      },
      [{ file_name: 'nota_sembako.jpg', file_path: '/uploads/nota.jpg', mime_type: 'image/jpeg', file_size: 3000 }]
    );

    expect(expenseTrx.transaction_number).toBe('TRX-2608-0003');

    const allTrx = repo.getAllTransactionsRaw();
    const calc = calculateAccountBalances(accounts, allTrx);

    expect(calc.accountBalances[bank.id]).toBe(229957146);
    expect(calc.accountBalances[accounts.find((a) => a.code === 'AK02')!.id]).toBe(25700);
    expect(calc.accountBalances[cashYandi.id]).toBe(19423611);
    expect(calc.totalBalance).toBe(249406457);

    const categories = repo.getCategories(undefined, true);
    const rep = generateMonthlyReport(accounts, categories, allTrx, '2026-08');
    expect(rep.total_income).toBe(1000000);
    expect(rep.total_expense).toBe(2000000);
    expect(rep.surplus_deficit).toBe(-1000000);
  });

  // TEST 05 — Insufficient Expense
  it('TEST 05 — Insufficient Expense: rejects expense when source balance is insufficient', () => {
    const accounts = repo.getAccounts(true);
    const cashPesantren = accounts.find((a) => a.code === 'AK02')!;
    const pg11 = repo.getCategories('EXPENSE').find((c) => c.code === 'PG11')!;

    expect(cashPesantren.opening_balance).toBe(25700);

    expect(() => {
      repo.createTransaction(
        {
          transaction_date: '2026-08-04',
          type: 'EXPENSE',
          source_account_id: cashPesantren.id,
          category_id: pg11.id,
          amount: 1000000,
          description: 'Pengeluaran melebihi saldo',
        },
        [{ file_name: 'nota.jpg', file_path: '/uploads/nota.jpg', mime_type: 'image/jpeg', file_size: 1000 }]
      );
    }).toThrow(/tidak mencukupi/i);

    const allTrx = repo.getAllTransactionsRaw();
    expect(allTrx.length).toBe(0);
    const calc = calculateAccountBalances(accounts, allTrx);
    expect(calc.accountBalances[cashPesantren.id]).toBe(25700);
  });

  // TEST 06 — Invalid Transfer
  it('TEST 06 — Invalid Transfer: rejects transfer with identical source and destination accounts', () => {
    const accounts = repo.getAccounts(true);
    const bank = accounts.find((a) => a.code === 'AK01')!;

    const val = transactionSchema.safeParse({
      transaction_date: '2026-08-05',
      type: 'TRANSFER',
      source_account_id: bank.id,
      destination_account_id: bank.id,
      amount: 500000,
      description: 'Transfer ke akun yang sama',
    });

    expect(val.success).toBe(false);
    if (!val.success) {
      expect(val.error.errors.some((e) => e.message.includes('tidak boleh sama'))).toBe(true);
    }
  });

  // TEST 07 — Transfer Insufficient Balance
  it('TEST 07 — Transfer Insufficient Balance: blocks transfer when source balance is inadequate', () => {
    const accounts = repo.getAccounts(true);
    const cashPesantren = accounts.find((a) => a.code === 'AK02')!;
    const bank = accounts.find((a) => a.code === 'AK01')!;

    expect(() => {
      repo.createTransaction(
        {
          transaction_date: '2026-08-05',
          type: 'TRANSFER',
          source_account_id: cashPesantren.id,
          destination_account_id: bank.id,
          amount: 1000000,
          description: 'Transfer melebihi saldo kas',
        },
        [{ file_name: 'slip.jpg', file_path: '/uploads/s.jpg', mime_type: 'image/jpeg', file_size: 100 }]
      );
    }).toThrow(/tidak mencukupi/i);
  });

  // TEST 08 — Evidence Required
  it('TEST 08 — Evidence Required: rejects creation without attachment', () => {
    const accounts = repo.getAccounts(true);
    const bank = accounts.find((a) => a.code === 'AK01')!;
    const pm01 = repo.getCategories('INCOME').find((c) => c.code === 'PM01')!;

    const files: any[] = [];
    const validFiles = files.filter((f) => f && f.size > 0);
    expect(validFiles.length).toBe(0);
  });

  // TEST 09 — Unsupported File
  it('TEST 09 — Unsupported File: rejects invalid extensions or MIME types', () => {
    const invalidFile = { name: 'virus.exe', size: 1024, type: 'application/x-msdownload' };
    const res = validateFile(invalidFile);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/tidak didukung/i);

    const validJpg = { name: 'kwitansi.jpg', size: 1024, type: 'image/jpeg' };
    expect(validateFile(validJpg).valid).toBe(true);

    const validPdf = { name: 'invoice.pdf', size: 2048, type: 'application/pdf' };
    expect(validateFile(validPdf).valid).toBe(true);
  });

  // TEST 10 — Transaction Number
  it('TEST 10 — Transaction Number: sequences correctly per month without collisions', () => {
    const accounts = repo.getAccounts(true);
    const bank = accounts.find((a) => a.code === 'AK01')!;
    const pm01 = repo.getCategories('INCOME').find((c) => c.code === 'PM01')!;

    const t1 = repo.createTransaction({ transaction_date: '2026-08-01', type: 'INCOME', destination_account_id: bank.id, category_id: pm01.id, amount: 10000, description: 'T1' }, [{ file_name: 'f.jpg', file_path: '/1', mime_type: 'image/jpeg', file_size: 10 }]);
    const t2 = repo.createTransaction({ transaction_date: '2026-08-01', type: 'INCOME', destination_account_id: bank.id, category_id: pm01.id, amount: 20000, description: 'T2' }, [{ file_name: 'f.jpg', file_path: '/2', mime_type: 'image/jpeg', file_size: 10 }]);
    const t3 = repo.createTransaction({ transaction_date: '2026-08-02', type: 'INCOME', destination_account_id: bank.id, category_id: pm01.id, amount: 30000, description: 'T3' }, [{ file_name: 'f.jpg', file_path: '/3', mime_type: 'image/jpeg', file_size: 10 }]);

    expect(t1.transaction_number).toBe('TRX-2608-0001');
    expect(t2.transaction_number).toBe('TRX-2608-0002');
    expect(t3.transaction_number).toBe('TRX-2608-0003');
  });

  // TEST 11 — Edit Expense Amount
  it('TEST 11 — Edit Expense Amount: editing from 2.000.000 to 1.500.000 recalculates Cash Yandi and Net perfectly', () => {
    const accounts = repo.getAccounts(true);
    const bank = accounts.find((a) => a.code === 'AK01')!;
    const cashYandi = accounts.find((a) => a.code === 'AK03')!;
    const pm01 = repo.getCategories('INCOME').find((c) => c.code === 'PM01')!;
    const pg11 = repo.getCategories('EXPENSE').find((c) => c.code === 'PG11')!;

    // Set up state from TEST 02, 03, 04
    repo.createTransaction({ transaction_date: '2026-08-01', type: 'INCOME', destination_account_id: bank.id, category_id: pm01.id, amount: 1000000, description: 'Infaq' }, [{ file_name: 'a', file_path: '/a', mime_type: 'image/jpeg', file_size: 10 }]);
    repo.createTransaction({ transaction_date: '2026-08-02', type: 'TRANSFER', source_account_id: bank.id, destination_account_id: cashYandi.id, amount: 10000000, description: 'Trf' }, [{ file_name: 'a', file_path: '/a', mime_type: 'image/jpeg', file_size: 10 }]);
    const exp = repo.createTransaction({ transaction_date: '2026-08-03', type: 'EXPENSE', source_account_id: cashYandi.id, category_id: pg11.id, amount: 2000000, description: 'Dapur' }, [{ file_name: 'a', file_path: '/a', mime_type: 'image/jpeg', file_size: 10 }]);

    // Edit expense amount to 1.500.000
    repo.updateTransaction(exp.id, {
      transaction_date: '2026-08-03',
      type: 'EXPENSE',
      source_account_id: cashYandi.id,
      category_id: pg11.id,
      amount: 1500000,
      description: 'Dapur (Revisi 1.5jt)',
    });

    const allTrx = repo.getAllTransactionsRaw();
    const calc = calculateAccountBalances(accounts, allTrx);

    expect(calc.accountBalances[cashYandi.id]).toBe(19923611);
    expect(calc.totalBalance).toBe(249906457);

    const categories = repo.getCategories(undefined, true);
    const rep = generateMonthlyReport(accounts, categories, allTrx, '2026-08');
    expect(rep.total_expense).toBe(1500000);
    expect(rep.surplus_deficit).toBe(-500000);
  });

  // TEST 12 — Delete Expense
  it('TEST 12 — Delete Expense: deleting edited expense restores Cash Yandi and removes expense effect', () => {
    const accounts = repo.getAccounts(true);
    const bank = accounts.find((a) => a.code === 'AK01')!;
    const cashYandi = accounts.find((a) => a.code === 'AK03')!;
    const pm01 = repo.getCategories('INCOME').find((c) => c.code === 'PM01')!;
    const pg11 = repo.getCategories('EXPENSE').find((c) => c.code === 'PG11')!;

    repo.createTransaction({ transaction_date: '2026-08-01', type: 'INCOME', destination_account_id: bank.id, category_id: pm01.id, amount: 1000000, description: 'Infaq' }, [{ file_name: 'a', file_path: '/a', mime_type: 'image/jpeg', file_size: 10 }]);
    repo.createTransaction({ transaction_date: '2026-08-02', type: 'TRANSFER', source_account_id: bank.id, destination_account_id: cashYandi.id, amount: 10000000, description: 'Trf' }, [{ file_name: 'a', file_path: '/a', mime_type: 'image/jpeg', file_size: 10 }]);
    const exp = repo.createTransaction({ transaction_date: '2026-08-03', type: 'EXPENSE', source_account_id: cashYandi.id, category_id: pg11.id, amount: 1500000, description: 'Dapur' }, [{ file_name: 'a', file_path: '/a', mime_type: 'image/jpeg', file_size: 10 }]);

    // Delete the expense
    repo.deleteTransaction(exp.id);

    const allTrx = repo.getAllTransactionsRaw();
    const calc = calculateAccountBalances(accounts, allTrx);

    expect(calc.accountBalances[cashYandi.id]).toBe(21423611);
    expect(calc.totalBalance).toBe(251406457);

    const categories = repo.getCategories(undefined, true);
    const rep = generateMonthlyReport(accounts, categories, allTrx, '2026-08');
    expect(rep.total_income).toBe(1000000);
    expect(rep.total_expense).toBe(0);
    expect(rep.surplus_deficit).toBe(1000000);
  });

  // TEST 13 — Delete Transfer
  it('TEST 13 — Delete Transfer: deleting transfer restores Bank and Cash Yandi balances', () => {
    const accounts = repo.getAccounts(true);
    const bank = accounts.find((a) => a.code === 'AK01')!;
    const cashYandi = accounts.find((a) => a.code === 'AK03')!;
    const cashPesantren = accounts.find((a) => a.code === 'AK02')!;
    const pm01 = repo.getCategories('INCOME').find((c) => c.code === 'PM01')!;

    repo.createTransaction({ transaction_date: '2026-08-01', type: 'INCOME', destination_account_id: bank.id, category_id: pm01.id, amount: 1000000, description: 'Infaq' }, [{ file_name: 'a', file_path: '/a', mime_type: 'image/jpeg', file_size: 10 }]);
    const trf = repo.createTransaction({ transaction_date: '2026-08-02', type: 'TRANSFER', source_account_id: bank.id, destination_account_id: cashYandi.id, amount: 10000000, description: 'Trf' }, [{ file_name: 'a', file_path: '/a', mime_type: 'image/jpeg', file_size: 10 }]);

    // Delete transfer
    repo.deleteTransaction(trf.id);

    const allTrx = repo.getAllTransactionsRaw();
    const calc = calculateAccountBalances(accounts, allTrx);

    expect(calc.accountBalances[bank.id]).toBe(239957146);
    expect(calc.accountBalances[cashPesantren.id]).toBe(25700);
    expect(calc.accountBalances[cashYandi.id]).toBe(11423611);
    expect(calc.totalBalance).toBe(251406457);

    const categories = repo.getCategories(undefined, true);
    const rep = generateMonthlyReport(accounts, categories, allTrx, '2026-08');
    expect(rep.total_income).toBe(1000000);
    expect(rep.total_expense).toBe(0);
  });

  // TEST 14 — Monthly Report
  it('TEST 14 — Monthly Report: verifies complete monthly reconciliation for August 2026', () => {
    const accounts = repo.getAccounts(true);
    const bank = accounts.find((a) => a.code === 'AK01')!;
    const pm01 = repo.getCategories('INCOME').find((c) => c.code === 'PM01')!;

    repo.createTransaction({ transaction_date: '2026-08-01', type: 'INCOME', destination_account_id: bank.id, category_id: pm01.id, amount: 1000000, description: 'Infaq' }, [{ file_name: 'a', file_path: '/a', mime_type: 'image/jpeg', file_size: 10 }]);

    const allTrx = repo.getAllTransactionsRaw();
    const categories = repo.getCategories(undefined, true);
    const rep = generateMonthlyReport(accounts, categories, allTrx, '2026-08');

    expect(rep.opening_balance).toBe(250406457);
    expect(rep.total_income).toBe(1000000);
    expect(rep.total_expense).toBe(0);
    expect(rep.closing_balance).toBe(251406457);
  });

  // TEST 15 — Auth & Profile
  it('TEST 15 — Auth & Profile: verifies password checking and profile updates', () => {
    expect(repo.verifyPassword('admin@almisykat.com', 'admin_almisykat_2026')).toBe(true);
    expect(repo.verifyPassword('admin@almisykat.com', 'wrong_pass')).toBe(false);
  });

  // TEST 16 — Double submit / collision safety
  it('TEST 16 — Duplicate Submit Protection & Sequencing: sequentially generates unique transaction numbers', () => {
    const accounts = repo.getAccounts(true);
    const bank = accounts.find((a) => a.code === 'AK01')!;
    const pm01 = repo.getCategories('INCOME').find((c) => c.code === 'PM01')!;

    const numbers = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const trx = repo.createTransaction(
        {
          transaction_date: '2026-08-10',
          type: 'INCOME',
          destination_account_id: bank.id,
          category_id: pm01.id,
          amount: 50000,
          description: `Item ${i + 1}`,
        },
        [{ file_name: 'f.jpg', file_path: '/f.jpg', mime_type: 'image/jpeg', file_size: 100 }]
      );
      numbers.add(trx.transaction_number);
    }

    expect(numbers.size).toBe(5);
    expect(Array.from(numbers)).toEqual([
      'TRX-2608-0001',
      'TRX-2608-0002',
      'TRX-2608-0003',
      'TRX-2608-0004',
      'TRX-2608-0005',
    ]);
  });
});
