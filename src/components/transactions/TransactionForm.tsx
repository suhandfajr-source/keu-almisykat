'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowRightLeft, 
  Upload, 
  FileText, 
  AlertCircle,
  Camera,
  Trash2
} from 'lucide-react';
import { Account, Category, Transaction } from '@/types/finance';
import { formatRupiah, parseRupiahInput } from '@/lib/finance-math';
import { getTodayJakarta } from '@/lib/date-utils';
import { createTransactionAction, updateTransactionAction } from '@/app/actions/transactions';
import { CameraCaptureModal } from '@/components/common/CameraCaptureModal';

interface TransactionFormProps {
  accounts: Account[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  accountBalances: Record<string, number>;
  initialData?: Transaction;
  isEdit?: boolean;
}

export function TransactionForm({
  accounts,
  incomeCategories,
  expenseCategories,
  accountBalances,
  initialData,
  isEdit = false,
}: TransactionFormProps) {
  const router = useRouter();

  const [type, setType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>(
    initialData?.type || 'INCOME'
  );
  const [transactionDate, setTransactionDate] = useState<string>(
    initialData?.transaction_date || getTodayJakarta()
  );
  const [sourceAccountId, setSourceAccountId] = useState<string>(
    initialData?.source_account_id || (accounts[0]?.id || '')
  );
  const [destinationAccountId, setDestinationAccountId] = useState<string>(
    initialData?.destination_account_id || (accounts[0]?.id || '')
  );
  const [categoryId, setCategoryId] = useState<string>(
    initialData?.category_id || (incomeCategories[0]?.id || '')
  );
  const [rawAmount, setRawAmount] = useState<string>(
    initialData ? initialData.amount.toString() : ''
  );
  const [description, setDescription] = useState<string>(
    initialData?.description || ''
  );
  const [note, setNote] = useState<string>(initialData?.note || '');

  // File uploads
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; size: string; isImage: boolean; url?: string }[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active categories based on selected type
  const activeCategories = type === 'INCOME' ? incomeCategories : expenseCategories;

  // Selected source balance
  const sourceBalance = sourceAccountId ? (accountBalances[sourceAccountId] || 0) : 0;
  const parsedAmount = parseRupiahInput(rawAmount);
  const isInsufficient = (type === 'EXPENSE' || type === 'TRANSFER') && parsedAmount > sourceBalance;

  // Amount formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const num = parseRupiahInput(val);
    setRawAmount(num > 0 ? num.toString() : '');
  };

  const formattedAmountDisplay = parsedAmount > 0 ? formatRupiah(parsedAmount) : '';

  // Process incoming files (from file picker or camera)
  const addFiles = (newFiles: File[]) => {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    for (const f of newFiles) {
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(ext)) {
        setErrorMsg(`Format file ${f.name} tidak didukung. Format yang diizinkan: JPG, JPEG, PNG, PDF.`);
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setErrorMsg(`File ${f.name} melebihi batas 10 MB.`);
        return;
      }
    }

    setErrorMsg(null);
    const updatedFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(updatedFiles);

    const updatedPreviews = updatedFiles.map((f) => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      isImage: f.type.startsWith('image/'),
      url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    setFilePreviews(updatedPreviews);
  };

  // File selection from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    addFiles(Array.from(e.target.files));
    e.target.value = ''; // Reset input to allow selecting same file again if needed
  };

  // Camera photo captured
  const handleCameraCapture = (capturedFile: File) => {
    addFiles([capturedFile]);
  };

  // Remove selected file
  const handleRemoveFile = (indexToRemove: number) => {
    const updatedFiles = selectedFiles.filter((_, idx) => idx !== indexToRemove);
    setSelectedFiles(updatedFiles);

    const updatedPreviews = updatedFiles.map((f) => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      isImage: f.type.startsWith('image/'),
      url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    setFilePreviews(updatedPreviews);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submit

    setErrorMsg(null);

    // Client validations
    if (!transactionDate) {
      setErrorMsg('Tanggal transaksi wajib diisi');
      return;
    }
    if (parsedAmount <= 0) {
      setErrorMsg('Nominal transaksi harus lebih dari Rp0');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Keterangan transaksi wajib diisi');
      return;
    }

    if (type === 'INCOME') {
      if (!destinationAccountId) {
        setErrorMsg('Akun tujuan pemasukan wajib dipilih');
        return;
      }
      if (!categoryId) {
        setErrorMsg('Kategori pemasukan wajib dipilih');
        return;
      }
    } else if (type === 'EXPENSE') {
      if (!sourceAccountId) {
        setErrorMsg('Akun sumber pengeluaran wajib dipilih');
        return;
      }
      if (!categoryId) {
        setErrorMsg('Kategori pengeluaran wajib dipilih');
        return;
      }
      if (isInsufficient) {
        setErrorMsg(`Saldo akun sumber tidak mencukupi (Saldo: ${formatRupiah(sourceBalance)}, dibutuhkan: ${formatRupiah(parsedAmount)})`);
        return;
      }
    } else if (type === 'TRANSFER') {
      if (!sourceAccountId || !destinationAccountId) {
        setErrorMsg('Akun sumber dan akun tujuan transfer wajib dipilih');
        return;
      }
      if (sourceAccountId === destinationAccountId) {
        setErrorMsg('Akun sumber dan akun tujuan transfer tidak boleh sama');
        return;
      }
      if (isInsufficient) {
        setErrorMsg(`Saldo akun sumber tidak mencukupi (Saldo: ${formatRupiah(sourceBalance)}, dibutuhkan: ${formatRupiah(parsedAmount)})`);
        return;
      }
    }

    // Evidence requirement for new transactions
    if (!isEdit && selectedFiles.length === 0) {
      setErrorMsg('Bukti transaksi (struk / nota / mutasi) wajib diunggah untuk transaksi baru.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('transaction_date', transactionDate);
      formData.append('type', type);
      formData.append('amount', parsedAmount.toString());
      formData.append('description', description.trim());
      if (note) formData.append('note', note.trim());

      if (type === 'INCOME') {
        formData.append('destination_account_id', destinationAccountId);
        formData.append('category_id', categoryId);
      } else if (type === 'EXPENSE') {
        formData.append('source_account_id', sourceAccountId);
        formData.append('category_id', categoryId);
      } else if (type === 'TRANSFER') {
        formData.append('source_account_id', sourceAccountId);
        formData.append('destination_account_id', destinationAccountId);
      }

      for (const file of selectedFiles) {
        formData.append('attachments', file);
      }

      if (isEdit && initialData) {
        const res = await updateTransactionAction(initialData.id, null, formData);
        if (res?.error) {
          setErrorMsg(res.error);
          setIsSubmitting(false);
        } else {
          router.push(`/transactions/${initialData.id}`);
          router.refresh();
        }
      } else {
        const res = await createTransactionAction(null, formData);
        if (res?.error) {
          setErrorMsg(res.error);
          setIsSubmitting(false);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="p-4 bg-brand-maroon-light border border-brand-maroon-border rounded-xl text-brand-maroon text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-brand-maroon shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Periksa kembali data Anda:</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Transaction Type Tabs */}
      {!isEdit && (
        <div>
          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">
            Tipe Transaksi
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                if (incomeCategories.length > 0) setCategoryId(incomeCategories[0].id);
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                type === 'INCOME'
                  ? 'bg-brand-green-light border-brand-green text-brand-green ring-2 ring-brand-green/20'
                  : 'bg-white border-brand-border text-brand-dark hover:bg-brand-warm-50'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 text-brand-green" />
              <span>Pemasukan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                if (expenseCategories.length > 0) setCategoryId(expenseCategories[0].id);
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-brand-maroon-light border-brand-maroon text-brand-maroon ring-2 ring-brand-maroon/20'
                  : 'bg-white border-brand-border text-brand-dark hover:bg-brand-warm-50'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-brand-maroon" />
              <span>Pengeluaran</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('TRANSFER');
                setCategoryId('');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                type === 'TRANSFER'
                  ? 'bg-brand-teal-light border-brand-teal text-brand-teal ring-2 ring-brand-teal/20'
                  : 'bg-white border-brand-border text-brand-dark hover:bg-brand-warm-50'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 text-brand-teal" />
              <span>Transfer</span>
            </button>
          </div>
        </div>
      )}

      {/* Date & Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
            Tanggal Transaksi <span className="text-brand-maroon">*</span>
          </label>
          <input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-white border border-brand-border rounded-xl text-sm text-brand-dark focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
          />
          <span className="text-[11px] text-brand-muted mt-1 block">Waktu bisnis: Asia/Jakarta (WIB)</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
            Nominal (Rupiah) <span className="text-brand-maroon">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={rawAmount ? parseInt(rawAmount, 10).toLocaleString('id-ID') : ''}
              onChange={handleAmountChange}
              placeholder="Contoh: 1.000.000"
              required
              className="w-full px-3.5 py-2.5 bg-white border border-brand-border rounded-xl text-sm font-mono-numbers text-brand-dark font-semibold focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
            />
          </div>
          {formattedAmountDisplay && (
            <span className="text-xs font-bold text-brand-green mt-1 block">
              {formattedAmountDisplay}
            </span>
          )}
        </div>
      </div>

      {/* Account Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Source Account (EXPENSE / TRANSFER) */}
        {(type === 'EXPENSE' || type === 'TRANSFER') && (
          <div>
            <label className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
              Akun Sumber (Asal Dana) <span className="text-brand-maroon">*</span>
            </label>
            <select
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-brand-border rounded-xl text-sm text-brand-dark focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
            >
              <option value="">-- Pilih Akun Sumber --</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} — {acc.name} (Saldo: {formatRupiah(accountBalances[acc.id] || 0)})
                </option>
              ))}
            </select>
            {sourceAccountId && (
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-brand-muted">Saldo Tersedia:</span>
                <span className={`font-bold font-mono-numbers ${isInsufficient ? 'text-brand-maroon' : 'text-brand-dark'}`}>
                  {formatRupiah(sourceBalance)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Destination Account (INCOME / TRANSFER) */}
        {(type === 'INCOME' || type === 'TRANSFER') && (
          <div>
            <label className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
              Akun Tujuan (Penerima Dana) <span className="text-brand-maroon">*</span>
            </label>
            <select
              value={destinationAccountId}
              onChange={(e) => setDestinationAccountId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-brand-border rounded-xl text-sm text-brand-dark focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
            >
              <option value="">-- Pilih Akun Tujuan --</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} — {acc.name} (Saldo: {formatRupiah(accountBalances[acc.id] || 0)})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category (INCOME / EXPENSE) */}
        {type !== 'TRANSFER' && (
          <div>
            <label className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
              Kategori {type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'} <span className="text-brand-maroon">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-brand-border rounded-xl text-sm text-brand-dark focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
            >
              <option value="">-- Pilih Kategori --</option>
              {activeCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.code} — {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Description & Notes */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
            Keterangan Transaksi <span className="text-brand-maroon">*</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Infaq operasional dari Bapak H. Ahmad / Pembelian beras 50kg"
            required
            className="w-full px-3.5 py-2.5 bg-white border border-brand-border rounded-xl text-sm text-brand-dark focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Informasi pelengkap atau nomor referensi kwitansi..."
            className="w-full px-3.5 py-2.5 bg-white border border-brand-border rounded-xl text-sm text-brand-dark focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
          />
        </div>
      </div>

      {/* Evidence Upload (Required for new transactions) */}
      {!isEdit && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-brand-dark uppercase tracking-wider">
              Unggah Bukti Transaksi <span className="text-brand-maroon">* (Wajib)</span>
            </label>
            <span className="text-[11px] text-brand-muted">Maksimal 10 MB per file</span>
          </div>

          {/* Action Cards: File Upload & Camera Capture */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. File Upload Card */}
            <div className="border-2 border-dashed border-brand-border hover:border-brand-gold rounded-2xl p-5 text-center bg-brand-warm-50/60 hover:bg-brand-warm-50 transition-all">
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-brand-gold-light text-brand-gold flex items-center justify-center mb-2 shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-brand-dark">
                  Pilih File Dokumen
                </span>
                <span className="text-xs text-brand-muted mt-0.5">
                  Format JPG, JPEG, PNG, PDF
                </span>
              </label>
            </div>

            {/* 2. Live Camera Capture Card */}
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="border-2 border-dashed border-brand-border hover:border-brand-teal rounded-2xl p-5 text-center bg-brand-teal-light/20 hover:bg-brand-teal-light/40 transition-all flex flex-col items-center justify-center cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-full bg-brand-teal-light text-brand-teal flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-brand-dark">
                Ambil Foto Kamera
              </span>
              <span className="text-xs text-brand-muted mt-0.5">
                Jepret langsung struk / nota fisik
              </span>
            </button>
          </div>

          {/* Selected File Previews */}
          {filePreviews.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-brand-dark">
                <span>Bukti Terpilih ({filePreviews.length} file):</span>
                <span className="text-[11px] text-brand-green font-bold">✓ Siap disimpan</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filePreviews.map((f, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between gap-2.5 p-2.5 bg-white rounded-xl border border-brand-border text-xs shadow-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {f.isImage ? (
                        <img 
                          src={f.url} 
                          alt={f.name} 
                          className="w-10 h-10 object-cover rounded-lg border border-brand-border shrink-0" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-brand-maroon-light text-brand-maroon flex items-center justify-center shrink-0 border border-brand-maroon-border">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-brand-dark truncate">{f.name}</p>
                        <p className="text-[11px] text-brand-muted">{f.size}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      title="Hapus file ini"
                      className="p-1.5 text-brand-muted hover:text-brand-maroon hover:bg-brand-maroon-light rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Camera Capture Modal */}
          <CameraCaptureModal
            isOpen={isCameraOpen}
            onClose={() => setIsCameraOpen(false)}
            onCapture={handleCameraCapture}
          />
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-4 py-2.5 text-sm font-semibold text-brand-muted hover:text-brand-dark hover:bg-brand-warm rounded-xl transition-colors cursor-pointer"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting || (isInsufficient && (type === 'EXPENSE' || type === 'TRANSFER'))}
          className="px-6 py-2.5 bg-brand-gold hover:bg-brand-gold-hover text-white text-sm font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
        >
          {isSubmitting ? (
            <span>Menyimpan Transaksi...</span>
          ) : (
            <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Transaksi'}</span>
          )}
        </button>
      </div>
    </form>
  );
}
