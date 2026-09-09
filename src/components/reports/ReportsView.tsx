'use client';

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  Info
} from 'lucide-react';
import { MonthlyReportSummary, YearlyReportSummary } from '@/types/finance';
import { formatRupiah } from '@/lib/finance-math';

interface ReportsViewProps {
  initialTab?: 'monthly' | 'yearly';
  initialPeriod: string; // "2026-08"
  initialYear: number; // 2026
  monthlyReport: MonthlyReportSummary;
  yearlyReport: YearlyReportSummary;
}

export function ReportsView({
  initialTab = 'monthly',
  initialPeriod,
  initialYear,
  monthlyReport,
  yearlyReport,
}: ReportsViewProps) {
  const [tab, setTab] = useState<'monthly' | 'yearly'>(initialTab);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialPeriod);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);

  const months = [
    { key: '2026-08', label: 'Agustus 2026' },
    { key: '2026-09', label: 'September 2026' },
    { key: '2026-10', label: 'Oktober 2026' },
    { key: '2026-11', label: 'November 2026' },
    { key: '2026-12', label: 'Desember 2026' },
    { key: '2027-01', label: 'Januari 2027' },
  ];

  const years = [2026, 2027, 2028];

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark tracking-tight">Rekap & Laporan Keuangan</h1>
          <p className="text-xs text-brand-muted mt-1">
            Laporan pertanggungjawaban arus kas bulanan dan tahunan
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-brand-warm p-1 rounded-xl border border-brand-border">
          <button
            onClick={() => setTab('monthly')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'monthly'
                ? 'bg-brand-gold text-white shadow-xs'
                : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            Laporan Bulanan
          </button>
          <button
            onClick={() => setTab('yearly')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'yearly'
                ? 'bg-brand-gold text-white shadow-xs'
                : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            Laporan Tahunan
          </button>
        </div>
      </div>

      {/* Period Selector & Export Actions */}
      <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {tab === 'monthly' ? (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-teal" />
              <span className="text-xs font-bold text-brand-dark">Pilih Periode:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  window.location.href = `/reports?tab=monthly&period=${e.target.value}`;
                }}
                className="px-3 py-1.5 bg-brand-warm-50 border border-brand-border rounded-xl text-xs font-semibold text-brand-dark focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
              >
                {months.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-teal" />
              <span className="text-xs font-bold text-brand-dark">Pilih Tahun Buku:</span>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value, 10));
                  window.location.href = `/reports?tab=yearly&year=${e.target.value}`;
                }}
                className="px-3 py-1.5 bg-brand-warm-50 border border-brand-border rounded-xl text-xs font-semibold text-brand-dark focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    Tahun {y}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          {tab === 'monthly' ? (
            <>
              <a
                href={`/api/export/excel?type=monthly&period=${selectedPeriod}`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-brand-border hover:bg-brand-warm text-brand-dark text-xs font-semibold rounded-xl transition-colors shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-brand-teal" />
                <span>Export Excel</span>
              </a>
              <a
                href={`/api/export/pdf?type=monthly&period=${selectedPeriod}`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-brand-border hover:bg-brand-warm text-brand-dark text-xs font-semibold rounded-xl transition-colors shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-brand-maroon" />
                <span>Export PDF</span>
              </a>
            </>
          ) : (
            <>
              <a
                href={`/api/export/excel?type=yearly&year=${selectedYear}`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-brand-border hover:bg-brand-warm text-brand-dark text-xs font-semibold rounded-xl transition-colors shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-brand-teal" />
                <span>Export Excel</span>
              </a>
              <a
                href={`/api/export/pdf?type=yearly&year=${selectedYear}`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-brand-border hover:bg-brand-warm text-brand-dark text-xs font-semibold rounded-xl transition-colors shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-brand-maroon" />
                <span>Export PDF</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* MONTHLY REPORT VIEW */}
      {tab === 'monthly' && (
        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Opening */}
            <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-xs">
              <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider block mb-1">
                Saldo Awal Periode
              </span>
              <div className="text-base sm:text-lg font-bold text-brand-dark font-mono-numbers">
                {formatRupiah(monthlyReport.opening_balance)}
              </div>
            </div>

            {/* Total Income */}
            <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-xs">
              <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider block mb-1">
                Total Pemasukan
              </span>
              <div className="text-base sm:text-lg font-bold text-brand-green font-mono-numbers">
                +{formatRupiah(monthlyReport.total_income)}
              </div>
            </div>

            {/* Total Expense */}
            <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-xs">
              <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider block mb-1">
                Total Pengeluaran
              </span>
              <div className="text-base sm:text-lg font-bold text-brand-maroon font-mono-numbers">
                -{formatRupiah(monthlyReport.total_expense)}
              </div>
            </div>

            {/* Net Surplus/Deficit */}
            <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-xs">
              <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider block mb-1">
                Surplus / (Defisit)
              </span>
              <div className={`text-base sm:text-lg font-bold font-mono-numbers ${
                monthlyReport.surplus_deficit >= 0 ? 'text-brand-green' : 'text-brand-maroon'
              }`}>
                {formatRupiah(monthlyReport.surplus_deficit, { showSign: true })}
              </div>
            </div>

            {/* Closing */}
            <div className="col-span-2 sm:col-span-1 bg-brand-gold-light/60 p-4 rounded-2xl border border-brand-gold/40 shadow-xs">
              <span className="text-[11px] font-bold text-brand-dark uppercase tracking-wider block mb-1">
                Saldo Akhir Periode
              </span>
              <div className="text-base sm:text-lg font-extrabold text-brand-dark font-mono-numbers">
                {formatRupiah(monthlyReport.closing_balance)}
              </div>
            </div>
          </div>

          {/* Section A: Balances by Financial Account */}
          <div className="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-brand-border">
              <h2 className="text-sm font-bold text-brand-dark">A. Saldo per Akun Keuangan</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-warm/60 border-b border-brand-border text-brand-muted uppercase font-semibold">
                    <th className="py-3 px-4">Kode</th>
                    <th className="py-3 px-4">Nama Akun</th>
                    <th className="py-3 px-4 text-right">Saldo Awal</th>
                    <th className="py-3 px-4 text-right text-brand-green">Pemasukan</th>
                    <th className="py-3 px-4 text-right text-brand-maroon">Pengeluaran</th>
                    <th className="py-3 px-4 text-right text-brand-teal">Transfer Masuk</th>
                    <th className="py-3 px-4 text-right text-brand-teal">Transfer Keluar</th>
                    <th className="py-3 px-4 text-right font-bold text-brand-dark">Saldo Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {monthlyReport.account_breakdown.map((acc) => (
                    <tr key={acc.account_id} className="hover:bg-brand-warm/40">
                      <td className="py-3 px-4 font-semibold text-brand-dark">{acc.account_code}</td>
                      <td className="py-3 px-4 font-medium text-brand-dark">{acc.account_name}</td>
                      <td className="py-3 px-4 text-right font-mono-numbers">{formatRupiah(acc.opening_balance)}</td>
                      <td className="py-3 px-4 text-right font-mono-numbers text-brand-green">
                        {acc.income > 0 ? `+${formatRupiah(acc.income)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-numbers text-brand-maroon">
                        {acc.expense > 0 ? `-${formatRupiah(acc.expense)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-numbers text-brand-teal">
                        {acc.transfer_in > 0 ? `+${formatRupiah(acc.transfer_in)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-numbers text-brand-teal">
                        {acc.transfer_out > 0 ? `-${formatRupiah(acc.transfer_out)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono-numbers text-brand-dark">
                        {formatRupiah(acc.closing_balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B & C: Income and Expense by Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income by Category */}
            <div className="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-brand-border bg-brand-green-light/40 flex items-center justify-between">
                <h2 className="text-sm font-bold text-brand-green">B. Pemasukan per Kategori</h2>
                <span className="text-xs font-bold text-brand-green font-mono-numbers">
                  {formatRupiah(monthlyReport.total_income)}
                </span>
              </div>
              <div className="divide-y divide-brand-border/50 max-h-96 overflow-y-auto">
                {monthlyReport.income_by_category.filter((c) => c.total > 0).length === 0 ? (
                  <div className="p-6 text-center text-xs text-brand-muted">
                    Tidak ada pemasukan pada periode ini
                  </div>
                ) : (
                  monthlyReport.income_by_category
                    .filter((c) => c.total > 0)
                    .map((c) => (
                      <div key={c.category_id} className="p-3.5 flex items-center justify-between text-xs hover:bg-brand-warm/40">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-brand-green-light text-brand-green font-bold text-[10px] border border-brand-green/20">
                            {c.category_code}
                          </span>
                          <span className="font-medium text-brand-dark">{c.category_name}</span>
                        </div>
                        <span className="font-bold text-brand-green font-mono-numbers">
                          {formatRupiah(c.total)}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Expense by Category */}
            <div className="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-brand-border bg-brand-maroon-light/40 flex items-center justify-between">
                <h2 className="text-sm font-bold text-brand-maroon">C. Pengeluaran per Kategori</h2>
                <span className="text-xs font-bold text-brand-maroon font-mono-numbers">
                  {formatRupiah(monthlyReport.total_expense)}
                </span>
              </div>
              <div className="divide-y divide-brand-border/50 max-h-96 overflow-y-auto">
                {monthlyReport.expense_by_category.filter((c) => c.total > 0).length === 0 ? (
                  <div className="p-6 text-center text-xs text-brand-muted">
                    Tidak ada pengeluaran pada periode ini
                  </div>
                ) : (
                  monthlyReport.expense_by_category
                    .filter((c) => c.total > 0)
                    .map((c) => (
                      <div key={c.category_id} className="p-3.5 flex items-center justify-between text-xs hover:bg-brand-warm/40">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-brand-maroon-light text-brand-maroon font-bold text-[10px] border border-brand-maroon/20">
                            {c.category_code}
                          </span>
                          <span className="font-medium text-brand-dark">{c.category_name}</span>
                        </div>
                        <span className="font-bold text-brand-maroon font-mono-numbers">
                          {formatRupiah(c.total)}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* YEARLY REPORT VIEW */}
      {tab === 'yearly' && (
        <div className="space-y-6">
          {/* Legacy Period Notice for 2026 (Section 19) */}
          {yearlyReport.year === 2026 && (
            <div className="p-4 bg-brand-teal-light/60 border border-brand-teal/30 rounded-2xl flex items-start gap-3">
              <Info className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
              <div className="text-xs text-brand-dark">
                <p className="font-bold">Ketentuan Cut-off Periode 2026:</p>
                <p className="mt-0.5">
                  Saldo awal tahun berasal dari saldo cut-off per <strong>31 Juli 2026</strong> sebesar{' '}
                  <strong>{formatRupiah(yearlyReport.opening_balance)}</strong>. Transaksi individual Januari–Juli 2026 tidak diimpor satu per satu. Pencatatan transaksi operasional aktif dimulai per <strong>1 Agustus 2026</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Yearly Executive Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-xs">
              <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider block mb-1">
                Saldo Awal Tahun
              </span>
              <div className="text-base sm:text-lg font-bold text-brand-dark font-mono-numbers">
                {formatRupiah(yearlyReport.opening_balance)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-xs">
              <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider block mb-1">
                Total Pemasukan (Tahun Ini)
              </span>
              <div className="text-base sm:text-lg font-bold text-brand-green font-mono-numbers">
                +{formatRupiah(yearlyReport.total_income)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-xs">
              <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider block mb-1">
                Total Pengeluaran (Tahun Ini)
              </span>
              <div className="text-base sm:text-lg font-bold text-brand-maroon font-mono-numbers">
                -{formatRupiah(yearlyReport.total_expense)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-xs">
              <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider block mb-1">
                Net Surplus / (Defisit)
              </span>
              <div className={`text-base sm:text-lg font-bold font-mono-numbers ${
                yearlyReport.net_surplus_deficit >= 0 ? 'text-brand-green' : 'text-brand-maroon'
              }`}>
                {formatRupiah(yearlyReport.net_surplus_deficit, { showSign: true })}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-brand-gold-light/60 p-4 rounded-2xl border border-brand-gold/40 shadow-xs">
              <span className="text-[11px] font-bold text-brand-dark uppercase tracking-wider block mb-1">
                Saldo Akhir Tahun
              </span>
              <div className="text-base sm:text-lg font-extrabold text-brand-dark font-mono-numbers">
                {formatRupiah(yearlyReport.closing_balance)}
              </div>
            </div>
          </div>

          {/* Yearly Breakdown Table */}
          <div className="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-brand-border">
              <h2 className="text-sm font-bold text-brand-dark">
                Rekapitulasi Arus Kas Bulanan Tahun {yearlyReport.year}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-warm/60 border-b border-brand-border text-brand-muted uppercase font-semibold">
                    <th className="py-3 px-4">Periode</th>
                    <th className="py-3 px-4 text-right">Saldo Awal</th>
                    <th className="py-3 px-4 text-right text-brand-green">Pemasukan</th>
                    <th className="py-3 px-4 text-right text-brand-maroon">Pengeluaran</th>
                    <th className="py-3 px-4 text-right">Net</th>
                    <th className="py-3 px-4 text-right font-bold text-brand-dark">Saldo Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {yearlyReport.rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={row.is_legacy ? 'bg-brand-gold-light/30 hover:bg-brand-gold-light/50' : 'hover:bg-brand-warm/40'}
                    >
                      <td className="py-3 px-4 font-semibold text-brand-dark">
                        {row.period}
                        {row.is_legacy && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-brand-gold-light text-brand-dark rounded border border-brand-gold/30">
                            Cut-Off Saldo Awal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-numbers">
                        {formatRupiah(row.opening_balance)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-numbers text-brand-green">
                        {row.is_legacy ? '-' : formatRupiah(row.income)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-numbers text-brand-maroon">
                        {row.is_legacy ? '-' : formatRupiah(row.expense)}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono-numbers ${
                        row.net >= 0 ? 'text-brand-green' : 'text-brand-maroon'
                      }`}>
                        {row.is_legacy ? '-' : formatRupiah(row.net, { showSign: true })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono-numbers text-brand-dark">
                        {formatRupiah(row.closing_balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
