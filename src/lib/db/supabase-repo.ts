import { createClient } from '@/lib/supabase/server';
import { Account, Category, Transaction, TransactionAttachment, Profile } from '@/types/finance';
import { formatTransactionNumber, calculateAccountBalances } from '@/lib/finance-math';
import { TransactionInput, AccountInput, CategoryInput } from '@/lib/validations/finance';
import { AttachmentPayload } from './engine';

export class SupabaseFinanceRepository {
  // Accounts
  async getAccounts(includeInactive = true): Promise<Account[]> {
    const supabase = await createClient();
    let query = supabase.from('accounts').select('*').order('code', { ascending: true });
    
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Supabase accounts error: ${error.message}`);

    return (data || []).map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      opening_balance: Number(r.opening_balance),
      opening_balance_date: r.opening_balance_date,
      is_active: Boolean(r.is_active),
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  async getAccountById(id: string): Promise<Account | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from('accounts').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      opening_balance: Number(data.opening_balance),
      opening_balance_date: data.opening_balance_date,
      is_active: Boolean(data.is_active),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  async createAccount(data: AccountInput): Promise<Account> {
    const supabase = await createClient();
    const { data: created, error } = await supabase
      .from('accounts')
      .insert({
        code: data.code.toUpperCase(),
        name: data.name,
        opening_balance: data.opening_balance,
        opening_balance_date: data.opening_balance_date,
        is_active: data.is_active,
      })
      .select()
      .single();

    if (error) throw new Error(`Gagal membuat akun: ${error.message}`);
    return {
      ...created,
      opening_balance: Number(created.opening_balance),
    };
  }

  async updateAccount(id: string, data: Partial<AccountInput>): Promise<Account> {
    const supabase = await createClient();
    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (data.code !== undefined) updatePayload.code = data.code.toUpperCase();
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.opening_balance !== undefined) updatePayload.opening_balance = data.opening_balance;
    if (data.opening_balance_date !== undefined) updatePayload.opening_balance_date = data.opening_balance_date;
    if (data.is_active !== undefined) updatePayload.is_active = data.is_active;

    const { data: updated, error } = await supabase
      .from('accounts')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Gagal memperbarui akun: ${error.message}`);
    return {
      ...updated,
      opening_balance: Number(updated.opening_balance),
    };
  }

  // Categories
  async getCategories(type?: 'INCOME' | 'EXPENSE', includeInactive = true): Promise<Category[]> {
    const supabase = await createClient();
    let query = supabase.from('categories').select('*').order('code', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Supabase categories error: ${error.message}`);

    return (data || []).map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      type: r.type as 'INCOME' | 'EXPENSE',
      is_active: Boolean(r.is_active),
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from('categories').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      type: data.type as 'INCOME' | 'EXPENSE',
      is_active: Boolean(data.is_active),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  async createCategory(data: CategoryInput): Promise<Category> {
    const supabase = await createClient();
    const { data: created, error } = await supabase
      .from('categories')
      .insert({
        code: data.code.toUpperCase(),
        name: data.name,
        type: data.type,
        is_active: data.is_active,
      })
      .select()
      .single();

    if (error) throw new Error(`Gagal membuat kategori: ${error.message}`);
    return created;
  }

  async updateCategory(id: string, data: Partial<CategoryInput>): Promise<Category> {
    const supabase = await createClient();
    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (data.code !== undefined) updatePayload.code = data.code.toUpperCase();
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.is_active !== undefined) updatePayload.is_active = data.is_active;

    const { data: updated, error } = await supabase
      .from('categories')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Gagal memperbarui kategori: ${error.message}`);
    return updated;
  }

  // Transactions
  async getAllTransactionsRaw(): Promise<Transaction[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        source_account:accounts!source_account_id(*),
        destination_account:accounts!destination_account_id(*),
        category:categories!category_id(*),
        attachments:transaction_attachments(*)
      `)
      .order('transaction_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Supabase transactions error: ${error.message}`);

    return (data || []).map((r) => this.mapTransactionRow(r));
  }

  async getTransactions(filters: {
    startDate?: string;
    endDate?: string;
    type?: string;
    accountId?: string;
    categoryId?: string;
    search?: string;
  } = {}): Promise<Transaction[]> {
    const supabase = await createClient();
    let query = supabase
      .from('transactions')
      .select(`
        *,
        source_account:accounts!source_account_id(*),
        destination_account:accounts!destination_account_id(*),
        category:categories!category_id(*),
        attachments:transaction_attachments(*)
      `);

    if (filters.startDate) query = query.gte('transaction_date', filters.startDate);
    if (filters.endDate) query = query.lte('transaction_date', filters.endDate);
    if (filters.type && filters.type !== 'ALL') query = query.eq('type', filters.type);
    if (filters.accountId && filters.accountId !== 'ALL') {
      query = query.or(`source_account_id.eq.${filters.accountId},destination_account_id.eq.${filters.accountId}`);
    }
    if (filters.categoryId && filters.categoryId !== 'ALL') {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters.search) {
      query = query.or(`transaction_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%,note.ilike.%${filters.search}%`);
    }

    query = query.order('transaction_date', { ascending: false }).order('transaction_number', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`Supabase query transactions error: ${error.message}`);

    return (data || []).map((r) => this.mapTransactionRow(r));
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        source_account:accounts!source_account_id(*),
        destination_account:accounts!destination_account_id(*),
        category:categories!category_id(*),
        attachments:transaction_attachments(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapTransactionRow(data);
  }

  async getNextTransactionNumber(transactionDate: string): Promise<string> {
    const supabase = await createClient();
    const [yearStr, monthStr] = transactionDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const yy = (year % 100).toString().padStart(2, '0');
    const mm = month.toString().padStart(2, '0');
    const prefix = `TRX-${yy}${mm}-`;

    const { data } = await supabase
      .from('transactions')
      .select('transaction_number')
      .like('transaction_number', `${prefix}%`)
      .order('transaction_number', { ascending: false })
      .limit(1);

    let nextSeq = 1;
    if (data && data.length > 0) {
      const match = data[0].transaction_number.match(/^TRX-\d{4}-(\d{4})$/);
      if (match) {
        nextSeq = parseInt(match[1], 10) + 1;
      }
    }

    return formatTransactionNumber(year, month, nextSeq);
  }

  async validateSourceAccountBalance(sourceAccountId: string, amount: number, excludeTransactionId?: string): Promise<{ valid: boolean; currentBalance: number }> {
    const accounts = await this.getAccounts(true);
    let allTrx = await this.getAllTransactionsRaw();
    if (excludeTransactionId) {
      allTrx = allTrx.filter((t) => t.id !== excludeTransactionId);
    }
    const balances = calculateAccountBalances(accounts, allTrx);
    const currentBalance = balances.accountBalances[sourceAccountId] || 0;

    return {
      valid: currentBalance >= amount,
      currentBalance,
    };
  }

  async createTransaction(
    data: TransactionInput,
    attachments: AttachmentPayload[] = [],
    createdBy?: string
  ): Promise<Transaction> {
    const supabase = await createClient();

    // 1. Balance validation
    if (data.type === 'EXPENSE' || data.type === 'TRANSFER') {
      if (!data.source_account_id) throw new Error('Akun sumber wajib diisi');
      const { valid, currentBalance } = await this.validateSourceAccountBalance(data.source_account_id, data.amount);
      if (!valid) {
        throw new Error(`Saldo akun sumber tidak mencukupi. Saldo saat ini: Rp${currentBalance.toLocaleString('id-ID')}, dibutuhkan: Rp${data.amount.toLocaleString('id-ID')}`);
      }
    }

    // 2. Generate unique sequential number
    const transactionNumber = await this.getNextTransactionNumber(data.transaction_date);

    // 3. Insert transaction
    const { data: createdTrx, error: trxErr } = await supabase
      .from('transactions')
      .insert({
        transaction_number: transactionNumber,
        transaction_date: data.transaction_date,
        type: data.type,
        source_account_id: data.source_account_id || null,
        destination_account_id: data.destination_account_id || null,
        category_id: data.category_id || null,
        amount: data.amount,
        description: data.description,
        note: data.note || null,
        created_by: createdBy || null,
      })
      .select()
      .single();

    if (trxErr) throw new Error(`Gagal menyimpan transaksi ke database: ${trxErr.message}`);

    // 4. Insert attachments
    if (attachments.length > 0) {
      const attInserts = attachments.map((att) => ({
        transaction_id: createdTrx.id,
        file_name: att.file_name,
        file_path: att.file_path,
        mime_type: att.mime_type,
        file_size: att.file_size,
      }));

      const { error: attErr } = await supabase.from('transaction_attachments').insert(attInserts);
      if (attErr) {
        console.error('Error inserting attachments:', attErr);
      }
    }

    const result = await this.getTransactionById(createdTrx.id);
    return result!;
  }

  async updateTransaction(id: string, data: TransactionInput): Promise<Transaction> {
    const supabase = await createClient();

    // Validate balance
    if (data.type === 'EXPENSE' || data.type === 'TRANSFER') {
      if (!data.source_account_id) throw new Error('Akun sumber wajib diisi');
      const { valid, currentBalance } = await this.validateSourceAccountBalance(data.source_account_id, data.amount, id);
      if (!valid) {
        throw new Error(`Saldo akun sumber tidak mencukupi. Saldo saat ini: Rp${currentBalance.toLocaleString('id-ID')}, dibutuhkan: Rp${data.amount.toLocaleString('id-ID')}`);
      }
    }

    const { error } = await supabase
      .from('transactions')
      .update({
        transaction_date: data.transaction_date,
        type: data.type,
        source_account_id: data.source_account_id || null,
        destination_account_id: data.destination_account_id || null,
        category_id: data.category_id || null,
        amount: data.amount,
        description: data.description,
        note: data.note || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw new Error(`Gagal memperbarui transaksi: ${error.message}`);

    const result = await this.getTransactionById(id);
    return result!;
  }

  async deleteTransaction(id: string): Promise<{ success: boolean; deletedAttachments: TransactionAttachment[] }> {
    const supabase = await createClient();
    
    // Fetch attachments first
    const { data: attachments } = await supabase
      .from('transaction_attachments')
      .select('*')
      .eq('transaction_id', id);

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw new Error(`Gagal menghapus transaksi: ${error.message}`);

    return {
      success: true,
      deletedAttachments: (attachments || []).map((a) => ({
        ...a,
        file_size: Number(a.file_size),
      })),
    };
  }

  async addAttachment(transactionId: string, payload: AttachmentPayload): Promise<TransactionAttachment> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('transaction_attachments')
      .insert({
        transaction_id: transactionId,
        file_name: payload.file_name,
        file_path: payload.file_path,
        mime_type: payload.mime_type,
        file_size: payload.file_size,
      })
      .select()
      .single();

    if (error) throw new Error(`Gagal menambahkan bukti: ${error.message}`);
    return {
      ...data,
      file_size: Number(data.file_size),
    };
  }

  async deleteAttachment(attachmentId: string): Promise<TransactionAttachment | null> {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from('transaction_attachments')
      .select('*')
      .eq('id', attachmentId)
      .maybeSingle();

    if (!existing) return null;

    const { error } = await supabase.from('transaction_attachments').delete().eq('id', attachmentId);
    if (error) throw new Error(`Gagal menghapus lampiran: ${error.message}`);

    return {
      ...existing,
      file_size: Number(existing.file_size),
    };
  }

  // Profile
  async getProfile(userIdOrEmail?: string): Promise<Profile | null> {
    const supabase = await createClient();
    let query = supabase.from('profiles').select('*');

    if (userIdOrEmail) {
      query = query.or(`id.eq.${userIdOrEmail},email.eq.${userIdOrEmail}`);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) return null;

    return data;
  }

  async updateProfile(userId: string, name: string, email: string): Promise<Profile> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(`Gagal memperbarui profil: ${error.message}`);
    return data;
  }

  // App Settings
  async getSetting(key: string): Promise<string | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error || !data) return null;
      return data.value;
    } catch {
      return null;
    }
  }

  async setSetting(key: string, value: string, updatedBy?: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy || null,
      }, { onConflict: 'key' });

    if (error) throw new Error(`Gagal menyimpan pengaturan aplikasi: ${error.message}`);
  }

  private mapTransactionRow(r: any): Transaction {
    return {
      id: r.id,
      transaction_number: r.transaction_number,
      transaction_date: r.transaction_date,
      type: r.type,
      source_account_id: r.source_account_id,
      destination_account_id: r.destination_account_id,
      category_id: r.category_id,
      amount: Number(r.amount),
      description: r.description,
      note: r.note,
      created_by: r.created_by,
      created_at: r.created_at,
      updated_at: r.updated_at,
      source_account: r.source_account
        ? {
            ...r.source_account,
            opening_balance: Number(r.source_account.opening_balance),
          }
        : null,
      destination_account: r.destination_account
        ? {
            ...r.destination_account,
            opening_balance: Number(r.destination_account.opening_balance),
          }
        : null,
      category: r.category || null,
      attachments: (r.attachments || []).map((a: any) => ({
        ...a,
        file_size: Number(a.file_size),
      })),
    };
  }
}

export const supabaseFinanceRepo = new SupabaseFinanceRepository();
