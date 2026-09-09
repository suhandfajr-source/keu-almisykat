'use server';

import { redirect } from 'next/navigation';
import { createSession, destroySession, getSession } from '@/lib/auth/session';
import { financeDb, isSupabaseMode } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function loginAction(prevState: any, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email dan kata sandi wajib diisi' };
  }

  // Authenticate using Supabase Auth or local fallback
  const sessionRes = await createSession(email, password);
  if (!sessionRes.success) {
    // If in local mode, check local verify
    if (!isSupabaseMode()) {
      const isValid = (await financeDb.getProfile(email)) !== null;
      if (!isValid && !(email === 'admin@almisykat.com' && password === 'admin_almisykat_2026')) {
        return { error: 'Email atau kata sandi salah. Silakan periksa kembali.' };
      }
      await createSession(email);
      redirect('/dashboard');
    }
    return { error: sessionRes.error || 'Email atau kata sandi salah. Silakan periksa kembali.' };
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}

export async function updateProfileAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'Sesi tidak valid. Silakan login kembali.' };

  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const newPassword = (formData.get('new_password') as string)?.trim();
  const confirmPassword = (formData.get('confirm_password') as string)?.trim();

  if (!name || !email) {
    return { error: 'Nama dan email wajib diisi' };
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      return { error: 'Kata sandi baru minimal 6 karakter' };
    }
    if (newPassword !== confirmPassword) {
      return { error: 'Konfirmasi kata sandi baru tidak cocok' };
    }
  }

  try {
    // Update profile in database
    await financeDb.updateProfile(session.user.id, name, email, newPassword || undefined);

    // Update password in Supabase Auth if applicable
    if (isSupabaseMode() && newPassword) {
      const supabase = await createClient();
      const { error: authErr } = await supabase.auth.updateUser({
        password: newPassword,
        data: { name },
      });
      if (authErr) {
        return { error: `Gagal memperbarui kata sandi Supabase: ${authErr.message}` };
      }
    }

    return { success: true, message: 'Profil dan pengaturan kata sandi berhasil diperbarui' };
  } catch (err: any) {
    return { error: err.message || 'Gagal memperbarui profil' };
  }
}
