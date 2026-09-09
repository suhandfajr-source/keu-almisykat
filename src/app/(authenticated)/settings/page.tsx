import React from 'react';
import { financeDb } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { SettingsView } from '@/components/settings/SettingsView';

export default async function SettingsPage() {
  const session = await getSession();
  const accounts = await financeDb.getAccounts(true);
  const incomeCategories = await financeDb.getCategories('INCOME', true);
  const expenseCategories = await financeDb.getCategories('EXPENSE', true);
  const profile = await financeDb.getProfile(session?.user.id || session?.user.email);
  const brand = await financeDb.getBrandIdentity();

  return (
    <SettingsView
      accounts={accounts}
      incomeCategories={incomeCategories}
      expenseCategories={expenseCategories}
      profile={profile}
      brand={brand}
    />
  );
}
