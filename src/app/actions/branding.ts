'use server';

import { revalidatePath } from 'next/cache';
import { financeDb } from '@/lib/db';
import { validateLogoFile, saveLogoFile, deleteLogoFile } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

export async function saveBrandingAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'Sesi berakhir. Silakan login kembali.' };

  const rawAppName = formData.get('app_name') as string;
  const rawSubtitle = formData.get('app_subtitle') as string;
  const logoFile = formData.get('logo') as File | null;

  // 1. Validation for app_name
  if (!rawAppName || rawAppName.trim().length === 0) {
    return { error: 'Nama aplikasi wajib diisi dan tidak boleh hanya spasi.' };
  }

  const appName = rawAppName.trim();
  if (appName.length > 60) {
    return { error: 'Nama aplikasi maksimal 60 karakter.' };
  }

  // 2. Validation for app_subtitle
  const appSubtitle = (rawSubtitle || '').trim();
  if (appSubtitle.length > 100) {
    return { error: 'Subtitle aplikasi maksimal 100 karakter.' };
  }

  try {
    const oldLogo = await financeDb.getSetting('app_logo_path');
    let newLogoPath = oldLogo;

    // 3. Handle optional new logo upload
    if (logoFile && logoFile.size > 0) {
      const v = validateLogoFile(logoFile);
      if (!v.valid) {
        return { error: v.error || 'File logo tidak valid' };
      }

      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const saved = await saveLogoFile(buffer, logoFile.name, logoFile.type);
      newLogoPath = saved.filePath;

      // Clean up previous logo if new one uploaded successfully
      if (oldLogo && oldLogo !== saved.filePath) {
        try {
          await deleteLogoFile(oldLogo);
        } catch (cleanupErr) {
          console.warn('Failed to delete previous logo file:', cleanupErr);
        }
      }
    }

    // 4. Save settings to app_settings table
    await Promise.all([
      financeDb.setSetting('app_name', appName, session.user.id),
      financeDb.setSetting('app_subtitle', appSubtitle, session.user.id),
      newLogoPath ? financeDb.setSetting('app_logo_path', newLogoPath, session.user.id) : Promise.resolve(),
    ]);

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    revalidatePath('/login');
    revalidatePath('/transactions');
    revalidatePath('/reports');

    return {
      success: true,
      message: 'Identitas branding aplikasi berhasil diperbarui!',
      brand: {
        appName,
        appSubtitle,
        logoUrl: newLogoPath || null,
      },
    };
  } catch (err: any) {
    return {
      error: err.message || 'Logo/Branding gagal disimpan. Periksa koneksi atau konfigurasi penyimpanan dan coba kembali.',
    };
  }
}

export async function uploadLogoAction(prevState: any, formData: FormData) {
  return saveBrandingAction(prevState, formData);
}

export async function removeLogoAction() {
  const session = await getSession();
  if (!session) return { error: 'Sesi berakhir. Silakan login kembali.' };

  try {
    const oldLogo = await financeDb.getSetting('app_logo_path');

    // 1. Clear database setting
    await financeDb.setSetting('app_logo_path', '', session.user.id);

    // 2. Delete storage file if existed
    if (oldLogo) {
      try {
        await deleteLogoFile(oldLogo);
      } catch (err) {
        console.warn('Failed to delete removed logo file from storage:', err);
      }
    }

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    revalidatePath('/login');
    revalidatePath('/transactions');
    revalidatePath('/reports');

    return { success: true, message: 'Logo berhasil dihapus, kembali ke logo default.' };
  } catch (err: any) {
    return { error: err.message || 'Gagal menghapus logo' };
  }
}
