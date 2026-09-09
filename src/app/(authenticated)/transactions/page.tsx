import React from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowRightLeft, 
  FileCheck, 
  FileSpreadsheet, 
  Receipt
} from 'lucide-react';
import { financeDb } from '@/lib/db';
import { formatRupiah } from '@/lib/finance-math';
import { formatDateIndonesian } from '@/lib/date-utils';

interface TransactionsPageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    type?: string;
    accountId?: string;
    categoryId?: string;
    search?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const params = await searchParams;
  const { startDate, endDate, type, accountId, categoryId, search } = params;

  const accounts = await financeDb.getAccounts(true);
  
  const transactions = await financeDb.getTransactions({
    startDate,
    endDate,
    type,
    accountId,
    categoryId,
    search,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark tracking-tight">Transaksi Keuangan</h1>
          <p className="text-xs text-brand-muted mt-1">
            Total {transactions.length} transaksi ditemukan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/export/excel?type=transactions"
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-brand-border hover:bg-brand-warm-50 text-brand-dark text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-brand-teal" />
            <span>Ekspor Excel</span>
          </a>

          <Link
            href="/transactions/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-gold hover:bg-brand-gold-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Transaksi</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-xs">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              name="search"
              defaultValue={search || ''}
              placeholder="Cari no. transaksi / keterangan..."
              className="w-full pl-9 pr-3 py-2 bg-brand-warm-50 border border-brand-border rounded-xl text-xs text-brand-dark focus:bg-white focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
            />
            <Search className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
          </div>

          {/* Type Filter */}
          <div>
            <select
              name="type"
              defaultValue={type || 'ALL'}
              className="w-full px-3 py-2 bg-brand-warm-50 border border-brand-border rounded-xl text-xs text-brand-dark focus:bg-white focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
            >
              <option value="ALL">Semua Tipe Transaksi</option>
              <option value="INCOME">Pemasukan (Masuk)</option>
              <option value="EXPENSE">Pengeluaran (Keluar)</option>
              <option value="TRANSFER">Transfer Internal</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <select
              name="accountId"
              defaultValue={accountId || 'ALL'}
              className="w-full px-3 py-2 bg-brand-warm-50 border border-brand-border rounded-xl text-xs text-brand-dark focus:bg-white focus:ring-2 focus:ring-brand-gold focus:outline-hidden"
            >
              <option value="ALL">Semua Akun Keuangan</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-brand-dark hover:bg-black text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Terapkan Filter</span>
            </button>

            {(startDate || endDate || (type && type !== 'ALL') || (accountId && accountId !== 'ALL') || (categoryId && categoryId !== 'ALL') || search) && (
              <Link
                href="/transactions"
                className="py-2 px-3 bg-brand-warm hover:bg-brand-warm-200 text-brand-muted font-semibold rounded-xl text-xs transition-colors"
              >
                Reset
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
        {transactions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-warm text-brand-muted flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-brand-dark">Belum ada transaksi pada periode ini.</p>
            <p className="text-xs text-brand-muted mt-1">
              Sesuaikan filter pencarian atau buat transaksi baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-brand-warm/60 border-b border-brand-border text-brand-muted text-xs uppercase font-semibold">
                  <th className="py-3.5 px-4 whitespace-nowrap">Tanggal</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">No. Transaksi</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Tipe</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Akun / Aliran</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Kategori</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Nominal</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {transactions.map((trx) => {
                  let flow = '-';
                  if (trx.type === 'INCOME') flow = trx.destination_account?.name || '-';
                  else if (trx.type === 'EXPENSE') flow = trx.source_account?.name || '-';
                  else if (trx.type === 'TRANSFER') flow = `${trx.source_account?.name || '-'} → ${trx.destination_account?.name || '-'}`;

                  return (
                    <tr 
                      key={trx.id} 
                      className="hover:bg-brand-warm/40 transition-colors group cursor-pointer"
                    >
                      <td className="py-3 px-4 text-brand-muted whitespace-nowrap text-xs">
                        <Link href={`/transactions/${trx.id}`} className="block">
                          {formatDateIndonesian(trx.transaction_date)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-semibold text-brand-dark whitespace-nowrap">
                        <Link href={`/transactions/${trx.id}`} className="block group-hover:text-brand-gold">
                          {trx.transaction_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Link href={`/transactions/${trx.id}`} className="block">
                          {trx.type === 'INCOME' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-green-light text-brand-green border border-brand-green/20">
                              <ArrowDownRight className="w-3 h-3 text-brand-green" /> Masuk
                            </span>
                          )}
                          {trx.type === 'EXPENSE' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-maroon-light text-brand-maroon border border-brand-maroon/20">
                              <ArrowUpRight className="w-3 h-3 text-brand-maroon" /> Keluar
                            </span>
                          )}
                          {trx.type === 'TRANSFER' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-teal-light text-brand-teal border border-brand-teal/20">
                              <ArrowRightLeft className="w-3 h-3 text-brand-teal" /> Transfer
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-brand-dark max-w-xs truncate">
                        <Link href={`/transactions/${trx.id}`} className="block">
                          {trx.description}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-brand-muted text-xs whitespace-nowrap">
                        <Link href={`/transactions/${trx.id}`} className="block">
                          {flow}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-brand-muted text-xs whitespace-nowrap">
                        <Link href={`/transactions/${trx.id}`} className="block">
                          {trx.category?.name || '-'}
                        </Link>
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold font-mono-numbers whitespace-nowrap ${
                        trx.type === 'INCOME'
                          ? 'text-brand-green'
                          : trx.type === 'EXPENSE'
                          ? 'text-brand-maroon'
                          : 'text-brand-dark'
                      }`}>
                        <Link href={`/transactions/${trx.id}`} className="block">
                          {trx.type === 'INCOME' && '+'}
                          {trx.type === 'EXPENSE' && '-'}
                          {formatRupiah(trx.amount)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Link href={`/transactions/${trx.id}`} className="block">
                          {trx.attachments && trx.attachments.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-green bg-brand-green-light px-2 py-0.5 rounded border border-brand-green/20">
                              <FileCheck className="w-3 h-3" />
                              <span>{trx.attachments.length}</span>
                            </span>
                          ) : (
                            <span className="text-brand-muted text-xs">-</span>
                          )}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
