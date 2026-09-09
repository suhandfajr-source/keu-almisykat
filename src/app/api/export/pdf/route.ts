import { NextRequest, NextResponse } from 'next/server';
import { financeDb } from '@/lib/db';
import { generateMonthlyReport, generateYearlyReport } from '@/lib/finance-math';
import { generateMonthlyReportPdf, generateYearlyReportPdf } from '@/lib/export/pdf';
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

  let pdfBytes: Uint8Array;
  let filename = 'Laporan_Keuangan_Al_Misykat.pdf';

  if (type === 'monthly') {
    const report = generateMonthlyReport(accounts, categories, allTrx, period);
    pdfBytes = generateMonthlyReportPdf(report);
    filename = `Laporan_Bulanan_Al_Misykat_${period}.pdf`;
  } else {
    const report = generateYearlyReport(accounts, categories, allTrx, year);
    pdfBytes = generateYearlyReportPdf(report);
    filename = `Laporan_Tahunan_Al_Misykat_${year}.pdf`;
  }

  return new NextResponse(pdfBytes as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
