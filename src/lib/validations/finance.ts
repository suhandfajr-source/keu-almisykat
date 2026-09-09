import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const transactionSchema = z.object({
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'], {
    required_error: 'Tipe transaksi wajib dipilih',
  }),
  source_account_id: z.string().nullable().optional(),
  destination_account_id: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  amount: z.number().int().positive('Nominal harus lebih dari 0'),
  description: z.string().min(3, 'Keterangan minimal 3 karakter').max(500, 'Keterangan terlalu panjang'),
  note: z.string().max(1000, 'Catatan terlalu panjang').nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'INCOME') {
    if (!data.destination_account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destination_account_id'],
        message: 'Akun tujuan wajib dipilih untuk transaksi pemasukan',
      });
    }
    if (!data.category_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['category_id'],
        message: 'Kategori pemasukan wajib dipilih',
      });
    }
    if (data.source_account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['source_account_id'],
        message: 'Transaksi pemasukan tidak boleh memiliki akun sumber',
      });
    }
  } else if (data.type === 'EXPENSE') {
    if (!data.source_account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['source_account_id'],
        message: 'Akun sumber wajib dipilih untuk transaksi pengeluaran',
      });
    }
    if (!data.category_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['category_id'],
        message: 'Kategori pengeluaran wajib dipilih',
      });
    }
    if (data.destination_account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destination_account_id'],
        message: 'Transaksi pengeluaran tidak boleh memiliki akun tujuan',
      });
    }
  } else if (data.type === 'TRANSFER') {
    if (!data.source_account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['source_account_id'],
        message: 'Akun sumber wajib dipilih untuk transfer internal',
      });
    }
    if (!data.destination_account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destination_account_id'],
        message: 'Akun tujuan wajib dipilih untuk transfer internal',
      });
    }
    if (data.source_account_id && data.destination_account_id && data.source_account_id === data.destination_account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destination_account_id'],
        message: 'Akun sumber dan akun tujuan tidak boleh sama',
      });
    }
    if (data.category_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['category_id'],
        message: 'Transfer internal tidak menggunakan kategori',
      });
    }
  }
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const accountSchema = z.object({
  code: z.string().min(2, 'Kode akun minimal 2 karakter').max(10, 'Kode akun maksimal 10 karakter'),
  name: z.string().min(3, 'Nama akun minimal 3 karakter').max(100, 'Nama akun maksimal 100 karakter'),
  opening_balance: z.number().int().min(0, 'Saldo awal tidak boleh negatif'),
  opening_balance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  is_active: z.boolean().default(true),
});

export type AccountInput = z.infer<typeof accountSchema>;

export const categorySchema = z.object({
  code: z.string().min(2, 'Kode kategori minimal 2 karakter').max(10, 'Kode kategori maksimal 10 karakter'),
  name: z.string().min(3, 'Nama kategori minimal 3 karakter').max(100, 'Nama kategori maksimal 100 karakter'),
  type: z.enum(['INCOME', 'EXPENSE'], {
    required_error: 'Tipe kategori wajib dipilih',
  }),
  is_active: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;
