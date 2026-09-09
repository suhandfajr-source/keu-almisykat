-- ====================================================================
-- Pondok Pesantren Al-Misykat Al-Islami - Master Data Seed
-- ====================================================================

-- 1. Master Accounts with Cut-off 31 July 2026
INSERT INTO accounts (code, name, opening_balance, opening_balance_date, is_active)
VALUES
    ('AK01', 'Bank Al-Misykat', 238957146, '2026-07-31', TRUE),
    ('AK02', 'Cash Pesantren', 25700, '2026-07-31', TRUE),
    ('AK03', 'Cash Yandi', 11423611, '2026-07-31', TRUE)
ON CONFLICT (code) DO UPDATE 
SET 
    name = EXCLUDED.name,
    opening_balance = EXCLUDED.opening_balance,
    opening_balance_date = EXCLUDED.opening_balance_date,
    is_active = EXCLUDED.is_active;

-- 2. Master Income Categories (PM01 - PM16)
INSERT INTO categories (code, name, type, is_active)
VALUES
    ('PM01', 'Infaq/Shodaqoh Pesantren Berseri', 'INCOME', TRUE),
    ('PM02', 'Wakaf Pesantren', 'INCOME', TRUE),
    ('PM03', 'Sumbangan/Sedekah Pesantren', 'INCOME', TRUE),
    ('PM04', 'Beasiswa/Orang Tua Asuh', 'INCOME', TRUE),
    ('PM05', 'Hasil Bank', 'INCOME', TRUE),
    ('PM06', 'Pembangunan Masjid', 'INCOME', TRUE),
    ('PM07', 'Zakat Mal/Profesi/Emas', 'INCOME', TRUE),
    ('PM08', 'Lain-lain', 'INCOME', TRUE),
    ('PM09', 'Infaq Air/Filter', 'INCOME', TRUE),
    ('PM10', 'Wakaf Jalan', 'INCOME', TRUE),
    ('PM11', 'Pembangunan Sakan', 'INCOME', TRUE),
    ('PM12', 'Wakaf Sumur', 'INCOME', TRUE),
    ('PM13', 'Pembangunan Kelas', 'INCOME', TRUE),
    ('PM14', 'Ifthar/Sahur', 'INCOME', TRUE),
    ('PM15', 'Wakaf Sawah', 'INCOME', TRUE),
    ('PM16', 'Qurban', 'INCOME', TRUE)
ON CONFLICT (code) DO UPDATE 
SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    is_active = EXCLUDED.is_active;

-- 3. Master Expense Categories (PG01 - PG19)
INSERT INTO categories (code, name, type, is_active)
VALUES
    ('PG01', 'Pajak', 'EXPENSE', TRUE),
    ('PG02', 'Biaya Bank', 'EXPENSE', TRUE),
    ('PG03', 'Transportasi', 'EXPENSE', TRUE),
    ('PG04', 'Gaji/Kafalah', 'EXPENSE', TRUE),
    ('PG05', 'Peralatan/Perlengkapan', 'EXPENSE', TRUE),
    ('PG06', 'Pulsa Listrik', 'EXPENSE', TRUE),
    ('PG07', 'Sarana & Prasarana Pesantren', 'EXPENSE', TRUE),
    ('PG08', 'Sarana & Prasarana Masjid', 'EXPENSE', TRUE),
    ('PG09', 'Sawah', 'EXPENSE', TRUE),
    ('PG10', 'Kegiatan Belajar Mengajar', 'EXPENSE', TRUE),
    ('PG11', 'Kebutuhan Dapur', 'EXPENSE', TRUE),
    ('PG12', 'Motor Pesantren', 'EXPENSE', TRUE),
    ('PG13', 'Internet', 'EXPENSE', TRUE),
    ('PG14', 'Perbaikan Jalan', 'EXPENSE', TRUE),
    ('PG15', 'Lain-lain', 'EXPENSE', TRUE),
    ('PG16', 'Air/Sumur', 'EXPENSE', TRUE),
    ('PG17', 'Ifthar/Sahur', 'EXPENSE', TRUE),
    ('PG18', 'Ramadhan', 'EXPENSE', TRUE),
    ('PG19', 'Qurban', 'EXPENSE', TRUE)
ON CONFLICT (code) DO UPDATE 
SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    is_active = EXCLUDED.is_active;

-- 4. Initial Legacy Summary (Cut-off 31 July 2026)
INSERT INTO legacy_summary (period_start, period_end, total_income, total_expense, closing_balance, note)
VALUES ('2026-01-01', '2026-07-31', NULL, NULL, 250406457, 'Posisi saldo awal cut-off per 31 Juli 2026')
ON CONFLICT DO NOTHING;
