import { financeRepo } from '../src/lib/db/engine';

console.log('🌱 Seeding Pondok Pesantren Al-Misykat Al-Islami Financial Database...');

const accounts = financeRepo.getAccounts(true);
console.log(`✅ Loaded ${accounts.length} Financial Accounts:`);
accounts.forEach((a) => {
  console.log(`   [${a.code}] ${a.name} -> Saldo Awal: Rp${a.opening_balance.toLocaleString('id-ID')} (${a.opening_balance_date})`);
});

const incCats = financeRepo.getCategories('INCOME', true);
console.log(`✅ Loaded ${incCats.length} Master Income Categories: (PM01 - PM16)`);

const expCats = financeRepo.getCategories('EXPENSE', true);
console.log(`✅ Loaded ${expCats.length} Master Expense Categories: (PG01 - PG19)`);

const profile = financeRepo.getProfile();
console.log(`✅ Initial Admin Account: ${profile?.email} (${profile?.name})`);

console.log('✨ Database bootstrap & master seeds ready!');
