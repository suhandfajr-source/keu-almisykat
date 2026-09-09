import React from 'react';
import { financeDb } from '@/lib/db';
import { generateMonthlyReport, generateYearlyReport } from '@/lib/finance-math';
import { getCurrentYearMonthJakarta } from '@/lib/date-utils';
import { ReportsView } from '@/components/reports/ReportsView';

interface ReportsPageProps {
  searchParams: Promise<{
    tab?: 'monthly' | 'yearly';
    period?: string;
    year?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const tab = params.tab || 'monthly';
  const period = params.period || getCurrentYearMonthJakarta();
  const year = parseInt(params.year || '2026', 10);

  const accounts = await financeDb.getAccounts(true);
  const categories = await financeDb.getCategories(undefined, true);
  const allTrx = await financeDb.getAllTransactionsRaw();

  const monthlyReport = generateMonthlyReport(accounts, categories, allTrx, period);
  const yearlyReport = generateYearlyReport(accounts, categories, allTrx, year);

  return (
    <ReportsView
      initialTab={tab}
      initialPeriod={period}
      initialYear={year}
      monthlyReport={monthlyReport}
      yearlyReport={yearlyReport}
    />
  );
}
