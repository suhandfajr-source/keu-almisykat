import * as XLSX from 'xlsx';
import { MonthlyReportSummary, YearlyReportSummary, Transaction } from '@/types/finance';
import { formatMonthYearIndonesian } from '@/lib/date-utils';

export function exportMonthlyReportToExcel(report: MonthlyReportSummary) {
  const wb = XLSX.utils.book_new();

  // 1. Ringkasan
  const summaryData = [
    ['LAPORAN KEUANGAN BULANAN'],
    ['Pondok Pesantren Al-Misykat Al-Islami'],
    ['Periode:', formatMonthYearIndonesian(report.period)],
    [],
    ['RINGKASAN EKSEKUTIF'],
    ['Komponen', 'Nominal (Rp)'],
    ['Saldo Awal Periode', report.opening_balance],
    ['Total Pemasukan', report.total_income],
    ['Total Pengeluaran', report.total_expense],
    ['Surplus / (Defisit)', report.surplus_deficit],
    ['Saldo Akhir Periode', report.closing_balance],
    [],
    ['RINCIAN PER AKUN KEUANGAN'],
    ['Kode', 'Nama Akun', 'Saldo Awal', 'Pemasukan', 'Pengeluaran', 'Transfer Masuk', 'Transfer Keluar', 'Saldo Akhir'],
    ...report.account_breakdown.map((a) => [
      a.account_code,
      a.account_name,
      a.opening_balance,
      a.income,
      a.expense,
      a.transfer_in,
      a.transfer_out,
      a.closing_balance,
    ]),
    [],
    ['RINCIAN PEMASUKAN PER KATEGORI'],
    ['Kode', 'Kategori Pemasukan', 'Total (Rp)'],
    ...report.income_by_category.map((c) => [c.category_code, c.category_name, c.total]),
    [],
    ['RINCIAN PENGELUARAN PER KATEGORI'],
    ['Kode', 'Kategori Pengeluaran', 'Total (Rp)'],
    ...report.expense_by_category.map((c) => [c.category_code, c.category_name, c.total]),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Bulanan');

  // 2. Daftar Transaksi
  const trxData = [
    ['DAFTAR TRANSAKSI PERIODE ' + formatMonthYearIndonesian(report.period)],
    [],
    ['No. Transaksi', 'Tanggal', 'Tipe', 'Keterangan', 'Akun / Aliran', 'Kategori', 'Nominal (Rp)', 'Catatan'],
    ...report.transactions.map((t) => {
      let flow = '-';
      if (t.type === 'INCOME') flow = t.destination_account?.name || '-';
      else if (t.type === 'EXPENSE') flow = t.source_account?.name || '-';
      else if (t.type === 'TRANSFER') flow = `${t.source_account?.name || '-'} → ${t.destination_account?.name || '-'}`;

      return [
        t.transaction_number,
        t.transaction_date,
        t.type,
        t.description,
        flow,
        t.category?.name || '-',
        t.amount,
        t.note || '',
      ];
    }),
  ];

  const wsTrx = XLSX.utils.aoa_to_sheet(trxData);
  XLSX.utils.book_append_sheet(wb, wsTrx, 'Daftar Transaksi');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buf;
}

export function exportYearlyReportToExcel(report: YearlyReportSummary) {
  const wb = XLSX.utils.book_new();

  const yearlyData = [
    ['LAPORAN KEUANGAN TAHUNAN'],
    ['Pondok Pesantren Al-Misykat Al-Islami'],
    ['Tahun Buku:', report.year.toString()],
    [],
    ['RINGKASAN TAHUNAN'],
    ['Saldo Awal Tahun', report.opening_balance],
    ['Total Pemasukan', report.total_income],
    ['Total Pengeluaran', report.total_expense],
    ['Net Surplus / (Defisit)', report.net_surplus_deficit],
    ['Saldo Akhir Tahun', report.closing_balance],
    [],
    ['REKAPITULASI BULANAN'],
    ['Periode', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Net (Rp)', 'Saldo Akhir (Rp)'],
    ...report.rows.map((r) => [
      r.period,
      r.income,
      r.expense,
      r.net,
      r.closing_balance,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(yearlyData);
  XLSX.utils.book_append_sheet(wb, ws, `Tahunan ${report.year}`);

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function exportTransactionsToExcel(transactions: Transaction[], title = 'Daftar Transaksi') {
  const wb = XLSX.utils.book_new();

  const data = [
    ['Pondok Pesantren Al-Misykat Al-Islami'],
    [title.toUpperCase()],
    ['Diekspor pada:', new Date().toLocaleString('id-ID')],
    [],
    ['No. Transaksi', 'Tanggal', 'Tipe', 'Keterangan', 'Akun Sumber', 'Akun Tujuan', 'Kategori', 'Nominal (Rp)', 'Ada Bukti?', 'Catatan'],
    ...transactions.map((t) => [
      t.transaction_number,
      t.transaction_date,
      t.type,
      t.description,
      t.source_account?.name || '-',
      t.destination_account?.name || '-',
      t.category?.name || '-',
      t.amount,
      (t.attachments && t.attachments.length > 0) ? 'Ya' : 'Tidak',
      t.note || '',
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
