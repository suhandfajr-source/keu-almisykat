import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { financeDb } from '@/lib/db';
import { calculateAccountBalances } from '@/lib/finance-math';
import { TransactionForm } from '@/components/transactions/TransactionForm';

export default async function NewTransactionPage() {
  const accounts = await financeDb.getAccounts(false); // Only active accounts for new transaction
  const incomeCategories = await financeDb.getCategories('INCOME', false);
  const expenseCategories = await financeDb.getCategories('EXPENSE', false);
  const allTrx = await financeDb.getAllTransactionsRaw();

  const balanceSummary = calculateAccountBalances(accounts, allTrx);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/transactions"
          className="p-2 text-brand-muted hover:text-brand-dark hover:bg-brand-warm rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-brand-dark">Tambah Transaksi Baru</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Pencatatan pemasukan, pengeluaran, atau transfer antar akun
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-brand-border shadow-xs">
        <TransactionForm
          accounts={accounts}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          accountBalances={balanceSummary.accountBalances}
        />
      </div>
    </div>
  );
}
