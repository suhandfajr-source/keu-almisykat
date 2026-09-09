import React from 'react';
import { notFound } from 'next/navigation';
import { financeDb } from '@/lib/db';
import { calculateAccountBalances } from '@/lib/finance-math';
import { TransactionDetailClient } from '@/components/transactions/TransactionDetailClient';

interface TransactionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const { id } = await params;
  const transaction = await financeDb.getTransactionById(id);

  if (!transaction) {
    notFound();
  }

  const accounts = await financeDb.getAccounts(true);
  const incomeCategories = await financeDb.getCategories('INCOME', true);
  const expenseCategories = await financeDb.getCategories('EXPENSE', true);
  const allTrx = await financeDb.getAllTransactionsRaw();

  const balanceSummary = calculateAccountBalances(accounts, allTrx);

  return (
    <TransactionDetailClient
      transaction={transaction}
      accounts={accounts}
      incomeCategories={incomeCategories}
      expenseCategories={expenseCategories}
      accountBalances={balanceSummary.accountBalances}
    />
  );
}
