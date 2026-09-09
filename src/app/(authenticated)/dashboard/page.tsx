import React from 'react';
import Link from 'next/link';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRightLeft, 
  Plus, 
  ArrowRight,
  Landmark,
  Banknote,
  Receipt,
  FileCheck,
  Calendar
} from 'lucide-react';
import { financeDb } from '@/lib/db';
import { calculateAccountBalances, generateMonthlyReport, formatRupiah } from '@/lib/finance-math';
import { getCurrentYearMonthJakarta, formatDateIndonesian, formatMonthYearIndonesian } from '@/lib/date-utils';

export default async function DashboardPage() {
  const currentMonth = getCurrentYearMonthJakarta(); // e.g. "2026-08"

  const accounts = await financeDb.getAccounts(true);
  const categories = await financeDb.getCategories(undefined, true);
  const allTrx = await financeDb.getAllTransactionsRaw();

  // Balance calculation
  const balanceSummary = calculateAccountBalances(accounts, allTrx);
  const monthlyReport = generateMonthlyReport(accounts, categories, allTrx, currentMonth);

  // Latest 10 transactions
  const recentTransactions = (await financeDb.getTransactions()).slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark tracking-tight">Dashboard Keuangan</h1>
          <p className="text-sm text-brand-muted mt-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brand-muted" />
            <span>Periode Aktif: {formatMonthYearIndonesian(currentMonth)}</span>
          </p>
        </div>
        <div>
          <Link
            href="/transactions/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-gold hover:bg-brand-gold-hover text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Transaksi</span>
          </Link>
        </div>
      </div>

      {/* Section A: Total Balance Card */}
      <div className="bg-brand-dark text-white rounded-2xl p-6 sm:p-8 shadow-sm border-2 border-brand-gold/30 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-brand-gold text-xs font-semibold uppercase tracking-wider mb-2">
            <Wallet className="w-4 h-4 text-brand-gold" />
            <span>Total Saldo Keuangan Pesantren</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono-numbers tracking-tight">
            {formatRupiah(balanceSummary.totalBalance)}
          </div>
          <p className="text-xs text-white/70 mt-2">
            Akumulasi dari seluruh rekening bank dan kas tunai operasional pesantren.
          </p>
        </div>
      </div>

      {/* Section B: Financial Accounts (AK01, AK02, AK03) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-brand-dark">Rincian Akun Keuangan</h2>
          <Link href="/settings" className="text-xs text-brand-teal hover:text-brand-teal-hover font-semibold">
            Kelola Akun →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {balanceSummary.accountSummaries.map((item) => {
            const isBank = item.account.code === 'AK01';
            return (
              <div
                key={item.account.id}
                className="bg-white rounded-2xl p-5 border border-brand-border shadow-xs hover:border-brand-gold/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-brand-warm text-brand-dark border border-brand-border">
                      {item.account.code}
                    </span>
                    <div className={`p-2 rounded-xl ${isBank ? 'bg-brand-teal-light text-brand-teal' : 'bg-brand-gold-light text-brand-gold'}`}>
                      {isBank ? <Landmark className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                    </div>
                  </div>
                  <h3 className="font-semibold text-brand-dark text-sm">{item.account.name}</h3>
                </div>
                <div className="mt-4 pt-3 border-t border-brand-border/60">
                  <div className="text-xs text-brand-muted font-medium">Saldo Saat Ini</div>
                  <div className="text-lg font-bold text-brand-dark font-mono-numbers mt-0.5">
                    {formatRupiah(item.current_balance)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section C: Current Month Activity */}
      <div>
        <h2 className="text-base font-bold text-brand-dark mb-4">
          Aktivitas Bulan {formatMonthYearIndonesian(currentMonth)}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Income */}
          <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-brand-muted">Pemasukan (Bulan Ini)</span>
              <div className="p-2 rounded-xl bg-brand-green-light text-brand-green">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-brand-green font-mono-numbers">
              +{formatRupiah(monthlyReport.total_income, { withPrefix: true })}
            </div>
            <p className="text-[11px] text-brand-muted mt-1">Transfers internal tidak dihitung</p>
          </div>

          {/* Expense */}
          <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-brand-muted">Pengeluaran (Bulan Ini)</span>
              <div className="p-2 rounded-xl bg-brand-maroon-light text-brand-maroon">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-brand-maroon font-mono-numbers">
              -{formatRupiah(monthlyReport.total_expense, { withPrefix: true })}
            </div>
            <p className="text-[11px] text-brand-muted mt-1">Sesuai nota & bukti pengeluaran</p>
          </div>

          {/* Surplus / Deficit */}
          <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-brand-muted">Surplus / (Defisit)</span>
              <div className="p-2 rounded-xl bg-brand-teal-light text-brand-teal">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-xl font-bold font-mono-numbers ${
              monthlyReport.surplus_deficit >= 0 ? 'text-brand-green' : 'text-brand-maroon'
            }`}>
              {formatRupiah(monthlyReport.surplus_deficit, { showSign: true })}
            </div>
            <p className="text-[11px] text-brand-muted mt-1">Pemasukan dikurangi pengeluaran</p>
          </div>
        </div>
      </div>

      {/* Section D: Recent Transactions */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-brand-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-brand-dark">Transaksi Terakhir</h2>
            <p className="text-xs text-brand-muted mt-0.5">10 transaksi operasional terbaru</p>
          </div>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gold hover:text-brand-gold-hover"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-warm text-brand-muted flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-brand-dark">Belum ada transaksi operasional</p>
            <p className="text-xs text-brand-muted mt-1">
              Mulai input transaksi baru menggunakan tombol di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-brand-warm/60 border-b border-brand-border text-brand-muted text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">No. Transaksi</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4">Akun / Aliran</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {recentTransactions.map((trx) => {
                  let flow = '-';
                  if (trx.type === 'INCOME') flow = trx.destination_account?.name || '-';
                  else if (trx.type === 'EXPENSE') flow = trx.source_account?.name || '-';
                  else if (trx.type === 'TRANSFER') flow = `${trx.source_account?.name || '-'} → ${trx.destination_account?.name || '-'}`;

                  return (
                    <tr key={trx.id} className="hover:bg-brand-warm/40 transition-colors">
                      <td className="py-3 px-4 text-brand-muted whitespace-nowrap text-xs">
                        {formatDateIndonesian(trx.transaction_date)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-brand-dark whitespace-nowrap">
                        <Link href={`/transactions/${trx.id}`} className="hover:text-brand-gold">
                          {trx.transaction_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
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
                      </td>
                      <td className="py-3 px-4 text-brand-dark max-w-xs truncate">
                        {trx.description}
                      </td>
                      <td className="py-3 px-4 text-brand-muted text-xs whitespace-nowrap">
                        {flow}
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold font-mono-numbers whitespace-nowrap ${
                        trx.type === 'INCOME'
                          ? 'text-brand-green'
                          : trx.type === 'EXPENSE'
                          ? 'text-brand-maroon'
                          : 'text-brand-dark'
                      }`}>
                        {trx.type === 'INCOME' && '+'}
                        {trx.type === 'EXPENSE' && '-'}
                        {formatRupiah(trx.amount)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {trx.attachments && trx.attachments.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-green bg-brand-green-light px-2 py-0.5 rounded border border-brand-green/20">
                            <FileCheck className="w-3 h-3" />
                            <span>{trx.attachments.length}</span>
                          </span>
                        ) : (
                          <span className="text-brand-muted text-xs">-</span>
                        )}
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
