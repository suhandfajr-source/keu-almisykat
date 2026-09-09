import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { calculateAccountBalances, generateMonthlyReport, generateYearlyReport } from '../src/lib/finance-math';
import { exportMonthlyReportToExcel, exportYearlyReportToExcel } from '../src/lib/export/excel';
import { generateMonthlyReportPdf, generateYearlyReportPdf } from '../src/lib/export/pdf';

// Load .env.local natively
function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

async function main() {
  console.log('================================================================');
  console.log('🚀 LIVE SUPABASE END-TO-END VERIFICATION & AUDIT');
  console.log('================================================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase URL or Anon Key is missing from .env.local');
  }

  // Create admin/service client for database test orchestration
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const results: Record<string, 'PASS' | 'FAIL'> = {};

  // ---------------------------------------------------------
  // 1. CEK PRODUCTION DRIVER & ENV
  // ---------------------------------------------------------
  console.log('--- 1. PRODUCTION DRIVER & ENV CHECK ---');
  const dbDriver = process.env.DATABASE_DRIVER;
  const storageDriver = process.env.STORAGE_DRIVER;
  console.log(`• DATABASE_DRIVER: ${dbDriver}`);
  console.log(`• STORAGE_DRIVER: ${storageDriver}`);
  console.log(`• NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl.replace(/https?:\/\/([^.]+).*/, '$1')}...`);
  console.log(`• NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey.substring(0, 10)}... (Length: ${anonKey.length})`);
  results['Driver & Env'] = dbDriver === 'supabase' && storageDriver === 'supabase' ? 'PASS' : 'FAIL';
  console.log(`Status: ${results['Driver & Env']}\n`);

  // ---------------------------------------------------------
  // 2. CEK DATABASE SUPABASE & MASTER DATA SEEDS
  // ---------------------------------------------------------
  console.log('--- 2. DATABASE & MASTER DATA CHECK ---');
  const { data: accounts, error: accErr } = await supabase.from('accounts').select('*').order('code');
  if (accErr) throw new Error(`Accounts table query error: ${accErr.message}`);

  const ak01 = accounts.find((a) => a.code === 'AK01');
  const ak02 = accounts.find((a) => a.code === 'AK02');
  const ak03 = accounts.find((a) => a.code === 'AK03');

  console.log(`• AK01 Bank Al-Misykat: Rp${Number(ak01?.opening_balance).toLocaleString('id-ID')} (Cut-off: ${ak01?.opening_balance_date})`);
  console.log(`• AK02 Cash Pesantren:  Rp${Number(ak02?.opening_balance).toLocaleString('id-ID')} (Cut-off: ${ak02?.opening_balance_date})`);
  console.log(`• AK03 Cash Yandi:      Rp${Number(ak03?.opening_balance).toLocaleString('id-ID')} (Cut-off: ${ak03?.opening_balance_date})`);

  const totalOpening = (accounts || []).reduce((sum, a) => sum + Number(a.opening_balance), 0);
  console.log(`• Total Saldo Awal: Rp${totalOpening.toLocaleString('id-ID')} (Expected: Rp250.406.457)`);

  const { data: categories, error: catErr } = await supabase.from('categories').select('*').order('code');
  if (catErr) throw new Error(`Categories query error: ${catErr.message}`);

  const incomeCats = categories.filter((c) => c.type === 'INCOME');
  const expenseCats = categories.filter((c) => c.type === 'EXPENSE');
  console.log(`• Kategori Pemasukan: ${incomeCats.length} (PM01-PM16)`);
  console.log(`• Kategori Pengeluaran: ${expenseCats.length} (PG01-PG19)`);

  const isAccountsValid = Number(ak01?.opening_balance) === 238957146 &&
                          Number(ak02?.opening_balance) === 25700 &&
                          Number(ak03?.opening_balance) === 11423611 &&
                          totalOpening === 250406457;
  const isCategoriesValid = incomeCats.length === 16 && expenseCats.length === 19;

  results['Database & Seeds'] = isAccountsValid && isCategoriesValid ? 'PASS' : 'FAIL';
  console.log(`Status: ${results['Database & Seeds']}\n`);

  // Record initial balances before live tests
  const initialAllTrx = (await supabase.from('transactions').select('*')).data || [];
  const initialBalanceCalc = calculateAccountBalances(accounts, initialAllTrx);
  const initialTotalBalance = initialBalanceCalc.totalBalance;
  console.log(`Initial Total Balance Before Live Test: Rp${initialTotalBalance.toLocaleString('id-ID')}\n`);

  // ---------------------------------------------------------
  // 3. CEK RLS
  // ---------------------------------------------------------
  console.log('--- 3. RLS POLICY VERIFICATION ---');
  const anonClient = createClient(supabaseUrl, anonKey);
  const { error: anonTrxErr } = await anonClient.from('transactions').insert({
    transaction_number: 'TRX-TEST-ANON',
    transaction_date: '2026-08-01',
    type: 'INCOME',
    amount: 1000,
    description: 'Anonymous Write Test',
  });
  const rlsBlocked = Boolean(anonTrxErr);
  console.log(`• Anonymous insert to transactions: ${rlsBlocked ? 'BLOCKED ✅' : 'ALLOWED ❌'}`);
  results['RLS Policies'] = rlsBlocked ? 'PASS' : 'FAIL';
  console.log(`Status: ${results['RLS Policies']}\n`);

  // ---------------------------------------------------------
  // 5. LIVE TEST — PEMASUKAN (INCOME)
  // ---------------------------------------------------------
  console.log('--- 5. LIVE TEST — PEMASUKAN ---');
  const pm01 = categories.find((c) => c.code === 'PM01')!;
  const incomeAmount = 1000;
  const incomeDate = '2026-08-01';

  // Generate sequential transaction number
  const incomeTrxNum = 'TRX-2608-TEST-0001';

  const { data: createdIncome, error: incErr } = await supabase
    .from('transactions')
    .insert({
      transaction_number: incomeTrxNum,
      transaction_date: incomeDate,
      type: 'INCOME',
      destination_account_id: ak01.id,
      category_id: pm01.id,
      amount: incomeAmount,
      description: 'LIVE TEST PEMASUKAN',
      note: 'Temporary live verification record',
    })
    .select()
    .single();

  if (incErr) throw new Error(`Failed to insert income: ${incErr.message}`);
  console.log(`• Created Income Transaction: ${createdIncome.transaction_number} (+Rp${incomeAmount})`);

  // Upload test evidence to transaction-evidence bucket
  const testBuffer = Buffer.from('LIVE_INTEGRATION_TEST_EVIDENCE_DUMMY_CONTENT');
  const evidenceStoragePath = `transactions/${createdIncome.id}/test_evidence.txt`;
  
  // Storage upload
  await supabase.storage.from('transaction-evidence').upload(evidenceStoragePath, testBuffer, {
    contentType: 'text/plain',
    upsert: true,
  });

  const { data: attData } = await supabase.from('transaction_attachments').insert({
    transaction_id: createdIncome.id,
    file_name: 'test_evidence.txt',
    file_path: evidenceStoragePath,
    mime_type: 'text/plain',
    file_size: testBuffer.length,
  }).select().single();

  console.log(`• Uploaded Evidence to bucket "transaction-evidence": ${attData?.file_name}`);

  // Verify updated balance
  let currentTrxList = (await supabase.from('transactions').select('*')).data || [];
  let balCalc = calculateAccountBalances(accounts, currentTrxList);
  console.log(`• AK01 Balance: Rp${balCalc.accountBalances[ak01.id].toLocaleString('id-ID')} (Expected: Rp${(Number(ak01.opening_balance) + 1000).toLocaleString('id-ID')})`);
  console.log(`• Total Balance: Rp${balCalc.totalBalance.toLocaleString('id-ID')} (Expected: Rp${(initialTotalBalance + 1000).toLocaleString('id-ID')})`);

  results['Income Live Write'] = balCalc.accountBalances[ak01.id] === Number(ak01.opening_balance) + 1000 ? 'PASS' : 'FAIL';
  console.log(`Status: ${results['Income Live Write']}\n`);

  // ---------------------------------------------------------
  // 6. LIVE TEST — TRANSFER
  // ---------------------------------------------------------
  console.log('--- 6. LIVE TEST — TRANSFER ---');
  const transferAmount = 500;
  const transferTrxNum = 'TRX-2608-TEST-0002';

  const { data: createdTransfer, error: trfErr } = await supabase
    .from('transactions')
    .insert({
      transaction_number: transferTrxNum,
      transaction_date: '2026-08-02',
      type: 'TRANSFER',
      source_account_id: ak01.id,
      destination_account_id: ak03.id,
      amount: transferAmount,
      description: 'LIVE TEST TRANSFER',
    })
    .select()
    .single();

  if (trfErr) throw new Error(`Failed to insert transfer: ${trfErr.message}`);
  console.log(`• Created Transfer: ${createdTransfer.transaction_number} (AK01 -> AK03, Rp${transferAmount})`);

  currentTrxList = (await supabase.from('transactions').select('*')).data || [];
  balCalc = calculateAccountBalances(accounts, currentTrxList);
  console.log(`• AK01 Balance: Rp${balCalc.accountBalances[ak01.id].toLocaleString('id-ID')} (Expected: Rp${(Number(ak01.opening_balance) + 1000 - 500).toLocaleString('id-ID')})`);
  console.log(`• AK03 Balance: Rp${balCalc.accountBalances[ak03.id].toLocaleString('id-ID')} (Expected: Rp${(Number(ak03.opening_balance) + 500).toLocaleString('id-ID')})`);
  console.log(`• Total System Balance (Unchanged by transfer): Rp${balCalc.totalBalance.toLocaleString('id-ID')}`);

  const monthlyRep = generateMonthlyReport(accounts, categories, currentTrxList, '2026-08');
  console.log(`• Monthly Total Income: Rp${monthlyRep.total_income.toLocaleString('id-ID')} (Transfer ignored: Rp1.000)`);
  console.log(`• Monthly Total Expense: Rp${monthlyRep.total_expense.toLocaleString('id-ID')} (Transfer ignored: Rp0)`);

  results['Transfer Live Write'] = monthlyRep.total_income === 1000 && monthlyRep.total_expense === 0 ? 'PASS' : 'FAIL';
  console.log(`Status: ${results['Transfer Live Write']}\n`);

  // ---------------------------------------------------------
  // 7. LIVE TEST — PENGELUARAN (EXPENSE)
  // ---------------------------------------------------------
  console.log('--- 7. LIVE TEST — PENGELUARAN ---');
  const pg11 = categories.find((c) => c.code === 'PG11')!;
  const expenseTrxNum = 'TRX-2608-TEST-0003';

  const { data: createdExpense, error: expErr } = await supabase
    .from('transactions')
    .insert({
      transaction_number: expenseTrxNum,
      transaction_date: '2026-08-03',
      type: 'EXPENSE',
      source_account_id: ak03.id,
      category_id: pg11.id,
      amount: 250,
      description: 'LIVE TEST PENGELUARAN',
    })
    .select()
    .single();

  if (expErr) throw new Error(`Failed to insert expense: ${expErr.message}`);
  console.log(`• Created Expense: ${createdExpense.transaction_number} (-Rp250 from AK03)`);

  currentTrxList = (await supabase.from('transactions').select('*')).data || [];
  balCalc = calculateAccountBalances(accounts, currentTrxList);
  console.log(`• AK03 Balance: Rp${balCalc.accountBalances[ak03.id].toLocaleString('id-ID')} (Expected: Rp${(Number(ak03.opening_balance) + 500 - 250).toLocaleString('id-ID')})`);
  console.log(`• Total System Balance: Rp${balCalc.totalBalance.toLocaleString('id-ID')} (Expected: Rp${(initialTotalBalance + 1000 - 250).toLocaleString('id-ID')})`);

  results['Expense Live Write'] = balCalc.accountBalances[ak03.id] === Number(ak03.opening_balance) + 250 ? 'PASS' : 'FAIL';
  console.log(`Status: ${results['Expense Live Write']}\n`);

  // ---------------------------------------------------------
  // 8. LIVE TEST — EDIT EXPENSE (250 -> 200)
  // ---------------------------------------------------------
  console.log('--- 8. LIVE TEST — EDIT EXPENSE ---');
  const { error: editErr } = await supabase
    .from('transactions')
    .update({
      amount: 200,
      description: 'LIVE TEST PENGELUARAN (EDITED)',
    })
    .eq('id', createdExpense.id);

  if (editErr) throw new Error(`Failed to edit expense: ${editErr.message}`);
  console.log('• Updated Expense Amount: 250 -> 200');

  currentTrxList = (await supabase.from('transactions').select('*')).data || [];
  balCalc = calculateAccountBalances(accounts, currentTrxList);
  console.log(`• Reconciled AK03 Balance: Rp${balCalc.accountBalances[ak03.id].toLocaleString('id-ID')} (Expected: Rp${(Number(ak03.opening_balance) + 500 - 200).toLocaleString('id-ID')})`);
  console.log(`• Reconciled Total System Balance: Rp${balCalc.totalBalance.toLocaleString('id-ID')} (Expected: Rp${(initialTotalBalance + 1000 - 200).toLocaleString('id-ID')})`);

  results['Edit Reconciliation'] = balCalc.accountBalances[ak03.id] === Number(ak03.opening_balance) + 300 ? 'PASS' : 'FAIL';
  console.log(`Status: ${results['Edit Reconciliation']}\n`);

  // ---------------------------------------------------------
  // 9. LIVE TEST — STORAGE
  // ---------------------------------------------------------
  console.log('--- 9. STORAGE TEST ---');
  const { data: signedUrlData, error: signErr } = await supabase.storage
    .from('transaction-evidence')
    .createSignedUrl(evidenceStoragePath, 3600);

  const signedOk = !signErr && Boolean(signedUrlData?.signedUrl);
  console.log(`• Signed URL generation: ${signedOk ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  results['Storage Test'] = signedOk ? 'PASS' : 'FAIL';
  console.log(`Status: ${results['Storage Test']}\n`);

  // ---------------------------------------------------------
  // 10. CLEANUP (DELETE ALL TEST RECORDS & STORAGE OBJECTS)
  // ---------------------------------------------------------
  console.log('--- 10. CLEANUP TEST DATA ---');
  // 1. Delete storage object
  await supabase.storage.from('transaction-evidence').remove([evidenceStoragePath]);
  console.log('• Deleted test storage file');

  // 2. Delete test transactions
  await supabase.from('transactions').delete().in('id', [createdIncome.id, createdTransfer.id, createdExpense.id]);
  console.log('• Deleted test transactions & cascading attachments');

  // 3. Verify balance returned exactly to original value
  const finalTrxList = (await supabase.from('transactions').select('*')).data || [];
  const finalBalCalc = calculateAccountBalances(accounts, finalTrxList);
  console.log(`• Final Total System Balance: Rp${finalBalCalc.totalBalance.toLocaleString('id-ID')} (Original: Rp${initialTotalBalance.toLocaleString('id-ID')})`);
  console.log(`• AK01 Balance: Rp${finalBalCalc.accountBalances[ak01.id].toLocaleString('id-ID')} (Original: Rp${Number(ak01.opening_balance).toLocaleString('id-ID')})`);
  console.log(`• AK02 Balance: Rp${finalBalCalc.accountBalances[ak02.id].toLocaleString('id-ID')} (Original: Rp${Number(ak02.opening_balance).toLocaleString('id-ID')})`);
  console.log(`• AK03 Balance: Rp${finalBalCalc.accountBalances[ak03.id].toLocaleString('id-ID')} (Original: Rp${Number(ak03.opening_balance).toLocaleString('id-ID')})`);

  const balanceFullyRestored = finalBalCalc.totalBalance === initialTotalBalance &&
    finalBalCalc.accountBalances[ak01.id] === Number(ak01.opening_balance) &&
    finalBalCalc.accountBalances[ak02.id] === Number(ak02.opening_balance) &&
    finalBalCalc.accountBalances[ak03.id] === Number(ak03.opening_balance);

  results['Cleanup & Restoration'] = balanceFullyRestored ? 'PASS' : 'FAIL';
  console.log(`Status: ${results['Cleanup & Restoration']}\n`);

  // ---------------------------------------------------------
  // 11 & 12. REPORT & EXPORT GENERATION FROM SUPABASE DATA
  // ---------------------------------------------------------
  console.log('--- 11 & 12. REPORTS & EXPORT GENERATION ---');
  const repMonthly = generateMonthlyReport(accounts, categories, finalTrxList, '2026-08');
  const repYearly = generateYearlyReport(accounts, categories, finalTrxList, 2026);

  const excelMonthlyBuf = exportMonthlyReportToExcel(repMonthly);
  const excelYearlyBuf = exportYearlyReportToExcel(repYearly);
  const pdfMonthlyBytes = generateMonthlyReportPdf(repMonthly);
  const pdfYearlyBytes = generateYearlyReportPdf(repYearly);

  const exportOk = Boolean(excelMonthlyBuf && excelYearlyBuf && pdfMonthlyBytes && pdfYearlyBytes);
  console.log(`• Excel Monthly & Yearly generation: ${Boolean(excelMonthlyBuf && excelYearlyBuf) ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`• PDF Monthly & Yearly generation: ${Boolean(pdfMonthlyBytes && pdfYearlyBytes) ? 'PASS ✅' : 'FAIL ❌'}`);
  results['Reports & Exports'] = exportOk ? 'PASS' : 'FAIL';
  console.log(`Status: ${results['Reports & Exports']}\n`);

  // ---------------------------------------------------------
  // 13. SERVICE ROLE KEY SECURITY AUDIT
  // ---------------------------------------------------------
  console.log('--- 13. SERVICE ROLE KEY SECURITY AUDIT ---');
  let leakedInClient = false;
  for (const cf of ['src/lib/supabase/client.ts', 'src/components/layout/Sidebar.tsx']) {
    const fullP = path.join(process.cwd(), cf);
    if (fs.existsSync(fullP)) {
      const code = fs.readFileSync(fullP, 'utf-8');
      if (code.includes('SUPABASE_SERVICE_ROLE_KEY')) leakedInClient = true;
    }
  }
  results['Service Role Security'] = !leakedInClient ? 'PASS' : 'FAIL';
  console.log(`Status: ${results['Service Role Security']}\n`);

  console.log('================================================================');
  console.log('🎉 SUMMARY OF LIVE SUPABASE VERIFICATION:');
  console.table(results);
  console.log('================================================================');
}

main().catch((err) => {
  console.error('❌ Error during live verification:', err);
  process.exit(1);
});
