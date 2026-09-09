import { financeRepo } from './engine';
import { supabaseFinanceRepo } from './supabase-repo';
import { Account, Category, Transaction, TransactionAttachment, Profile, BrandIdentityConfig } from '@/types/finance';
import { TransactionInput, AccountInput, CategoryInput } from '@/lib/validations/finance';
import { AttachmentPayload } from './engine';

export function isSupabaseMode(): boolean {
  // Default to Supabase in production or when NEXT_PUBLIC_SUPABASE_URL is provided
  if (process.env.DATABASE_DRIVER === 'local') return false;
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export interface IFinanceRepository {
  getAccounts(includeInactive?: boolean): Promise<Account[]>;
  getAccountById(id: string): Promise<Account | null>;
  createAccount(data: AccountInput): Promise<Account>;
  updateAccount(id: string, data: Partial<AccountInput>): Promise<Account>;
  getCategories(type?: 'INCOME' | 'EXPENSE', includeInactive?: boolean): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | null>;
  createCategory(data: CategoryInput): Promise<Category>;
  updateCategory(id: string, data: Partial<CategoryInput>): Promise<Category>;
  getAllTransactionsRaw(): Promise<Transaction[]>;
  getTransactions(filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    accountId?: string;
    categoryId?: string;
    search?: string;
  }): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | null>;
  getNextTransactionNumber(transactionDate: string): Promise<string>;
  validateSourceAccountBalance(sourceAccountId: string, amount: number, excludeTransactionId?: string): Promise<{ valid: boolean; currentBalance: number }>;
  createTransaction(data: TransactionInput, attachments?: AttachmentPayload[], createdBy?: string): Promise<Transaction>;
  updateTransaction(id: string, data: TransactionInput): Promise<Transaction>;
  deleteTransaction(id: string): Promise<{ success: boolean; deletedAttachments: TransactionAttachment[] }>;
  addAttachment(transactionId: string, payload: AttachmentPayload): Promise<TransactionAttachment>;
  deleteAttachment(attachmentId: string): Promise<TransactionAttachment | null>;
  getProfile(userIdOrEmail?: string): Promise<Profile | null>;
  updateProfile(userId: string, name: string, email: string, newPassword?: string): Promise<Profile>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string, updatedBy?: string): Promise<void>;
  getBrandIdentity(): Promise<BrandIdentityConfig>;
}

class UnifiedFinanceRepository implements IFinanceRepository {
  private getActiveRepo(): IFinanceRepository {
    if (isSupabaseMode()) {
      return supabaseFinanceRepo as unknown as IFinanceRepository;
    }
    return {
      getAccounts: async (inc) => financeRepo.getAccounts(inc),
      getAccountById: async (id) => financeRepo.getAccountById(id),
      createAccount: async (data) => financeRepo.createAccount(data),
      updateAccount: async (id, data) => financeRepo.updateAccount(id, data),
      getCategories: async (type, inc) => financeRepo.getCategories(type, inc),
      getCategoryById: async (id) => financeRepo.getCategoryById(id),
      createCategory: async (data) => financeRepo.createCategory(data),
      updateCategory: async (id, data) => financeRepo.updateCategory(id, data),
      getAllTransactionsRaw: async () => financeRepo.getAllTransactionsRaw(),
      getTransactions: async (filters) => financeRepo.getTransactions(filters),
      getTransactionById: async (id) => financeRepo.getTransactionById(id),
      getNextTransactionNumber: async (date) => financeRepo.getNextTransactionNumber(date),
      validateSourceAccountBalance: async (id, amt, ex) => financeRepo.validateSourceAccountBalance(id, amt, ex),
      createTransaction: async (data, atts, by) => financeRepo.createTransaction(data, atts, by),
      updateTransaction: async (id, data) => financeRepo.updateTransaction(id, data),
      deleteTransaction: async (id) => financeRepo.deleteTransaction(id),
      addAttachment: async (id, payload) => financeRepo.addAttachment(id, payload),
      deleteAttachment: async (id) => financeRepo.deleteAttachment(id),
      getProfile: async (idOrEmail) => financeRepo.getProfile(idOrEmail),
      updateProfile: async (id, name, email, newPassword) => financeRepo.updateProfile(id, name, email, newPassword),
      getSetting: async (key) => financeRepo.getSetting(key),
      setSetting: async (key, val, by) => financeRepo.setSetting(key, val, by),
      getBrandIdentity: async () => {
        const [appName, appSubtitle, logoUrl] = await Promise.all([
          financeRepo.getSetting('app_name'),
          financeRepo.getSetting('app_subtitle'),
          financeRepo.getSetting('app_logo_path'),
        ]);
        return {
          appName: (appName && appName.trim()) || 'Al-Misykat',
          appSubtitle: (appSubtitle !== null && appSubtitle !== undefined && appSubtitle.trim() !== '') ? appSubtitle.trim() : 'Keuangan Pesantren',
          logoUrl: (logoUrl && logoUrl.trim()) || null,
        };
      },
    };
  }

  async getAccounts(includeInactive = true) {
    return this.getActiveRepo().getAccounts(includeInactive);
  }
  async getAccountById(id: string) {
    return this.getActiveRepo().getAccountById(id);
  }
  async createAccount(data: AccountInput) {
    return this.getActiveRepo().createAccount(data);
  }
  async updateAccount(id: string, data: Partial<AccountInput>) {
    return this.getActiveRepo().updateAccount(id, data);
  }
  async getCategories(type?: 'INCOME' | 'EXPENSE', includeInactive = true) {
    return this.getActiveRepo().getCategories(type, includeInactive);
  }
  async getCategoryById(id: string) {
    return this.getActiveRepo().getCategoryById(id);
  }
  async createCategory(data: CategoryInput) {
    return this.getActiveRepo().createCategory(data);
  }
  async updateCategory(id: string, data: Partial<CategoryInput>) {
    return this.getActiveRepo().updateCategory(id, data);
  }
  async getAllTransactionsRaw() {
    return this.getActiveRepo().getAllTransactionsRaw();
  }
  async getTransactions(filters?: any) {
    return this.getActiveRepo().getTransactions(filters);
  }
  async getTransactionById(id: string) {
    return this.getActiveRepo().getTransactionById(id);
  }
  async getNextTransactionNumber(transactionDate: string) {
    return this.getActiveRepo().getNextTransactionNumber(transactionDate);
  }
  async validateSourceAccountBalance(sourceAccountId: string, amount: number, excludeTransactionId?: string) {
    return this.getActiveRepo().validateSourceAccountBalance(sourceAccountId, amount, excludeTransactionId);
  }
  async createTransaction(data: TransactionInput, attachments?: AttachmentPayload[], createdBy?: string) {
    return this.getActiveRepo().createTransaction(data, attachments, createdBy);
  }
  async updateTransaction(id: string, data: TransactionInput) {
    return this.getActiveRepo().updateTransaction(id, data);
  }
  async deleteTransaction(id: string) {
    return this.getActiveRepo().deleteTransaction(id);
  }
  async addAttachment(transactionId: string, payload: AttachmentPayload) {
    return this.getActiveRepo().addAttachment(transactionId, payload);
  }
  async deleteAttachment(attachmentId: string) {
    return this.getActiveRepo().deleteAttachment(attachmentId);
  }
  async getProfile(userIdOrEmail?: string) {
    return this.getActiveRepo().getProfile(userIdOrEmail);
  }
  async updateProfile(userId: string, name: string, email: string, newPassword?: string) {
    return this.getActiveRepo().updateProfile(userId, name, email, newPassword);
  }
  async getSetting(key: string) {
    return this.getActiveRepo().getSetting(key);
  }
  async setSetting(key: string, value: string, updatedBy?: string) {
    return this.getActiveRepo().setSetting(key, value, updatedBy);
  }
  async getBrandIdentity(): Promise<BrandIdentityConfig> {
    try {
      const [appName, appSubtitle, logoUrl] = await Promise.all([
        this.getSetting('app_name'),
        this.getSetting('app_subtitle'),
        this.getSetting('app_logo_path'),
      ]);
      return {
        appName: (appName && appName.trim()) || 'Al-Misykat',
        appSubtitle: (appSubtitle !== null && appSubtitle !== undefined && appSubtitle.trim() !== '') ? appSubtitle.trim() : 'Keuangan Pesantren',
        logoUrl: (logoUrl && logoUrl.trim()) || null,
      };
    } catch {
      return {
        appName: 'Al-Misykat',
        appSubtitle: 'Keuangan Pesantren',
        logoUrl: null,
      };
    }
  }
}

export const financeDb = new UnifiedFinanceRepository();
export { financeRepo, supabaseFinanceRepo };
