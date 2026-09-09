'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { financeDb } from '@/lib/db';
import { AttachmentPayload } from '@/lib/db/engine';
import { transactionSchema } from '@/lib/validations/finance';
import { validateFile, saveFile, deleteStoredFile } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { parseRupiahInput } from '@/lib/finance-math';

export async function createTransactionAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: 'Sesi berakhir. Silakan login kembali.' };
  }

  const transaction_date = formData.get('transaction_date') as string;
  const type = formData.get('type') as any;
  const source_account_id = (formData.get('source_account_id') as string) || null;
  const destination_account_id = (formData.get('destination_account_id') as string) || null;
  const category_id = (formData.get('category_id') as string) || null;
  const rawAmount = formData.get('amount') as string;
  const description = (formData.get('description') as string)?.trim();
  const note = (formData.get('note') as string)?.trim() || null;

  const amount = parseRupiahInput(rawAmount);

  // 1. Zod validation
  const validation = transactionSchema.safeParse({
    transaction_date,
    type,
    source_account_id,
    destination_account_id,
    category_id,
    amount,
    description,
    note,
  });

  if (!validation.success) {
    const firstErr = validation.error.errors[0]?.message || 'Data transaksi tidak valid';
    return { error: firstErr };
  }

  // 2. Evidence validation (At least one file required for new transaction)
  const files = formData.getAll('attachments') as File[];
  const validFiles = files.filter((f) => f && f.size > 0 && f.name && f.name !== 'undefined');

  if (validFiles.length === 0) {
    return { error: 'Bukti transaksi (struk / nota / transfer) wajib diunggah untuk transaksi baru.' };
  }

  for (const file of validFiles) {
    const v = validateFile(file);
    if (!v.valid) {
      return { error: v.error || 'File bukti tidak valid' };
    }
  }

  // 3. Save files to Supabase / Storage
  const attachments: AttachmentPayload[] = [];
  try {
    for (const file of validFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const saved = await saveFile(buffer, file.name, file.type);
      attachments.push({
        file_name: saved.fileName,
        file_path: saved.filePath,
        mime_type: saved.mimeType,
        file_size: saved.fileSize,
      });
    }
  } catch (err: any) {
    return { error: 'Gagal mengunggah file bukti: ' + err.message };
  }

  // 4. Create transaction in DB
  let newTrxId: string;
  try {
    const created = await financeDb.createTransaction(validation.data, attachments, session.user.id);
    newTrxId = created.id;
  } catch (err: any) {
    // Clean up uploaded files if DB insert fails
    for (const a of attachments) {
      await deleteStoredFile(a.file_path);
    }
    return { error: err.message || 'Gagal menyimpan transaksi' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  revalidatePath('/reports');
  redirect(`/transactions/${newTrxId}`);
}

export async function updateTransactionAction(id: string, prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'Sesi berakhir. Silakan login kembali.' };

  const transaction_date = formData.get('transaction_date') as string;
  const type = formData.get('type') as any;
  const source_account_id = (formData.get('source_account_id') as string) || null;
  const destination_account_id = (formData.get('destination_account_id') as string) || null;
  const category_id = (formData.get('category_id') as string) || null;
  const rawAmount = formData.get('amount') as string;
  const description = (formData.get('description') as string)?.trim();
  const note = (formData.get('note') as string)?.trim() || null;

  const amount = parseRupiahInput(rawAmount);

  const validation = transactionSchema.safeParse({
    transaction_date,
    type,
    source_account_id,
    destination_account_id,
    category_id,
    amount,
    description,
    note,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0]?.message || 'Data transaksi tidak valid' };
  }

  try {
    await financeDb.updateTransaction(id, validation.data);
  } catch (err: any) {
    return { error: err.message || 'Gagal memperbarui transaksi' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  revalidatePath(`/transactions/${id}`);
  revalidatePath('/reports');

  return { success: true, message: 'Transaksi berhasil diperbarui' };
}

export async function deleteTransactionAction(id: string) {
  const session = await getSession();
  if (!session) return { error: 'Sesi berakhir. Silakan login kembali.' };

  try {
    const res = await financeDb.deleteTransaction(id);
    // Delete files in storage
    for (const att of res.deletedAttachments) {
      await deleteStoredFile(att.file_path);
    }
  } catch (err: any) {
    return { error: err.message || 'Gagal menghapus transaksi' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  revalidatePath('/reports');
  redirect('/transactions');
}

export async function addAttachmentAction(transactionId: string, prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'Sesi berakhir. Silakan login kembali.' };

  const file = formData.get('file') as File;
  if (!file || file.size === 0) {
    return { error: 'Pilih file terlebih dahulu' };
  }

  const v = validateFile(file);
  if (!v.valid) {
    return { error: v.error || 'Format file tidak valid' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveFile(buffer, file.name, file.type, transactionId);
    await financeDb.addAttachment(transactionId, {
      file_name: saved.fileName,
      file_path: saved.filePath,
      mime_type: saved.mimeType,
      file_size: saved.fileSize,
    });
  } catch (err: any) {
    return { error: 'Gagal mengunggah bukti: ' + err.message };
  }

  revalidatePath(`/transactions/${transactionId}`);
  return { success: true, message: 'Bukti transaksi berhasil ditambahkan' };
}

export async function deleteAttachmentAction(transactionId: string, attachmentId: string) {
  const session = await getSession();
  if (!session) return { error: 'Sesi berakhir. Silakan login kembali.' };

  try {
    const deleted = await financeDb.deleteAttachment(attachmentId);
    if (deleted) {
      await deleteStoredFile(deleted.file_path);
    }
  } catch (err: any) {
    return { error: err.message || 'Gagal menghapus file bukti' };
  }

  revalidatePath(`/transactions/${transactionId}`);
  return { success: true };
}
