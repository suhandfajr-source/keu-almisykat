import { NextRequest, NextResponse } from 'next/server';
import { financeDb } from '@/lib/db';
import { generateMonthlyReport, generateYearlyReport } from '@/lib/finance-math';
import { exportMonthlyReportToExcel, exportYearlyReportToExcel, exportTransactionsToExcel } from '@/lib/export/excel';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'monthly';
  const period = searchParams.get('period') || '2026-08';
  const year = parseInt(searchParams.get('year') || '2026', 10);

  const accounts = await financeDb.getAccounts(true);
  const categories = await financeDb.getCategories(undefined, true);
  const allTrx = await financeDb.getAllTransactionsRaw();

  let buffer: Buffer;
  let filename = 'Laporan_Keuangan_Al_Misykat.xlsx';

  if (type === 'monthly') {
    const report = generateMonthlyReport(accounts, categories, allTrx, period);
    buffer = exportMonthlyReportToExcel(report) as Buffer;
    filename = `Laporan_Bulanan_Al_Misykat_${period}.xlsx`;
  } else if (type === 'yearly') {
    const report = generateYearlyReport(accounts, categories, allTrx, year);
    buffer = exportYearlyReportToExcel(report) as Buffer;
    filename = `Laporan_Tahunan_Al_Misykat_${year}.xlsx`;
  } else {
    const trxList = await financeDb.getTransactions();
    buffer = exportTransactionsToExcel(trxList) as Buffer;
    filename = `Transaksi_Al_Misykat_${new Date().toISOString().split('T')[0]}.xlsx`;
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
