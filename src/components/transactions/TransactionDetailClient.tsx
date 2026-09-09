'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Paperclip, 
  Upload, 
  ExternalLink, 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowRightLeft, 
  AlertTriangle,
  X,
  FileText,
  Clock,
  Camera
} from 'lucide-react';
import { Account, Category, Transaction } from '@/types/finance';
import { formatRupiah } from '@/lib/finance-math';
import { formatDateIndonesian } from '@/lib/date-utils';
import { TransactionForm } from './TransactionForm';
import { deleteTransactionAction, addAttachmentAction, deleteAttachmentAction } from '@/app/actions/transactions';
import { CameraCaptureModal } from '@/components/common/CameraCaptureModal';

interface TransactionDetailClientProps {
  transaction: Transaction;
  accounts: Account[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  accountBalances: Record<string, number>;
}

export function TransactionDetailClient({
  transaction,
  accounts,
  incomeCategories,
  expenseCategories,
  accountBalances,
}: TransactionDetailClientProps) {
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Handle transaction delete
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteTransactionAction(transaction.id);
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  // Handle new attachment upload from camera
  const handleCameraCapture = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await addAttachmentAction(transaction.id, null, formData);
    if (res?.error) {
      setUploadError(res.error);
      setIsUploading(false);
    } else {
      setIsUploading(false);
      setShowAddEvidenceModal(false);
      router.refresh();
    }
  };

  // Handle new attachment upload
  const handleAddEvidence = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
      setUploadError('Pilih file bukti terlebih dahulu');
      return;
    }

    setIsUploading(true);
    const res = await addAttachmentAction(transaction.id, null, formData);
    if (res?.error) {
      setUploadError(res.error);
      setIsUploading(false);
    } else {
      setIsUploading(false);
      setShowAddEvidenceModal(false);
      router.refresh();
    }
  };

  // Handle delete single attachment
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Hapus file bukti ini?')) return;
    await deleteAttachmentAction(transaction.id, attachmentId);
    router.refresh();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Back Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/transactions"
            className="p-2 text-brand-muted hover:text-brand-dark hover:bg-brand-warm rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-brand-dark font-mono-numbers">
                {transaction.transaction_number}
              </h1>
              {transaction.type === 'INCOME' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-green-light text-brand-green border border-brand-green/20">
                  <ArrowDownRight className="w-3.5 h-3.5 text-brand-green" /> Pemasukan
                </span>
              )}
              {transaction.type === 'EXPENSE' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-maroon-light text-brand-maroon border border-brand-maroon/20">
                  <ArrowUpRight className="w-3.5 h-3.5 text-brand-maroon" /> Pengeluaran
                </span>
              )}
              {transaction.type === 'TRANSFER' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-teal-light text-brand-teal border border-brand-teal/20">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-brand-teal" /> Transfer
                </span>
              )}
            </div>
            <p className="text-xs text-brand-muted mt-0.5">
              {formatDateIndonesian(transaction.transaction_date, { withDay: true })}
            </p>
          </div>
        </div>

        {/* Action Menu: Pengaturan Transaksi */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-brand-border hover:bg-brand-warm text-brand-dark text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4 text-brand-muted" />
            <span>Pengaturan Transaksi</span>
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-brand-border py-2 z-30">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowEditModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-brand-dark hover:bg-brand-warm cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-brand-gold" />
                  <span>Edit Transaksi</span>
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowAddEvidenceModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-brand-dark hover:bg-brand-warm cursor-pointer"
                >
                  <Paperclip className="w-4 h-4 text-brand-teal" />
                  <span>Kelola / Tambah Bukti</span>
                </button>
                <div className="my-1.5 border-t border-brand-border/60" />
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowDeleteModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-brand-maroon hover:bg-brand-maroon-light cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-brand-maroon" />
                  <span>Hapus Transaksi</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
        {/* Nominal Banner */}
        <div className={`p-6 sm:p-8 border-b ${
          transaction.type === 'INCOME'
            ? 'bg-brand-green-light/40 border-brand-green/20'
            : transaction.type === 'EXPENSE'
            ? 'bg-brand-maroon-light/40 border-brand-maroon/20'
            : 'bg-brand-teal-light/40 border-brand-teal/20'
        }`}>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Nominal Transaksi
          </span>
          <div className={`text-3xl sm:text-4xl font-extrabold font-mono-numbers mt-1 ${
            transaction.type === 'INCOME'
              ? 'text-brand-green'
              : transaction.type === 'EXPENSE'
              ? 'text-brand-maroon'
              : 'text-brand-dark'
          }`}>
            {transaction.type === 'INCOME' && '+'}
            {transaction.type === 'EXPENSE' && '-'}
            {formatRupiah(transaction.amount)}
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block mb-1">
              Keterangan
            </span>
            <p className="text-brand-dark font-medium">{transaction.description}</p>
          </div>

          <div>
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block mb-1">
              {transaction.type === 'TRANSFER' ? 'Aliran Transfer' : 'Akun Keuangan'}
            </span>
            <p className="text-brand-dark font-medium">
              {transaction.type === 'INCOME' && (
                <span>Ke: {transaction.destination_account?.name || '-'}</span>
              )}
              {transaction.type === 'EXPENSE' && (
                <span>Dari: {transaction.source_account?.name || '-'}</span>
              )}
              {transaction.type === 'TRANSFER' && (
                <span>{transaction.source_account?.name} → {transaction.destination_account?.name}</span>
              )}
            </p>
          </div>

          {transaction.category && (
            <div>
              <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block mb-1">
                Kategori
              </span>
              <p className="text-brand-dark font-medium">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-brand-warm text-brand-dark border border-brand-border mr-2">
                  {transaction.category.code}
                </span>
                {transaction.category.name}
              </p>
            </div>
          )}

          <div>
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block mb-1">
              Catatan Tambahan
            </span>
            <p className="text-brand-muted">{transaction.note || '-'}</p>
          </div>
        </div>

        {/* Audit Meta */}
        <div className="px-6 py-4 bg-brand-warm-50 border-t border-brand-border/60 text-xs text-brand-muted flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-muted" />
            <span>Dibuat: {transaction.created_at || '-'}</span>
          </div>
          {transaction.updated_at && transaction.updated_at !== transaction.created_at && (
            <div>
              <span>Terakhir diubah: {transaction.updated_at}</span>
            </div>
          )}
        </div>
      </div>

      {/* Attachments Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-brand-border shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-brand-gold" />
            <h2 className="text-base font-bold text-brand-dark">
              Bukti Transaksi ({transaction.attachments?.length || 0})
            </h2>
          </div>
          <button
            onClick={() => setShowAddEvidenceModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-gold-light hover:bg-brand-gold/20 text-brand-dark text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-brand-gold/30"
          >
            <Upload className="w-3.5 h-3.5 text-brand-gold" />
            <span>Tambah Bukti</span>
          </button>
        </div>

        {(!transaction.attachments || transaction.attachments.length === 0) ? (
          <div className="p-8 text-center bg-brand-warm-50 rounded-2xl border border-dashed border-brand-border">
            <p className="text-xs text-brand-muted">Belum ada file bukti terlampir</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {transaction.attachments.map((att) => {
              const isPdf = att.mime_type === 'application/pdf' || att.file_name.endsWith('.pdf');
              return (
                <div
                  key={att.id}
                  className="bg-brand-warm-50 border border-brand-border rounded-2xl p-3.5 flex flex-col justify-between"
                >
                  <div>
                    {isPdf ? (
                      <div className="w-full h-32 bg-brand-maroon-light rounded-xl flex flex-col items-center justify-center text-brand-maroon mb-3 border border-brand-maroon-border">
                        <FileText className="w-10 h-10 mb-1" />
                        <span className="text-[11px] font-bold uppercase">Dokumen PDF</span>
                      </div>
                    ) : (
                      <a href={att.file_path} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl mb-3 border border-brand-border">
                        <img
                          src={att.file_path}
                          alt={att.file_name}
                          className="w-full h-32 object-cover hover:scale-105 transition-transform duration-200"
                        />
                      </a>
                    )}
                    <p className="font-semibold text-brand-dark text-xs truncate">{att.file_name}</p>
                    <p className="text-[11px] text-brand-muted mt-0.5">
                      {(att.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-brand-border">
                    <a
                      href={att.file_path}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-gold hover:text-brand-gold-hover"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Buka File</span>
                    </a>
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="text-[11px] text-brand-maroon hover:underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto border border-brand-border">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-6">
              <h2 className="text-lg font-bold text-brand-dark">
                Edit Transaksi {transaction.transaction_number}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-brand-muted hover:text-brand-dark rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <TransactionForm
              accounts={accounts}
              incomeCategories={incomeCategories}
              expenseCategories={expenseCategories}
              accountBalances={accountBalances}
              initialData={transaction}
              isEdit={true}
            />
          </div>
        </div>
      )}

      {/* Add Evidence Modal */}
      {showAddEvidenceModal && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-brand-border">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border mb-4">
              <h2 className="text-base font-bold text-brand-dark">Tambah Bukti Transaksi</h2>
              <button
                onClick={() => setShowAddEvidenceModal(false)}
                className="p-1 text-brand-muted hover:text-brand-dark rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 p-3 bg-brand-maroon-light text-brand-maroon text-xs rounded-xl border border-brand-maroon-border">
                {uploadError}
              </div>
            )}

            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddEvidenceModal(false);
                  setIsCameraOpen(true);
                }}
                className="w-full py-2.5 px-4 bg-brand-teal-light/40 hover:bg-brand-teal-light/70 border border-brand-teal text-brand-teal rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Ambil Foto via Kamera</span>
              </button>
              
              <div className="relative my-3.5 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-brand-border" />
                </div>
                <span className="relative bg-white px-2 text-[11px] text-brand-muted uppercase tracking-wider">
                  atau unggah file
                </span>
              </div>
            </div>

            <form onSubmit={handleAddEvidence} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1.5">
                  Pilih File Bukti (JPG, JPEG, PNG, PDF)
                </label>
                <input
                  type="file"
                  name="file"
                  required
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="w-full text-xs text-brand-muted file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-gold-light file:text-brand-dark hover:file:bg-brand-gold/20 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowAddEvidenceModal(false)}
                  disabled={isUploading}
                  className="px-3.5 py-2 text-xs font-semibold text-brand-muted hover:bg-brand-warm rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-brand-gold hover:bg-brand-gold-hover text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? 'Mengunggah...' : 'Unggah Bukti'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Capture Modal for adding evidence to existing transaction */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-brand-border">
            <div className="w-12 h-12 rounded-full bg-brand-maroon-light text-brand-maroon flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-base font-bold text-brand-dark">
              Hapus transaksi {transaction.transaction_number}?
            </h2>
            <p className="text-xs text-brand-muted mt-1">
              Tindakan ini akan menghapus transaksi dan seluruh bukti terlampir secara permanen serta memperbarui seluruh saldo keuangan terkait.
            </p>

            <div className="my-4 p-3.5 bg-brand-warm rounded-xl border border-brand-border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-brand-muted">No. Transaksi:</span>
                <span className="font-semibold text-brand-dark">{transaction.transaction_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Keterangan:</span>
                <span className="font-semibold text-brand-dark truncate max-w-[200px]">{transaction.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Nominal:</span>
                <span className="font-bold font-mono-numbers text-brand-dark">{formatRupiah(transaction.amount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-brand-muted hover:bg-brand-warm rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-brand-maroon hover:bg-brand-maroon-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Transaksi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
