import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

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

async function seedSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local.');
    console.log('To seed directly from CLI:');
    console.log('1. Copy SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard > Settings > API');
    console.log('2. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    console.log('OR run supabase/seed.sql in Supabase SQL Editor.');
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  console.log('🌱 Seeding Supabase database with master accounts & categories...');

  // 1. Accounts
  const { error: accErr } = await supabase.from('accounts').upsert([
    { code: 'AK01', name: 'Bank Al-Misykat', opening_balance: 238957146, opening_balance_date: '2026-07-31', is_active: true },
    { code: 'AK02', name: 'Cash Pesantren', opening_balance: 25700, opening_balance_date: '2026-07-31', is_active: true },
    { code: 'AK03', name: 'Cash Yandi', opening_balance: 11423611, opening_balance_date: '2026-07-31', is_active: true },
  ], { onConflict: 'code' });

  if (accErr) console.error('Error seeding accounts:', accErr.message);
  else console.log('✅ 3 Master Accounts seeded (Total: Rp250.406.457)');

  // 2. Categories
  const incomeCategories = [
    { code: 'PM01', name: 'Infaq/Shodaqoh Pesantren Berseri', type: 'INCOME', is_active: true },
    { code: 'PM02', name: 'Wakaf Pesantren', type: 'INCOME', is_active: true },
    { code: 'PM03', name: 'Sumbangan/Sedekah Pesantren', type: 'INCOME', is_active: true },
    { code: 'PM04', name: 'Beasiswa/Orang Tua Asuh', type: 'INCOME', is_active: true },
    { code: 'PM05', name: 'Hasil Bank', type: 'INCOME', is_active: true },
    { code: 'PM06', name: 'Pembangunan Masjid', type: 'INCOME', is_active: true },
    { code: 'PM07', name: 'Zakat Mal/Profesi/Emas', type: 'INCOME', is_active: true },
    { code: 'PM08', name: 'Lain-lain', type: 'INCOME', is_active: true },
    { code: 'PM09', name: 'Infaq Air/Filter', type: 'INCOME', is_active: true },
    { code: 'PM10', name: 'Wakaf Jalan', type: 'INCOME', is_active: true },
    { code: 'PM11', name: 'Pembangunan Sakan', type: 'INCOME', is_active: true },
    { code: 'PM12', name: 'Wakaf Sumur', type: 'INCOME', is_active: true },
    { code: 'PM13', name: 'Pembangunan Kelas', type: 'INCOME', is_active: true },
    { code: 'PM14', name: 'Ifthar/Sahur', type: 'INCOME', is_active: true },
    { code: 'PM15', name: 'Wakaf Sawah', type: 'INCOME', is_active: true },
    { code: 'PM16', name: 'Qurban', type: 'INCOME', is_active: true },
  ];

  const expenseCategories = [
    { code: 'PG01', name: 'Pajak', type: 'EXPENSE', is_active: true },
    { code: 'PG02', name: 'Biaya Bank', type: 'EXPENSE', is_active: true },
    { code: 'PG03', name: 'Transportasi', type: 'EXPENSE', is_active: true },
    { code: 'PG04', name: 'Gaji/Kafalah', type: 'EXPENSE', is_active: true },
    { code: 'PG05', name: 'Peralatan/Perlengkapan', type: 'EXPENSE', is_active: true },
    { code: 'PG06', name: 'Pulsa Listrik', type: 'EXPENSE', is_active: true },
    { code: 'PG07', name: 'Sarana & Prasarana Pesantren', type: 'EXPENSE', is_active: true },
    { code: 'PG08', name: 'Sarana & Prasarana Masjid', type: 'EXPENSE', is_active: true },
    { code: 'PG09', name: 'Sawah', type: 'EXPENSE', is_active: true },
    { code: 'PG10', name: 'Kegiatan Belajar Mengajar', type: 'EXPENSE', is_active: true },
    { code: 'PG11', name: 'Kebutuhan Dapur', type: 'EXPENSE', is_active: true },
    { code: 'PG12', name: 'Motor Pesantren', type: 'EXPENSE', is_active: true },
    { code: 'PG13', name: 'Internet', type: 'EXPENSE', is_active: true },
    { code: 'PG14', name: 'Perbaikan Jalan', type: 'EXPENSE', is_active: true },
    { code: 'PG15', name: 'Lain-lain', type: 'EXPENSE', is_active: true },
    { code: 'PG16', name: 'Air/Sumur', type: 'EXPENSE', is_active: true },
    { code: 'PG17', name: 'Ifthar/Sahur', type: 'EXPENSE', is_active: true },
    { code: 'PG18', name: 'Ramadhan', type: 'EXPENSE', is_active: true },
    { code: 'PG19', name: 'Qurban', type: 'EXPENSE', is_active: true },
  ];

  const { error: catErr } = await supabase.from('categories').upsert([
    ...incomeCategories,
    ...expenseCategories,
  ], { onConflict: 'code' });

  if (catErr) console.error('Error seeding categories:', catErr.message);
  else console.log('✅ 35 Master Categories seeded (PM01-16, PG01-19)');

  console.log('✨ Seed completed successfully!');
}

seedSupabase().catch(console.error);
