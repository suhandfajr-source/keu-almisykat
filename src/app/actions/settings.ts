'use server';

import { revalidatePath } from 'next/cache';
import { financeDb } from '@/lib/db';
import { accountSchema, categorySchema } from '@/lib/validations/finance';
import { getSession } from '@/lib/auth/session';
import { parseRupiahInput } from '@/lib/finance-math';

export async function saveAccountAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'Sesi berakhir. Silakan login kembali.' };

  const id = formData.get('id') as string | null;
  const code = (formData.get('code') as string)?.trim();
  const name = (formData.get('name') as string)?.trim();
  const rawOpening = formData.get('opening_balance') as string;
  const opening_balance_date = (formData.get('opening_balance_date') as string) || '2026-07-31';
  const is_active = formData.get('is_active') === 'on' || formData.get('is_active') === 'true';

  const opening_balance = parseRupiahInput(rawOpening);

  const validation = accountSchema.safeParse({
    code,
    name,
    opening_balance,
    opening_balance_date,
    is_active,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0]?.message || 'Data akun tidak valid' };
  }

  try {
    if (id) {
      await financeDb.updateAccount(id, validation.data);
    } else {
      await financeDb.createAccount(validation.data);
    }
  } catch (err: any) {
    return { error: err.message || 'Gagal menyimpan data akun' };
  }

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  revalidatePath('/reports');
  return { success: true, message: 'Data akun berhasil disimpan' };
}

export async function toggleAccountActiveAction(id: string, currentState: boolean) {
  const session = await getSession();
  if (!session) return { error: 'Sesi berakhir. Silakan login kembali.' };

  try {
    await financeDb.updateAccount(id, { is_active: !currentState });
  } catch (err: any) {
    return { error: err.message || 'Gagal memperbarui status akun' };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function saveCategoryAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'Sesi berakhir. Silakan login kembali.' };

  const id = formData.get('id') as string | null;
  const code = (formData.get('code') as string)?.trim();
  const name = (formData.get('name') as string)?.trim();
  const type = formData.get('type') as 'INCOME' | 'EXPENSE';
  const is_active = formData.get('is_active') === 'on' || formData.get('is_active') === 'true';

  const validation = categorySchema.safeParse({
    code,
    name,
    type,
    is_active,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0]?.message || 'Data kategori tidak valid' };
  }

  try {
    if (id) {
      await financeDb.updateCategory(id, validation.data);
    } else {
      await financeDb.createCategory(validation.data);
    }
  } catch (err: any) {
    return { error: err.message || 'Gagal menyimpan kategori' };
  }

  revalidatePath('/settings');
  revalidatePath('/transactions');
  return { success: true, message: 'Data kategori berhasil disimpan' };
}

export async function toggleCategoryActiveAction(id: string, currentState: boolean) {
  const session = await getSession();
  if (!session) return { error: 'Sesi berakhir. Silakan login kembali.' };

  try {
    await financeDb.updateCategory(id, { is_active: !currentState });
  } catch (err: any) {
    return { error: err.message || 'Gagal memperbarui status kategori' };
  }

  revalidatePath('/settings');
  return { success: true };
}
