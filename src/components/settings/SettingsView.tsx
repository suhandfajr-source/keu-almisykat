'use client';

import React, { useState } from 'react';
import { 
  Landmark, 
  Tag, 
  Database, 
  User, 
  Plus, 
  X, 
  Lock, 
  Unlock, 
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Trash2
} from 'lucide-react';
import { Account, Category, Profile } from '@/types/finance';
import { formatRupiah } from '@/lib/finance-math';
import { 
  saveAccountAction, 
  toggleAccountActiveAction, 
  saveCategoryAction, 
  toggleCategoryActiveAction 
} from '@/app/actions/settings';
import { updateProfileAction } from '@/app/actions/auth';
import { BrandIdentityConfig } from '@/types/finance';
import { BrandIdentity } from '@/components/common/BrandIdentity';
import { saveBrandingAction, removeLogoAction } from '@/app/actions/branding';

interface SettingsViewProps {
  accounts: Account[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  profile: Profile | null;
  brand?: BrandIdentityConfig;
}

export function SettingsView({
  accounts,
  incomeCategories,
  expenseCategories,
  profile,
  brand,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'accounts' | 'categories' | 'opening' | 'branding' | 'user'>('accounts');
  const [categoryType, setCategoryType] = useState<'INCOME' | 'EXPENSE'>('INCOME');

  // Account modal
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Opening balance lock
  const [isOpeningUnlocked, setIsOpeningUnlocked] = useState(false);

  // Brand Identity states
  const [appName, setAppName] = useState(brand?.appName || 'Al-Misykat');
  const [appSubtitle, setAppSubtitle] = useState(brand?.appSubtitle || 'Keuangan Pesantren');
  const [logoPreview, setLogoPreview] = useState<string | null>(brand?.logoUrl || null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  // Feedback states
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const clearMessages = () => {
    setActionSuccess(null);
    setActionError(null);
  };

  // Handle Account Save
  const handleAccountSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();
    const formData = new FormData(e.currentTarget);
    const res = await saveAccountAction(null, formData);
    if (res?.error) {
      setActionError(res.error);
    } else {
      setActionSuccess('Data akun keuangan berhasil disimpan');
      setShowAccountModal(false);
      setEditingAccount(null);
    }
  };

  // Handle Category Save
  const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();
    const formData = new FormData(e.currentTarget);
    const res = await saveCategoryAction(null, formData);
    if (res?.error) {
      setActionError(res.error);
    } else {
      setActionSuccess('Data kategori berhasil disimpan');
      setShowCategoryModal(false);
      setEditingCategory(null);
    }
  };

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();
    const formData = new FormData(e.currentTarget);
    const res = await updateProfileAction(null, formData);
    if (res?.error) {
      setActionError(res.error);
    } else {
      setActionSuccess(res?.message || 'Profil berhasil diperbarui');
    }
  };

  // Handle Logo Select
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearMessages();
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const validExtensions = ['.jpg', '.jpeg', '.png', '.svg', '.webp'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setActionError(`Format file ${ext} tidak didukung. Format yang diizinkan: PNG, JPG, JPEG, SVG, WebP.`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setActionError(`Ukuran file (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal 5 MB.`);
      return;
    }

    setSelectedLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // Handle Full Branding Submit (Name, Subtitle, Logo)
  const handleBrandingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();

    if (!appName || appName.trim().length === 0) {
      setActionError('Nama aplikasi wajib diisi.');
      return;
    }

    if (appName.trim().length > 60) {
      setActionError('Nama aplikasi maksimal 60 karakter.');
      return;
    }

    if (appSubtitle.trim().length > 100) {
      setActionError('Subtitle aplikasi maksimal 100 karakter.');
      return;
    }

    setIsSavingBranding(true);

    try {
      const formData = new FormData();
      formData.append('app_name', appName.trim());
      formData.append('app_subtitle', appSubtitle.trim());
      if (selectedLogoFile) {
        formData.append('logo', selectedLogoFile);
      }

      const res = await saveBrandingAction(null, formData);

      if (res?.error) {
        setActionError(res.error);
      } else {
        setActionSuccess(res?.message || 'Identitas branding aplikasi berhasil diperbarui!');
        if (res?.brand?.logoUrl) {
          setLogoPreview(res.brand.logoUrl);
        }
        setSelectedLogoFile(null);
      }
    } catch (err: any) {
      setActionError(err.message || 'Gagal menyimpan pengaturan branding');
    } finally {
      setIsSavingBranding(false);
    }
  };

  // Handle Logo Remove
  const handleLogoRemove = async () => {
    if (!confirm('Hapus logo aplikasi dan kembali ke logo default?')) return;

    clearMessages();
    setIsSavingBranding(true);

    try {
      const res = await removeLogoAction();
      if (res?.error) {
        setActionError(res.error);
      } else {
        setActionSuccess(res?.message || 'Logo berhasil dihapus, kembali ke logo default.');
        setLogoPreview(null);
        setSelectedLogoFile(null);
      }
    } catch (err: any) {
      setActionError(err.message || 'Gagal menghapus logo');
    } finally {
      setIsSavingBranding(false);
    }
  };

  const totalOpening = accounts.reduce((sum, a) => sum + a.opening_balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark tracking-tight">Pengaturan Sistem</h1>
        <p className="text-xs text-brand-muted mt-1">
          Kelola master akun keuangan, kategori transaksi, saldo awal, logo branding, dan profil pengguna
        </p>
      </div>

      {/* Feedback alerts */}
      {actionSuccess && (
        <div className="p-3.5 bg-brand-green-light border border-brand-green/20 rounded-2xl text-brand-green text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 bg-brand-maroon-light border border-brand-maroon-border rounded-2xl text-brand-maroon text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-brand-maroon shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 5 Main Tabs */}
      <div className="flex border-b border-brand-border space-x-1 sm:space-x-8 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => { setActiveTab('accounts'); clearMessages(); }}
          className={`flex items-center gap-2 pb-3.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'accounts'
              ? 'border-brand-gold text-brand-dark font-bold'
              : 'border-transparent text-brand-muted hover:text-brand-dark'
          }`}
        >
          <Landmark className="w-4 h-4 text-brand-teal" />
          <span>Akun Keuangan</span>
        </button>

        <button
          onClick={() => { setActiveTab('categories'); clearMessages(); }}
          className={`flex items-center gap-2 pb-3.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'categories'
              ? 'border-brand-gold text-brand-dark font-bold'
              : 'border-transparent text-brand-muted hover:text-brand-dark'
          }`}
        >
          <Tag className="w-4 h-4 text-brand-gold" />
          <span>Kategori Transaksi</span>
        </button>

        <button
          onClick={() => { setActiveTab('opening'); clearMessages(); }}
          className={`flex items-center gap-2 pb-3.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'opening'
              ? 'border-brand-gold text-brand-dark font-bold'
              : 'border-transparent text-brand-muted hover:text-brand-dark'
          }`}
        >
          <Database className="w-4 h-4 text-brand-muted" />
          <span>Saldo / Data Awal</span>
        </button>

        <button
          onClick={() => { setActiveTab('branding'); clearMessages(); }}
          className={`flex items-center gap-2 pb-3.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'branding'
              ? 'border-brand-gold text-brand-dark font-bold'
              : 'border-transparent text-brand-muted hover:text-brand-dark'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-brand-green" />
          <span>Branding</span>
        </button>

        <button
          onClick={() => { setActiveTab('user'); clearMessages(); }}
          className={`flex items-center gap-2 pb-3.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'user'
              ? 'border-brand-gold text-brand-dark font-bold'
              : 'border-transparent text-brand-muted hover:text-brand-dark'
          }`}
        >
          <User className="w-4 h-4 text-brand-maroon" />
          <span>Profil Pengguna</span>
        </button>
      </div>

      {/* SECTION 1: AKUN KEUANGAN */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-brand-dark">Daftar Akun Keuangan</h2>
            <button
              onClick={() => {
                setEditingAccount(null);
                setShowAccountModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-gold hover:bg-brand-gold-hover text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Akun</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-warm/60 border-b border-brand-border text-brand-muted uppercase font-semibold">
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Akun</th>
                  <th className="py-3 px-4 text-right">Saldo Awal (Cut-off 31 Juli)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-brand-warm/40">
                    <td className="py-3 px-4 font-bold text-brand-dark">{acc.code}</td>
                    <td className="py-3 px-4 font-semibold text-brand-dark">{acc.name}</td>
                    <td className="py-3 px-4 text-right font-mono-numbers">{formatRupiah(acc.opening_balance)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.is_active ? 'bg-brand-green-light text-brand-green border border-brand-green/20' : 'bg-brand-warm text-brand-muted'
                      }`}>
                        {acc.is_active ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingAccount(acc);
                          setShowAccountModal(true);
                        }}
                        className="text-brand-gold hover:text-brand-gold-hover font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          await toggleAccountActiveAction(acc.id, acc.is_active);
                        }}
                        className="text-brand-muted hover:text-brand-dark cursor-pointer"
                      >
                        {acc.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: KATEGORI */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Income / Expense sub-tabs */}
            <div className="inline-flex bg-brand-warm p-1 rounded-xl border border-brand-border">
              <button
                onClick={() => setCategoryType('INCOME')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  categoryType === 'INCOME' ? 'bg-white text-brand-green font-bold shadow-xs' : 'text-brand-muted'
                }`}
              >
                Pemasukan ({incomeCategories.length})
              </button>
              <button
                onClick={() => setCategoryType('EXPENSE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  categoryType === 'EXPENSE' ? 'bg-white text-brand-maroon font-bold shadow-xs' : 'text-brand-muted'
                }`}
              >
                Pengeluaran ({expenseCategories.length})
              </button>
            </div>

            <button
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-gold hover:bg-brand-gold-hover text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kategori</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-warm/60 border-b border-brand-border text-brand-muted uppercase font-semibold">
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Kategori</th>
                  <th className="py-3 px-4 text-center">Tipe</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {(categoryType === 'INCOME' ? incomeCategories : expenseCategories).map((cat) => (
                  <tr key={cat.id} className="hover:bg-brand-warm/40">
                    <td className="py-3 px-4 font-bold text-brand-dark">{cat.code}</td>
                    <td className="py-3 px-4 font-medium text-brand-dark">{cat.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        cat.type === 'INCOME' ? 'bg-brand-green-light text-brand-green border border-brand-green/20' : 'bg-brand-maroon-light text-brand-maroon border border-brand-maroon/20'
                      }`}>
                        {cat.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cat.is_active ? 'bg-brand-green-light text-brand-green border border-brand-green/20' : 'bg-brand-warm text-brand-muted'
                      }`}>
                        {cat.is_active ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setShowCategoryModal(true);
                        }}
                        className="text-brand-gold hover:text-brand-gold-hover font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          await toggleCategoryActiveAction(cat.id, cat.is_active);
                        }}
                        className="text-brand-muted hover:text-brand-dark cursor-pointer"
                      >
                        {cat.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: SALDO / DATA AWAL */}
      {activeTab === 'opening' && (
        <div className="space-y-6">
          <div className="p-4 bg-brand-gold-light/40 border border-brand-gold/30 rounded-2xl flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <div className="text-xs text-brand-dark">
                <p className="font-bold">Ketentuan Saldo Awal Cut-Off 31 Juli 2026:</p>
                <p className="mt-0.5">
                  Saldo awal ini merupakan posisi keuangan Pondok Pesantren Al-Misykat Al-Islami pada tanggal <strong>31 Juli 2026</strong>. Saldo awal ini dikunci untuk menjaga integritas pembukuan operasional yang dimulai 1 Agustus 2026.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isOpeningUnlocked) {
                  if (confirm('PERINGATAN: Mengubah saldo awal akan mengubah seluruh kalkulasi saldo historis dan laporan keuangan. Buka kunci saldo awal?')) {
                    setIsOpeningUnlocked(true);
                  }
                } else {
                  setIsOpeningUnlocked(false);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                isOpeningUnlocked
                  ? 'bg-brand-maroon text-white hover:bg-brand-maroon-hover'
                  : 'bg-white border border-brand-gold/40 text-brand-dark hover:bg-brand-gold-light'
              }`}
            >
              {isOpeningUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isOpeningUnlocked ? 'Kunci Kembali' : 'Buka Kunci (Audit)'}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-6">
            <h2 className="text-sm font-bold text-brand-dark mb-4">Rincian Posisi Saldo Awal Master</h2>

            <div className="space-y-3">
              {accounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between p-3.5 bg-brand-warm-50 rounded-xl border border-brand-border text-xs">
                  <div>
                    <span className="font-bold text-brand-dark mr-2">{acc.code}</span>
                    <span className="font-semibold text-brand-dark">{acc.name}</span>
                    <span className="text-brand-muted block text-[11px]">Tanggal Cut-off: {acc.opening_balance_date}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono-numbers text-brand-dark text-sm">
                      {formatRupiah(acc.opening_balance)}
                    </span>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between p-4 bg-brand-gold-light/40 rounded-xl border border-brand-gold/40 text-xs font-bold mt-4">
                <span className="text-brand-dark uppercase">Total Saldo Awal Cut-off</span>
                <span className="text-base font-extrabold font-mono-numbers text-brand-dark">
                  {formatRupiah(totalOpening)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: BRANDING (PENGATURAN IDENTITAS & LOGO) */}
      {activeTab === 'branding' && (
        <div className="max-w-2xl bg-white rounded-2xl border border-brand-border shadow-xs p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-brand-dark">Pengaturan Identitas & Branding Aplikasi</h2>
            <p className="text-xs text-brand-muted mt-1">
              Atur nama aplikasi, subtitle, dan logo resmi yang akan tampil di Sidebar, Header, dan Halaman Login.
            </p>
          </div>

          <form onSubmit={handleBrandingSubmit} className="space-y-6 text-xs">
            {/* 1. Identitas Aplikasi */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider text-brand-gold">
                1. Identitas Aplikasi
              </h3>

              <div>
                <label className="block font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
                  Nama Aplikasi <span className="text-brand-maroon">*</span>
                </label>
                <input
                  type="text"
                  name="app_name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  maxLength={60}
                  required
                  placeholder="Contoh: Al-Misykat atau Yayasan Al-Misykat"
                  className="w-full px-3.5 py-2.5 bg-brand-warm-50 border border-brand-border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
                />
                <span className="text-[11px] text-brand-muted mt-1 block">
                  Maksimal 60 karakter. Tampil di judul sidebar, header, dan halaman login.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
                  Subtitle / Deskripsi Aplikasi
                </label>
                <input
                  type="text"
                  name="app_subtitle"
                  value={appSubtitle}
                  onChange={(e) => setAppSubtitle(e.target.value)}
                  maxLength={100}
                  placeholder="Contoh: Keuangan Pesantren atau Sistem Keuangan Terpadu"
                  className="w-full px-3.5 py-2.5 bg-brand-warm-50 border border-brand-border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
                />
                <span className="text-[11px] text-brand-muted mt-1 block">
                  Maksimal 100 karakter. Keterangan pendukung di bawah nama aplikasi.
                </span>
              </div>
            </div>

            {/* 2. Logo Aplikasi */}
            <div className="space-y-4 pt-4 border-t border-brand-border">
              <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider text-brand-gold">
                2. Logo Aplikasi
              </h3>

              {/* Live Preview */}
              <div>
                <span className="block font-semibold text-brand-dark uppercase tracking-wider mb-2">
                  Preview Tampilan Identitas
                </span>
                <div className="p-4 bg-brand-warm-50 rounded-2xl border border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <BrandIdentity
                    appName={appName}
                    appSubtitle={appSubtitle}
                    logoUrl={logoPreview}
                    layout="preview"
                  />
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleLogoRemove}
                      disabled={isSavingBranding}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand-maroon hover:bg-brand-maroon-light rounded-xl transition-colors cursor-pointer border border-brand-maroon-border shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Logo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* File Upload Box */}
              <div>
                <label className="block font-semibold text-brand-dark uppercase tracking-wider mb-2">
                  Ganti File Logo (Opsional)
                </label>
                <div className="border-2 border-dashed border-brand-border hover:border-brand-gold rounded-2xl p-5 text-center bg-brand-warm-50/50 transition-colors">
                  <input
                    type="file"
                    id="logo-upload"
                    accept=".jpg,.jpeg,.png,.svg,.webp"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-brand-gold-light text-brand-gold flex items-center justify-center mb-1.5">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-brand-dark">
                      {selectedLogoFile ? selectedLogoFile.name : 'Klik untuk memilih file logo (PNG, JPG, JPEG, SVG, WebP)'}
                    </span>
                    <span className="text-[11px] text-brand-muted mt-1">
                      Batas ukuran maksimal 5 MB. Disarankan format PNG transparan atau SVG.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-brand-border flex justify-end">
              <button
                type="submit"
                disabled={isSavingBranding}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-gold hover:bg-brand-gold-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSavingBranding ? (
                  <span>Menyimpan Perubahan...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 5: PROFIL PENGGUNA */}
      {activeTab === 'user' && (
        <div className="max-w-xl bg-white rounded-2xl border border-brand-border shadow-xs p-6 sm:p-8">
          <h2 className="text-base font-bold text-brand-dark mb-1">Pengaturan Akun Bendahara</h2>
          <p className="text-xs text-brand-muted mb-6">Kelola informasi nama, alamat email, dan kata sandi akses aplikasi</p>

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
                Nama Pengguna
              </label>
              <input
                type="text"
                name="name"
                defaultValue={profile?.name || 'Bendahara Al-Misykat'}
                required
                className="w-full px-3.5 py-2.5 bg-brand-warm-50 border border-brand-border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
                Alamat Email Login
              </label>
              <input
                type="email"
                name="email"
                defaultValue={profile?.email || 'admin@almisykat.com'}
                required
                className="w-full px-3.5 py-2.5 bg-brand-warm-50 border border-brand-border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
              />
            </div>

            <div className="pt-2 border-t border-brand-border">
              <label className="block font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
                Kata Sandi Baru (Kosongkan jika tidak diubah)
              </label>
              <input
                type="password"
                name="new_password"
                placeholder="Minimal 6 karakter..."
                className="w-full px-3.5 py-2.5 bg-brand-warm-50 border border-brand-border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                type="password"
                name="confirm_password"
                placeholder="Ulangi kata sandi baru..."
                className="w-full px-3.5 py-2.5 bg-brand-warm-50 border border-brand-border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-2.5 bg-brand-gold hover:bg-brand-gold-hover text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer text-sm"
              >
                Simpan Perubahan Profil
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-brand-border">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border mb-4">
              <h2 className="text-base font-bold text-brand-dark">
                {editingAccount ? 'Edit Akun Keuangan' : 'Tambah Akun Keuangan Baru'}
              </h2>
              <button onClick={() => setShowAccountModal(false)} className="p-1 text-brand-muted hover:text-brand-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAccountSubmit} className="space-y-4 text-xs">
              {editingAccount && <input type="hidden" name="id" value={editingAccount.id} />}

              <div>
                <label className="block font-semibold text-brand-dark mb-1">Kode Akun</label>
                <input
                  type="text"
                  name="code"
                  defaultValue={editingAccount?.code || ''}
                  required
                  placeholder="Contoh: AK04"
                  className="w-full px-3 py-2 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-brand-dark mb-1">Nama Akun</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingAccount?.name || ''}
                  required
                  placeholder="Contoh: Bank BSI Pesantren"
                  className="w-full px-3 py-2 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-brand-dark mb-1">Saldo Awal (Rupiah)</label>
                <input
                  type="number"
                  name="opening_balance"
                  defaultValue={editingAccount?.opening_balance || 0}
                  required
                  className="w-full px-3 py-2 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="acc_active"
                  name="is_active"
                  defaultChecked={editingAccount ? editingAccount.is_active : true}
                  className="rounded text-brand-gold focus:ring-brand-gold"
                />
                <label htmlFor="acc_active" className="text-brand-dark font-medium">Akun Aktif</label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-3 py-2 text-brand-muted hover:bg-brand-warm rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-gold hover:bg-brand-gold-hover text-white font-semibold rounded-xl cursor-pointer shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-brand-border">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border mb-4">
              <h2 className="text-base font-bold text-brand-dark">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h2>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 text-brand-muted hover:text-brand-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs">
              {editingCategory && <input type="hidden" name="id" value={editingCategory.id} />}

              <div>
                <label className="block font-semibold text-brand-dark mb-1">Tipe Kategori</label>
                <select
                  name="type"
                  defaultValue={editingCategory?.type || categoryType}
                  required
                  className="w-full px-3 py-2 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
                >
                  <option value="INCOME">Pemasukan</option>
                  <option value="EXPENSE">Pengeluaran</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-brand-dark mb-1">Kode Kategori</label>
                <input
                  type="text"
                  name="code"
                  defaultValue={editingCategory?.code || ''}
                  required
                  placeholder="Contoh: PM17 atau PG20"
                  className="w-full px-3 py-2 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-brand-dark mb-1">Nama Kategori</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCategory?.name || ''}
                  required
                  placeholder="Contoh: Honor Narasumber Pengajian"
                  className="w-full px-3 py-2 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cat_active"
                  name="is_active"
                  defaultChecked={editingCategory ? editingCategory.is_active : true}
                  className="rounded text-brand-gold focus:ring-brand-gold"
                />
                <label htmlFor="cat_active" className="text-brand-dark font-medium">Kategori Aktif</label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-3 py-2 text-brand-muted hover:bg-brand-warm rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-gold hover:bg-brand-gold-hover text-white font-semibold rounded-xl cursor-pointer shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
