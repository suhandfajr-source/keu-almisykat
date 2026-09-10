import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { Account, Category, Transaction, TransactionAttachment, Profile } from '@/types/finance';
import { formatTransactionNumber, calculateAccountBalances } from '@/lib/finance-math';
import { TransactionInput, AccountInput, CategoryInput } from '@/lib/validations/finance';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'finance.db');

type DatabaseSyncType = any;
let _dbInstance: any = null;

export function getDb(): any {
  if (process.env.DATABASE_DRIVER !== 'local' && (process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL))) {
    return {
      exec: () => {},
      prepare: () => ({ all: () => [], get: () => null, run: () => ({ changes: 0, lastInsertRowid: 0 }) }),
    };
  }
  if (_dbInstance) return _dbInstance;

  try {
    const require = createRequire(import.meta.url);
    const { DatabaseSync } = require('node:sqlite');

    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    const db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA busy_timeout = 5000;');

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      opening_balance INTEGER NOT NULL DEFAULT 0,
      opening_balance_date TEXT NOT NULL DEFAULT '2026-07-31',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      transaction_number TEXT UNIQUE NOT NULL,
      transaction_date TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
      source_account_id TEXT REFERENCES accounts(id) ON DELETE RESTRICT,
      destination_account_id TEXT REFERENCES accounts(id) ON DELETE RESTRICT,
      category_id TEXT REFERENCES categories(id) ON DELETE RESTRICT,
      amount INTEGER NOT NULL CHECK (amount > 0),
      description TEXT NOT NULL,
      note TEXT,
      created_by TEXT REFERENCES profiles(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transaction_attachments (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS legacy_summary (
      id TEXT PRIMARY KEY,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      total_income INTEGER,
      total_expense INTEGER,
      closing_balance INTEGER NOT NULL,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_by TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_trx_date ON transactions(transaction_date);
    CREATE INDEX IF NOT EXISTS idx_trx_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_trx_src ON transactions(source_account_id);
    CREATE INDEX IF NOT EXISTS idx_trx_dst ON transactions(destination_account_id);
    CREATE INDEX IF NOT EXISTS idx_trx_cat ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_att_trx ON transaction_attachments(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_settings_key ON app_settings(key);
  `);

  // Seed default master accounts if not present
  const accCount = db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number | bigint };
  if (Number(accCount.count) === 0) {
    const insertAcc = db.prepare(`
      INSERT INTO accounts (id, code, name, opening_balance, opening_balance_date, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    const seedAccounts: [string, string, string, number, string][] = [
      ['acc-ak01', 'AK01', 'Bank Al-Misykat', 238957146, '2026-07-31'],
      ['acc-ak02', 'AK02', 'Cash Pesantren', 25700, '2026-07-31'],
      ['acc-ak03', 'AK03', 'Cash Yandi', 11423611, '2026-07-31'],
    ];
    for (const acc of seedAccounts) {
      insertAcc.run(...acc);
    }
  }

  // Seed master income & expense categories if not present
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number | bigint };
  if (Number(catCount.count) === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (id, code, name, type, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);

    const incomeCategories: [string, string, string, string][] = [
      ['cat-pm01', 'PM01', 'Infaq/Shodaqoh Pesantren Berseri', 'INCOME'],
      ['cat-pm02', 'PM02', 'Wakaf Pesantren', 'INCOME'],
      ['cat-pm03', 'PM03', 'Sumbangan/Sedekah Pesantren', 'INCOME'],
      ['cat-pm04', 'PM04', 'Beasiswa/Orang Tua Asuh', 'INCOME'],
      ['cat-pm05', 'PM05', 'Hasil Bank', 'INCOME'],
      ['cat-pm06', 'PM06', 'Pembangunan Masjid', 'INCOME'],
      ['cat-pm07', 'PM07', 'Zakat Mal/Profesi/Emas', 'INCOME'],
      ['cat-pm08', 'PM08', 'Lain-lain', 'INCOME'],
      ['cat-pm09', 'PM09', 'Infaq Air/Filter', 'INCOME'],
      ['cat-pm10', 'PM10', 'Wakaf Jalan', 'INCOME'],
      ['cat-pm11', 'PM11', 'Pembangunan Sakan', 'INCOME'],
      ['cat-pm12', 'PM12', 'Wakaf Sumur', 'INCOME'],
      ['cat-pm13', 'PM13', 'Pembangunan Kelas', 'INCOME'],
      ['cat-pm14', 'PM14', 'Ifthar/Sahur', 'INCOME'],
      ['cat-pm15', 'PM15', 'Wakaf Sawah', 'INCOME'],
      ['cat-pm16', 'PM16', 'Qurban', 'INCOME'],
    ];

    const expenseCategories: [string, string, string, string][] = [
      ['cat-pg01', 'PG01', 'Pajak', 'EXPENSE'],
      ['cat-pg02', 'PG02', 'Biaya Bank', 'EXPENSE'],
      ['cat-pg03', 'PG03', 'Transportasi', 'EXPENSE'],
      ['cat-pg04', 'PG04', 'Gaji/Kafalah', 'EXPENSE'],
      ['cat-pg05', 'PG05', 'Peralatan/Perlengkapan', 'EXPENSE'],
      ['cat-pg06', 'PG06', 'Pulsa Listrik', 'EXPENSE'],
      ['cat-pg07', 'PG07', 'Sarana & Prasarana Pesantren', 'EXPENSE'],
      ['cat-pg08', 'PG08', 'Sarana & Prasarana Masjid', 'EXPENSE'],
      ['cat-pg09', 'PG09', 'Sawah', 'EXPENSE'],
      ['cat-pg10', 'PG10', 'Kegiatan Belajar Mengajar', 'EXPENSE'],
      ['cat-pg11', 'PG11', 'Kebutuhan Dapur', 'EXPENSE'],
      ['cat-pg12', 'PG12', 'Motor Pesantren', 'EXPENSE'],
      ['cat-pg13', 'PG13', 'Internet', 'EXPENSE'],
      ['cat-pg14', 'PG14', 'Perbaikan Jalan', 'EXPENSE'],
      ['cat-pg15', 'PG15', 'Lain-lain', 'EXPENSE'],
      ['cat-pg16', 'PG16', 'Air/Sumur', 'EXPENSE'],
      ['cat-pg17', 'PG17', 'Ifthar/Sahur', 'EXPENSE'],
      ['cat-pg18', 'PG18', 'Ramadhan', 'EXPENSE'],
      ['cat-pg19', 'PG19', 'Qurban', 'EXPENSE'],
    ];

    for (const cat of [...incomeCategories, ...expenseCategories]) {
      insertCat.run(...cat);
    }
  }

  // Seed default admin profile
  const profCount = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: number | bigint };
  if (Number(profCount.count) === 0) {
    db.prepare(`
      INSERT INTO profiles (id, name, email, password_hash)
      VALUES (?, ?, ?, ?)
    `).run('prof-admin', 'Bendahara Al-Misykat', 'admin@almisykat.com', 'admin_almisykat_2026');
  }

  _dbInstance = db;
  return db;
  } catch (err) {
    console.error('Failed to initialize local SQLite database:', err);
    return {
      exec: () => {},
      prepare: () => ({ all: () => [], get: () => null, run: () => ({ changes: 0, lastInsertRowid: 0 }) }),
    };
  }
}

export interface AttachmentPayload {
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
}

export class FinanceRepository {
  private get db(): any {
    return getDb();
  }

  // Accounts
  getAccounts(includeInactive = true): Account[] {
    const query = includeInactive
      ? 'SELECT * FROM accounts ORDER BY code ASC'
      : 'SELECT * FROM accounts WHERE is_active = 1 ORDER BY code ASC';
    const rows = this.db.prepare(query).all() as any[];
    return rows.map((r) => ({
      ...r,
      opening_balance: Number(r.opening_balance),
      is_active: Boolean(r.is_active),
    }));
  }

  getAccountById(id: string): Account | null {
    const row = this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      ...row,
      opening_balance: Number(row.opening_balance),
      is_active: Boolean(row.is_active),
    };
  }

  createAccount(data: AccountInput): Account {
    const id = `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    this.db.prepare(`
      INSERT INTO accounts (id, code, name, opening_balance, opening_balance_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.code.toUpperCase(), data.name, data.opening_balance, data.opening_balance_date, data.is_active ? 1 : 0);
    return this.getAccountById(id)!;
  }

  updateAccount(id: string, data: Partial<AccountInput>): Account {
    const existing = this.getAccountById(id);
    if (!existing) throw new Error('Akun tidak ditemukan');

    const code = data.code ? data.code.toUpperCase() : existing.code;
    const name = data.name !== undefined ? data.name : existing.name;
    const opening_balance = data.opening_balance !== undefined ? data.opening_balance : existing.opening_balance;
    const opening_balance_date = data.opening_balance_date !== undefined ? data.opening_balance_date : existing.opening_balance_date;
    const is_active = data.is_active !== undefined ? (data.is_active ? 1 : 0) : (existing.is_active ? 1 : 0);

    this.db.prepare(`
      UPDATE accounts 
      SET code = ?, name = ?, opening_balance = ?, opening_balance_date = ?, is_active = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(code, name, opening_balance, opening_balance_date, is_active, id);

    return this.getAccountById(id)!;
  }

  // Categories
  getCategories(type?: 'INCOME' | 'EXPENSE', includeInactive = true): Category[] {
    let query = 'SELECT * FROM categories WHERE 1=1';
    const params: any[] = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (!includeInactive) {
      query += ' AND is_active = 1';
    }
    query += ' ORDER BY code ASC';

    const rows = this.db.prepare(query).all(...params) as any[];
    return rows.map((r) => ({
      ...r,
      is_active: Boolean(r.is_active),
    }));
  }

  getCategoryById(id: string): Category | null {
    const row = this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      ...row,
      is_active: Boolean(row.is_active),
    };
  }

  createCategory(data: CategoryInput): Category {
    const id = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    this.db.prepare(`
      INSERT INTO categories (id, code, name, type, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.code.toUpperCase(), data.name, data.type, data.is_active ? 1 : 0);
    return this.getCategoryById(id)!;
  }

  updateCategory(id: string, data: Partial<CategoryInput>): Category {
    const existing = this.getCategoryById(id);
    if (!existing) throw new Error('Kategori tidak ditemukan');

    const code = data.code ? data.code.toUpperCase() : existing.code;
    const name = data.name !== undefined ? data.name : existing.name;
    const type = data.type !== undefined ? data.type : existing.type;
    const is_active = data.is_active !== undefined ? (data.is_active ? 1 : 0) : (existing.is_active ? 1 : 0);

    this.db.prepare(`
      UPDATE categories 
      SET code = ?, name = ?, type = ?, is_active = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(code, name, type, is_active, id);

    return this.getCategoryById(id)!;
  }

  // Transactions
  getAllTransactionsRaw(): Transaction[] {
    const rows = this.db.prepare(`
      SELECT t.*, 
             sa.code as sa_code, sa.name as sa_name, sa.opening_balance as sa_ob, sa.opening_balance_date as sa_obd, sa.is_active as sa_active,
             da.code as da_code, da.name as da_name, da.opening_balance as da_ob, da.opening_balance_date as da_obd, da.is_active as da_active,
             c.code as c_code, c.name as c_name, c.type as c_type, c.is_active as c_active
      FROM transactions t
      LEFT JOIN accounts sa ON t.source_account_id = sa.id
      LEFT JOIN accounts da ON t.destination_account_id = da.id
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.transaction_date ASC, t.created_at ASC
    `).all() as any[];

    const attachments = this.db.prepare('SELECT * FROM transaction_attachments').all() as any[];
    const attMap = new Map<string, TransactionAttachment[]>();
    for (const a of attachments) {
      const list = attMap.get(a.transaction_id) || [];
      list.push({
        ...a,
        file_size: Number(a.file_size),
      });
      attMap.set(a.transaction_id, list);
    }

    return rows.map((r) => this.mapTransactionRow(r, attMap.get(r.id) || []));
  }

  getTransactions(filters: {
    startDate?: string;
    endDate?: string;
    type?: string;
    accountId?: string;
    categoryId?: string;
    search?: string;
  } = {}): Transaction[] {
    let query = `
      SELECT t.*, 
             sa.code as sa_code, sa.name as sa_name, sa.opening_balance as sa_ob, sa.opening_balance_date as sa_obd, sa.is_active as sa_active,
             da.code as da_code, da.name as da_name, da.opening_balance as da_ob, da.opening_balance_date as da_obd, da.is_active as da_active,
             c.code as c_code, c.name as c_name, c.type as c_type, c.is_active as c_active
      FROM transactions t
      LEFT JOIN accounts sa ON t.source_account_id = sa.id
      LEFT JOIN accounts da ON t.destination_account_id = da.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.startDate) {
      query += ' AND t.transaction_date >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND t.transaction_date <= ?';
      params.push(filters.endDate);
    }
    if (filters.type && filters.type !== 'ALL') {
      query += ' AND t.type = ?';
      params.push(filters.type);
    }
    if (filters.accountId && filters.accountId !== 'ALL') {
      query += ' AND (t.source_account_id = ? OR t.destination_account_id = ?)';
      params.push(filters.accountId, filters.accountId);
    }
    if (filters.categoryId && filters.categoryId !== 'ALL') {
      query += ' AND t.category_id = ?';
      params.push(filters.categoryId);
    }
    if (filters.search) {
      query += ' AND (t.transaction_number LIKE ? OR t.description LIKE ? OR t.note LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY t.transaction_date DESC, t.transaction_number DESC';

    const rows = this.db.prepare(query).all(...params) as any[];

    // Fetch attachments for these rows
    const trxIds = rows.map((r) => r.id);
    const attMap = new Map<string, TransactionAttachment[]>();

    if (trxIds.length > 0) {
      const placeholders = trxIds.map(() => '?').join(',');
      const attachments = this.db.prepare(`SELECT * FROM transaction_attachments WHERE transaction_id IN (${placeholders})`).all(...trxIds) as any[];
      for (const a of attachments) {
        const list = attMap.get(a.transaction_id) || [];
        list.push({
          ...a,
          file_size: Number(a.file_size),
        });
        attMap.set(a.transaction_id, list);
      }
    }

    return rows.map((r) => this.mapTransactionRow(r, attMap.get(r.id) || []));
  }

  getTransactionById(id: string): Transaction | null {
    const row = this.db.prepare(`
      SELECT t.*, 
             sa.code as sa_code, sa.name as sa_name, sa.opening_balance as sa_ob, sa.opening_balance_date as sa_obd, sa.is_active as sa_active,
             da.code as da_code, da.name as da_name, da.opening_balance as da_ob, da.opening_balance_date as da_obd, da.is_active as da_active,
             c.code as c_code, c.name as c_name, c.type as c_type, c.is_active as c_active
      FROM transactions t
      LEFT JOIN accounts sa ON t.source_account_id = sa.id
      LEFT JOIN accounts da ON t.destination_account_id = da.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(id) as any;

    if (!row) return null;

    const rawAttachments = this.db.prepare('SELECT * FROM transaction_attachments WHERE transaction_id = ?').all(id) as any[];
    const attachments = rawAttachments.map((a) => ({
      ...a,
      file_size: Number(a.file_size),
    }));
    return this.mapTransactionRow(row, attachments);
  }

  getNextTransactionNumber(transactionDate: string): string {
    const [yearStr, monthStr] = transactionDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const yy = (year % 100).toString().padStart(2, '0');
    const mm = month.toString().padStart(2, '0');
    const prefix = `TRX-${yy}${mm}-`;

    const lastTrx = this.db.prepare(`
      SELECT transaction_number FROM transactions 
      WHERE transaction_number LIKE ? 
      ORDER BY transaction_number DESC LIMIT 1
    `).get(`${prefix}%`) as { transaction_number: string } | undefined;

    let nextSeq = 1;
    if (lastTrx) {
      const match = lastTrx.transaction_number.match(/^TRX-\d{4}-(\d{4})$/);
      if (match) {
        nextSeq = parseInt(match[1], 10) + 1;
      }
    }

    return formatTransactionNumber(year, month, nextSeq);
  }

  validateSourceAccountBalance(sourceAccountId: string, amount: number, excludeTransactionId?: string): { valid: boolean; currentBalance: number } {
    const accounts = this.getAccounts(true);
    let allTrx = this.getAllTransactionsRaw();
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

  createTransaction(
    data: TransactionInput,
    attachments: AttachmentPayload[] = [],
    createdBy = 'prof-admin'
  ): Transaction {
    // 1. Balance validation for EXPENSE or TRANSFER
    if (data.type === 'EXPENSE' || data.type === 'TRANSFER') {
      if (!data.source_account_id) {
        throw new Error('Akun sumber wajib diisi');
      }
      const { valid, currentBalance } = this.validateSourceAccountBalance(data.source_account_id, data.amount);
      if (!valid) {
        throw new Error(`Saldo akun sumber tidak mencukupi. Saldo saat ini: Rp${currentBalance.toLocaleString('id-ID')}, dibutuhkan: Rp${data.amount.toLocaleString('id-ID')}`);
      }
    }

    // 2. Generate collision-safe unique transaction number
    const transactionNumber = this.getNextTransactionNumber(data.transaction_date);
    const id = `trx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // 3. Insert transaction
    this.db.prepare(`
      INSERT INTO transactions (
        id, transaction_number, transaction_date, type, 
        source_account_id, destination_account_id, category_id, 
        amount, description, note, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      transactionNumber,
      data.transaction_date,
      data.type,
      data.source_account_id || null,
      data.destination_account_id || null,
      data.category_id || null,
      data.amount,
      data.description,
      data.note || null,
      createdBy
    );

    // 4. Insert attachments
    const insertAtt = this.db.prepare(`
      INSERT INTO transaction_attachments (id, transaction_id, file_name, file_path, mime_type, file_size)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const att of attachments) {
      const attId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      insertAtt.run(attId, id, att.file_name, att.file_path, att.mime_type, att.file_size);
    }

    return this.getTransactionById(id)!;
  }

  updateTransaction(id: string, data: TransactionInput): Transaction {
    const existing = this.getTransactionById(id);
    if (!existing) throw new Error('Transaksi tidak ditemukan');

    // Validate balance
    if (data.type === 'EXPENSE' || data.type === 'TRANSFER') {
      if (!data.source_account_id) throw new Error('Akun sumber wajib diisi');
      const { valid, currentBalance } = this.validateSourceAccountBalance(data.source_account_id, data.amount, id);
      if (!valid) {
        throw new Error(`Saldo akun sumber tidak mencukupi. Saldo saat ini: Rp${currentBalance.toLocaleString('id-ID')}, dibutuhkan: Rp${data.amount.toLocaleString('id-ID')}`);
      }
    }

    this.db.prepare(`
      UPDATE transactions 
      SET transaction_date = ?, type = ?, source_account_id = ?, destination_account_id = ?, 
          category_id = ?, amount = ?, description = ?, note = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      data.transaction_date,
      data.type,
      data.source_account_id || null,
      data.destination_account_id || null,
      data.category_id || null,
      data.amount,
      data.description,
      data.note || null,
      id
    );

    return this.getTransactionById(id)!;
  }

  deleteTransaction(id: string): { success: boolean; deletedAttachments: TransactionAttachment[] } {
    const rawAttachments = this.db.prepare('SELECT * FROM transaction_attachments WHERE transaction_id = ?').all(id) as any[];
    const attachments = rawAttachments.map((a) => ({
      ...a,
      file_size: Number(a.file_size),
    }));

    this.db.prepare('DELETE FROM transaction_attachments WHERE transaction_id = ?').run(id);
    this.db.prepare('DELETE FROM transactions WHERE id = ?').run(id);

    return { success: true, deletedAttachments: attachments };
  }

  addAttachment(transactionId: string, payload: AttachmentPayload): TransactionAttachment {
    const attId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    this.db.prepare(`
      INSERT INTO transaction_attachments (id, transaction_id, file_name, file_path, mime_type, file_size)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(attId, transactionId, payload.file_name, payload.file_path, payload.mime_type, payload.file_size);

    const raw = this.db.prepare('SELECT * FROM transaction_attachments WHERE id = ?').get(attId) as any;
    return {
      ...raw,
      file_size: Number(raw.file_size),
    };
  }

  deleteAttachment(attachmentId: string): TransactionAttachment | null {
    const att = this.db.prepare('SELECT * FROM transaction_attachments WHERE id = ?').get(attachmentId) as any;
    if (!att) return null;
    this.db.prepare('DELETE FROM transaction_attachments WHERE id = ?').run(attachmentId);
    return {
      ...att,
      file_size: Number(att.file_size),
    };
  }

  // Profile & Auth
  getProfile(email?: string): Profile | null {
    if (email) {
      return this.db.prepare('SELECT id, name, email, created_at, updated_at FROM profiles WHERE email = ?').get(email) as Profile | null;
    }
    return this.db.prepare('SELECT id, name, email, created_at, updated_at FROM profiles LIMIT 1').get() as Profile | null;
  }

  verifyPassword(email: string, passwordAttempt: string): boolean {
    const user = this.db.prepare('SELECT password_hash FROM profiles WHERE email = ?').get(email) as { password_hash: string } | undefined;
    if (!user) return false;
    return user.password_hash === passwordAttempt;
  }

  updateProfile(id: string, name: string, email: string, newPassword?: string): Profile {
    if (newPassword && newPassword.trim().length >= 6) {
      this.db.prepare(`
        UPDATE profiles SET name = ?, email = ?, password_hash = ?, updated_at = datetime('now') WHERE id = ?
      `).run(name, email, newPassword, id);
    } else {
      this.db.prepare(`
        UPDATE profiles SET name = ?, email = ?, updated_at = datetime('now') WHERE id = ?
      `).run(name, email, id);
    }
    return this.getProfile(email)!;
  }

  // App Settings
  getSetting(key: string): string | null {
    const row = this.db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  setSetting(key: string, value: string, updatedBy?: string): void {
    const id = `set-${key}`;
    this.db.prepare(`
      INSERT INTO app_settings (id, key, value, updated_at, updated_by)
      VALUES (?, ?, ?, datetime('now'), ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now'), updated_by = excluded.updated_by
    `).run(id, key, value, updatedBy || null);
  }

  // Reset database for tests / initialization
  resetDataForTesting() {
    this.db.exec(`
      DELETE FROM transaction_attachments;
      DELETE FROM transactions;
      DELETE FROM accounts;
      DELETE FROM categories;
      DELETE FROM app_settings;
    `);
    _dbInstance = null;
    getDb();
  }

  private mapTransactionRow(r: any, attachments: TransactionAttachment[] = []): Transaction {
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
      source_account: r.source_account_id
        ? {
            id: r.source_account_id,
            code: r.sa_code,
            name: r.sa_name,
            opening_balance: Number(r.sa_ob),
            opening_balance_date: r.sa_obd,
            is_active: Boolean(r.sa_active),
            created_at: '',
            updated_at: '',
          }
        : null,
      destination_account: r.destination_account_id
        ? {
            id: r.destination_account_id,
            code: r.da_code,
            name: r.da_name,
            opening_balance: Number(r.da_ob),
            opening_balance_date: r.da_obd,
            is_active: Boolean(r.da_active),
            created_at: '',
            updated_at: '',
          }
        : null,
      category: r.category_id
        ? {
            id: r.category_id,
            code: r.c_code,
            name: r.c_name,
            type: r.c_type,
            is_active: Boolean(r.c_active),
            created_at: '',
            updated_at: '',
          }
        : null,
      attachments,
    };
  }
}

export const financeRepo = new FinanceRepository();
