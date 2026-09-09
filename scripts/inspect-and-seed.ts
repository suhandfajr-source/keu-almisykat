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

async function inspectAndSeed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  console.log('Inspecting Supabase schema...');

  // 1. Check accounts table
  const { data: accs, error: accErr } = await supabase.from('accounts').select('*');
  console.log('Accounts table response:', { count: accs?.length, error: accErr });

  // 2. Check categories table
  const { data: cats, error: catErr } = await supabase.from('categories').select('*');
  console.log('Categories table response:', { count: cats?.length, error: catErr });

  // If tables exist but are empty, try inserting the seed data
  if (accs && accs.length === 0) {
    console.log('Attempting to insert initial accounts seed...');
    const { data: insAcc, error: insAccErr } = await supabase.from('accounts').insert([
      { code: 'AK01', name: 'Bank Al-Misykat', opening_balance: 238957146, opening_balance_date: '2026-07-31', is_active: true },
      { code: 'AK02', name: 'Cash Pesantren', opening_balance: 25700, opening_balance_date: '2026-07-31', is_active: true },
      { code: 'AK03', name: 'Cash Yandi', opening_balance: 11423611, opening_balance_date: '2026-07-31', is_active: true },
    ]).select();
    console.log('Accounts insert result:', { count: insAcc?.length, error: insAccErr });
  }

  if (cats && cats.length === 0) {
    console.log('Attempting to insert initial categories seed...');
    const incomeCategories = [
      { code: 'PM01', name: 'SPP / Iuran Santri', type: 'INCOME' },
      { code: 'PM02', name: 'Uang Masuk / Pendaftaran Santri Baru', type: 'INCOME' },
      { code: 'PM03', name: 'Daftar Ulang Santri Lama', type: 'INCOME' },
      { code: 'PM04', name: 'Infaq / Sedekah Operasional', type: 'INCOME' },
      { code: 'PM05', name: 'Wakaf Pembangunan & Sarpras', type: 'INCOME' },
      { code: 'PM06', name: 'Zakat Mal & Fitrah', type: 'INCOME' },
      { code: 'PM07', name: 'Dana BOS / Bantuan Pemerintah', type: 'INCOME' },
      { code: 'PM08', name: 'Sponsorship / CSR Lembaga', type: 'INCOME' },
      { code: 'PM09', name: 'Bagi Hasil Unit Usaha Pesantren', type: 'INCOME' },
      { code: 'PM10', name: 'Penjualan Seragam & Kitab', type: 'INCOME' },
      { code: 'PM11', name: 'Hasil Laundry & Katering Pesantren', type: 'INCOME' },
      { code: 'PM12', name: 'Donasi Non-Terikat', type: 'INCOME' },
      { code: 'PM13', name: 'Sumbangan Wali Santri / Alumni', type: 'INCOME' },
      { code: 'PM14', name: 'Bunga Bank / Jasa Giro', type: 'INCOME' },
      { code: 'PM15', name: 'Pendapatan Acara / PHBI / Wisuda', type: 'INCOME' },
      { code: 'PM16', name: 'Pemasukan Lain-lain', type: 'INCOME' },
    ];

    const expenseCategories = [
      { code: 'PG01', name: 'Gaji & Honor Ustadz / Guru', type: 'EXPENSE' },
      { code: 'PG02', name: 'Gaji & Upah Staf / Karyawan Operasional', type: 'EXPENSE' },
      { code: 'PG03', name: 'Tunjangan & Kesejahteraan Pegawai', type: 'EXPENSE' },
      { code: 'PG04', name: 'Konsumsi & Dapur Harian Santri', type: 'EXPENSE' },
      { code: 'PG05', name: 'Listrik & Token PLN', type: 'EXPENSE' },
      { code: 'PG06', name: 'Air PDAM / Pembelian Air Bersih', type: 'EXPENSE' },
      { code: 'PG07', name: 'Internet, Website & Langganan Software', type: 'EXPENSE' },
      { code: 'PG08', name: 'Pemeliharaan Gedung & Asrama', type: 'EXPENSE' },
      { code: 'PG09', name: 'Pemeliharaan Sarpras, Mesin & Pompa', type: 'EXPENSE' },
      { code: 'PG10', name: 'Pengadaan Sarpras & Inventaris Baru', type: 'EXPENSE' },
      { code: 'PG11', name: 'Kebutuhan Dapur', type: 'EXPENSE' },
      { code: 'PG12', name: 'Kebutuhan Santri', type: 'EXPENSE' },
      { code: 'PG13', name: 'Kesehatan, Obat & P3K Santri', type: 'EXPENSE' },
      { code: 'PG14', name: 'Kegiatan Belajar Mengajar, Kitab & Ujian', type: 'EXPENSE' },
      { code: 'PG15', name: 'Kegiatan PHBI, Ekstrakurikuler & Lomba', type: 'EXPENSE' },
      { code: 'PG16', name: 'BBM, Tol, Servis Kendaraan Operasional', type: 'EXPENSE' },
      { code: 'PG17', name: 'ATK, Percetakan, Fotokopi & Surat Menyurat', type: 'EXPENSE' },
      { code: 'PG18', name: 'Biaya Administrasi Bank & Pajak', type: 'EXPENSE' },
      { code: 'PG19', name: 'Pengeluaran Lain-lain & Tak Terduga', type: 'EXPENSE' },
    ];

    const { data: insCat, error: insCatErr } = await supabase.from('categories').insert([
      ...incomeCategories.map((c) => ({ ...c, is_active: true })),
      ...expenseCategories.map((c) => ({ ...c, is_active: true })),
    ]).select();
    console.log('Categories insert result:', { count: insCat?.length, error: insCatErr });
  }
}

inspectAndSeed().catch(console.error);
