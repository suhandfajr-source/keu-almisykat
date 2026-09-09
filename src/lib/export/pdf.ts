import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonthlyReportSummary, YearlyReportSummary } from '@/types/finance';
import { formatRupiah } from '@/lib/finance-math';
import { formatMonthYearIndonesian } from '@/lib/date-utils';

export function generateMonthlyReportPdf(report: MonthlyReportSummary): Uint8Array {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PONDOK PESANTREN AL-MISYKAT AL-ISLAMI', 105, 15, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('LAPORAN KEUANGAN BULANAN', 105, 22, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Periode: ${formatMonthYearIndonesian(report.period)}`, 105, 28, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  // Executive Summary Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Ringkasan Eksekutif', 14, 38);

  autoTable(doc, {
    startY: 41,
    head: [['Indikator', 'Nominal']],
    body: [
      ['Saldo Awal Periode', formatRupiah(report.opening_balance)],
      ['Total Pemasukan', formatRupiah(report.total_income)],
      ['Total Pengeluaran', formatRupiah(report.total_expense)],
      ['Surplus / (Defisit)', formatRupiah(report.surplus_deficit, { showSign: true })],
      ['Saldo Akhir Periode', formatRupiah(report.closing_balance)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });

  // Account Breakdown Table
  let nextY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Saldo per Akun Keuangan', 14, nextY);

  autoTable(doc, {
    startY: nextY + 3,
    head: [['Kode', 'Akun', 'Saldo Awal', 'Masuk', 'Keluar', 'Transfer (+/-)', 'Saldo Akhir']],
    body: report.account_breakdown.map((a) => [
      a.account_code,
      a.account_name,
      formatRupiah(a.opening_balance, { withPrefix: false }),
      formatRupiah(a.income, { withPrefix: false }),
      formatRupiah(a.expense, { withPrefix: false }),
      formatRupiah(a.transfer_in - a.transfer_out, { withPrefix: false, showSign: true }),
      formatRupiah(a.closing_balance, { withPrefix: false }),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' },
    },
  });

  // Category breakdown
  nextY = (doc as any).lastAutoTable.finalY + 8;
  if (nextY > 230) {
    doc.addPage();
    nextY = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Rincian Pemasukan per Kategori', 14, nextY);

  const activeIncomes = report.income_by_category.filter((c) => c.total > 0);
  autoTable(doc, {
    startY: nextY + 3,
    head: [['Kode', 'Kategori Pemasukan', 'Jumlah']],
    body: activeIncomes.length > 0
      ? activeIncomes.map((c) => [c.category_code, c.category_name, formatRupiah(c.total)])
      : [['-', 'Tidak ada pemasukan pada periode ini', '-']],
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 2: { halign: 'right' } },
  });

  nextY = (doc as any).lastAutoTable.finalY + 8;
  if (nextY > 230) {
    doc.addPage();
    nextY = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Rincian Pengeluaran per Kategori', 14, nextY);

  const activeExpenses = report.expense_by_category.filter((c) => c.total > 0);
  autoTable(doc, {
    startY: nextY + 3,
    head: [['Kode', 'Kategori Pengeluaran', 'Jumlah']],
    body: activeExpenses.length > 0
      ? activeExpenses.map((c) => [c.category_code, c.category_name, formatRupiah(c.total)])
      : [['-', 'Tidak ada pengeluaran pada periode ini', '-']],
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 2: { halign: 'right' } },
  });

  return doc.output('arraybuffer') as unknown as Uint8Array;
}

export function generateYearlyReportPdf(report: YearlyReportSummary): Uint8Array {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PONDOK PESANTREN AL-MISYKAT AL-ISLAMI', 105, 15, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`LAPORAN KEUANGAN TAHUN BUKU ${report.year}`, 105, 22, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(14, 27, 196, 27);

  // Summary
  autoTable(doc, {
    startY: 32,
    head: [['Ringkasan Tahunan', 'Nominal']],
    body: [
      ['Saldo Awal Tahun', formatRupiah(report.opening_balance)],
      ['Total Pemasukan', formatRupiah(report.total_income)],
      ['Total Pengeluaran', formatRupiah(report.total_expense)],
      ['Net Surplus / (Defisit)', formatRupiah(report.net_surplus_deficit, { showSign: true })],
      ['Saldo Akhir Tahun', formatRupiah(report.closing_balance)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });

  const nextY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Rekapitulasi Arus Kas Bulanan', 14, nextY);

  autoTable(doc, {
    startY: nextY + 3,
    head: [['Periode', 'Pemasukan', 'Pengeluaran', 'Net Surplus / Defisit', 'Saldo Akhir']],
    body: report.rows.map((r) => [
      r.period,
      r.is_legacy ? '-' : formatRupiah(r.income, { withPrefix: false }),
      r.is_legacy ? '-' : formatRupiah(r.expense, { withPrefix: false }),
      r.is_legacy ? '-' : formatRupiah(r.net, { withPrefix: false, showSign: true }),
      formatRupiah(r.closing_balance, { withPrefix: false }),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
  });

  return doc.output('arraybuffer') as unknown as Uint8Array;
}
