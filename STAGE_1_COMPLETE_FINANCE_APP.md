# STAGE 1 — COMPLETE FINANCE MANAGEMENT APPLICATION

## 0. PROJECT MISSION

Build a simple, reliable, production-ready finance management web application for **Pondok Pesantren Al-Misykat Al-Islami**.

The application replaces the previous Excel-based workflow.

The system must remain intentionally simple:
- One logged-in user/admin/bendahara for the current version.
- Three financial accounts.
- Three transaction types.
- Automatic balances.
- Transaction evidence upload.
- Monthly and yearly reports.
- No complex accounting journal system.
- No multi-level approval.
- No multi-role permission system.
- No unnecessary modules.

Do not over-engineer.

The application must be implemented end-to-end and must not be considered complete until all acceptance tests in this document pass.

---

# 1. CORE PRINCIPLES

1. Every financial movement must be traceable.
2. Account balances are calculated from opening balances plus transactions.
3. Internal transfers must NOT be counted as income or expense.
4. Transaction evidence is attached to each transaction.
5. Historical January–July 2026 transactions do NOT need to be imported individually.
6. The system starts from a cut-off/opening position on **31 July 2026**.
7. The application must require login.
8. UI must be clean, spacious, simple, and easy for a bendahara to understand.
9. Avoid duplicated business logic between frontend and backend.
10. All financial calculation logic must be deterministic and testable.
11. Never use floating point for Rupiah monetary calculations. Store money as integer/bigint.
12. Never rely on manually typed balance totals after system initialization.

---

# 2. RECOMMENDED TECH STACK

Use a modern full-stack TypeScript architecture.

Recommended:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui or equivalent accessible component system
- Supabase
  - PostgreSQL database
  - Authentication
  - Storage for transaction attachments
- Zod for schema validation
- React Hook Form or equivalent for forms

Use the latest stable mutually compatible versions available in the project environment.

Do not introduce Redux or another global state library unless genuinely required.

Prefer server-side data fetching and server actions/API routes where appropriate.

---

# 3. AUTHENTICATION

Authentication is required.

Current scope:
- One user type: Admin / Bendahara.

Minimum user data:
- id
- name
- email
- password/auth identity
- created_at
- updated_at

Requirements:
- Login page.
- Logout.
- Protected application routes.
- Unauthenticated users must be redirected to login.
- Authenticated users must not see the login page unless they log out.
- Session persistence.
- Profile information in sidebar/footer area.

Do NOT implement:
- Complex roles.
- Permission matrices.
- Approval workflow.
- Staff hierarchy.

Architecture should remain extensible for multi-user support later.

---

# 4. APPLICATION NAVIGATION

Main sidebar must contain ONLY:

1. Dashboard
2. Transaksi
3. Rekap
4. Pengaturan

Bottom area:
- Logged-in user's name/email
- Logout

Do NOT add sidebar menu items for:
- Upload Bukti
- Edit Transaksi
- Hapus Transaksi
- Pemasukan
- Pengeluaran
- Transfer

These actions belong inside the Transaksi module.

---

# 5. MASTER FINANCIAL ACCOUNTS

Use these account names exactly.

| Code | Account Name | Opening Balance |
|---|---|---:|
| AK01 | Bank Al-Misykat | 238957146 |
| AK02 | Cash Pesantren | 25700 |
| AK03 | Cash Yandi | 11423611 |

Total opening balance:

**250406457**

Currency:
- IDR / Rupiah.

Opening balance date:
- **31 July 2026**

Operational start:
- **1 August 2026**

Opening balances must be stored once and then treated as the starting financial position.

After initialization, account balance must be calculated automatically.

---

# 6. MASTER INCOME CATEGORIES

Replace the previous complicated codes with these simplified codes.

| Code | Category |
|---|---|
| PM01 | Infaq/Shodaqoh Pesantren Berseri |
| PM02 | Wakaf Pesantren |
| PM03 | Sumbangan/Sedekah Pesantren |
| PM04 | Beasiswa/Orang Tua Asuh |
| PM05 | Hasil Bank |
| PM06 | Pembangunan Masjid |
| PM07 | Zakat Mal/Profesi/Emas |
| PM08 | Lain-lain |
| PM09 | Infaq Air/Filter |
| PM10 | Wakaf Jalan |
| PM11 | Pembangunan Sakan |
| PM12 | Wakaf Sumur |
| PM13 | Pembangunan Kelas |
| PM14 | Ifthar/Sahur |
| PM15 | Wakaf Sawah |
| PM16 | Qurban |

Type:
`INCOME`

---

# 7. MASTER EXPENSE CATEGORIES

| Code | Category |
|---|---|
| PG01 | Pajak |
| PG02 | Biaya Bank |
| PG03 | Transportasi |
| PG04 | Gaji/Kafalah |
| PG05 | Peralatan/Perlengkapan |
| PG06 | Pulsa Listrik |
| PG07 | Sarana & Prasarana Pesantren |
| PG08 | Sarana & Prasarana Masjid |
| PG09 | Sawah |
| PG10 | Kegiatan Belajar Mengajar |
| PG11 | Kebutuhan Dapur |
| PG12 | Motor Pesantren |
| PG13 | Internet |
| PG14 | Perbaikan Jalan |
| PG15 | Lain-lain |
| PG16 | Air/Sumur |
| PG17 | Ifthar/Sahur |
| PG18 | Ramadhan |
| PG19 | Qurban |

Type:
`EXPENSE`

---

# 8. TRANSACTION TYPES

The application must support exactly three core transaction types:

## 8.1 INCOME

Money enters one financial account.

Required:
- transaction date
- destination account
- income category
- amount
- description
- evidence attachment

Optional:
- note
- additional attachments

Effects:

`account balance += amount`

`total income += amount`

---

## 8.2 EXPENSE

Money leaves one financial account.

Required:
- transaction date
- source account
- expense category
- amount
- description
- evidence attachment

Optional:
- note
- additional attachments

Effects:

`account balance -= amount`

`total expense += amount`

The application must prevent an expense if it would create a negative account balance.

If this rule is ever changed later, it must be a deliberate product configuration change, not accidental behavior.

---

## 8.3 TRANSFER

Money moves from one internal account to another.

Required:
- transaction date
- source account
- destination account
- amount
- description
- evidence attachment

Optional:
- note
- additional attachments

Rules:
- source and destination account cannot be the same.
- amount must be greater than zero.
- source account must have sufficient balance.

Effects:

`source account balance -= amount`

`destination account balance += amount`

Important:

Transfer must NOT affect:
- Total Income
- Total Expense
- Surplus / Deficit

Transfer changes account distribution only.

---

# 9. TRANSACTION NUMBER

Generate a unique transaction number automatically.

Format:

`TRX-YYMM-XXXX`

Example:

`TRX-2608-0001`

Meaning:
- TRX = transaction
- 26 = year
- 08 = month
- 0001 = sequential number for that month

Requirements:
- Unique.
- Generated server-side/database-side.
- Must remain collision-safe under concurrent requests.
- Users must not manually edit transaction numbers.

Use a database uniqueness constraint.

---

# 10. TRANSACTION ATTACHMENTS

Every new transaction must support evidence upload.

Accepted file types:
- JPG
- JPEG
- PNG
- PDF

Recommended validation:
- maximum 10 MB per file
- reject unsupported MIME types
- sanitize generated storage path
- generate unique filenames internally

A transaction can have multiple attachments.

At least one attachment is required for NEW transactions.

Attachments belong to transactions, not to separate sidebar modules.

Transaction detail must provide:
- View evidence
- Add evidence
- Replace evidence where appropriate
- Delete individual evidence

Deleting an attachment must not delete the transaction.

Deleting a transaction must clean up its attachment records and associated storage objects safely.

---

# 11. TRANSACTION PAGE

Route example:

`/transactions`

Page header:
- Title: Transaksi
- Primary button: `+ Tambah Transaksi`

Main content:
- Transaction list/table.
- Search.
- Filters.

Filters:
- Period/date range
- Transaction type
- Account
- Category
- Search description or transaction number

Recommended columns:
- Date
- Transaction Number
- Type
- Description
- Account / Flow
- Category
- Amount
- Evidence indicator

For amount display:
- Income: positive / Masuk
- Expense: negative / Keluar
- Transfer: neutral transfer display

Do not overload the table with unnecessary controls.

Clicking a row opens transaction detail.

---

# 12. CREATE TRANSACTION

Single transaction form.

Field behavior changes according to transaction type.

## INCOME FORM

- Date
- Type = Income
- Destination Account
- Income Category
- Amount
- Description
- Note
- Evidence Upload

## EXPENSE FORM

- Date
- Type = Expense
- Source Account
- Expense Category
- Amount
- Description
- Note
- Evidence Upload

## TRANSFER FORM

- Date
- Type = Transfer
- Source Account
- Destination Account
- Amount
- Description
- Note
- Evidence Upload

Form requirements:
- Rupiah-friendly amount input.
- Store integer value only.
- Client validation.
- Server validation.
- Prevent duplicate submission.
- Disable submit button while saving.
- Clear actionable error message.
- Success feedback.
- Redirect to transaction detail or transaction list after save.

---

# 13. TRANSACTION DETAIL

Route example:

`/transactions/[id]`

Display:

- Transaction Number
- Date
- Type
- Account source/destination
- Category if applicable
- Amount
- Description
- Note
- Attachments
- Created at
- Updated at

Include an action menu:

`⋮ Pengaturan Transaksi`

Actions:
1. Edit Transaksi
2. Kelola Bukti
3. Hapus Transaksi

These actions MUST NOT become sidebar menu items.

---

# 14. EDIT TRANSACTION

Editing a transaction must preserve financial integrity.

Critical rule:

Do NOT mutate balances manually.

Balances must always be derived from opening balance + current transaction records.

When editing:
- validate fields again.
- ensure account has sufficient resulting balance.
- prevent source/destination account equality for transfer.
- preserve transaction number.
- update updated_at.
- avoid partial writes.

For edits that could invalidate downstream balance:
- run a complete validation before commit.
- wrap database changes in a safe transaction where possible.

---

# 15. DELETE TRANSACTION

Deletion requires confirmation.

Confirmation must clearly state:
- transaction number
- description
- amount

Deletion must:
- remove transaction record safely.
- remove attachment records.
- remove associated storage objects where appropriate.
- automatically affect recalculated balances and reports.

Do not implement manual "balance correction" after deletion.

---

# 16. DASHBOARD

Route:
`/dashboard`

Keep dashboard intentionally simple.

## Section A — Total Balance

Show:
`Total Saldo`

Formula:
sum of all active account balances.

---

## Section B — Account Balances

Cards:
- AK01 Bank Al-Misykat
- AK02 Cash Pesantren
- AK03 Cash Yandi

Show current calculated balance.

---

## Section C — Current Month Activity

Show:
- Pemasukan
- Pengeluaran
- Surplus / Defisit

Formula:

`Surplus / Deficit = Income - Expense`

Transfers excluded.

---

## Section D — Recent Transactions

Show latest 10 transactions.

Each row should link to transaction detail.

---

## Optional Simple Chart

One lightweight chart:
- Monthly Income vs Expense

Do not add unnecessary analytics.

---

# 17. REPORTS / REKAP

Main route:
`/reports`

Use tabs or a simple toggle:

- Bulanan
- Tahunan

Do not create excessive submenus.

---

# 18. MONTHLY REPORT

User selects month/year.

Example:
August 2026.

Show summary:

- Opening Balance
- Total Income
- Total Expense
- Surplus / Deficit
- Closing Balance

Formula:

`Closing Balance = Opening Balance + Income - Expense`

Internal transfers must not change total closing balance.

Also show:

## A. Balance by Account

Columns:
- Account
- Opening Balance
- Income
- Expense
- Transfer In
- Transfer Out
- Closing Balance

## B. Income by Category

Columns:
- Code
- Category
- Total

## C. Expense by Category

Columns:
- Code
- Category
- Total

## D. Transactions

Optional expandable/table view linked to original transactions.

---

# 19. YEARLY REPORT

User selects year.

For 2026, historical January–July is NOT represented as individual transactions.

The application must clearly distinguish:

`Opening / Legacy Period: 1 January – 31 July 2026`

and

`System Transactions: 1 August – 31 December 2026`

Do not fabricate detailed historical transactions.

At minimum show:
- Opening/cut-off position
- Monthly data from system start onward
- Income by month
- Expense by month
- Surplus/deficit by month
- Closing balance by month

Recommended table:

| Period | Income | Expense | Net | Closing Balance |
|---|---:|---:|---:|---:|
| Opening Position / Jan-Jul | Legacy Summary | Legacy Summary | - | 250406457 |
| August | ... | ... | ... | ... |
| September | ... | ... | ... | ... |

If historical aggregate income/expense data is imported later, store it separately as legacy summary data, not fake transactions.

---

# 20. EXPORT

Provide:
- Export Excel
- Export PDF

Supported:
- Monthly Report
- Yearly Report
- Transaction List

Exports must respect current filters where relevant.

Reports must use Indonesian Rupiah formatting.

Do not require users to manually rebuild Excel reports.

---

# 21. SETTINGS

Route:
`/settings`

Use sections/tabs inside ONE Settings area.

Sections:

1. Akun Keuangan
2. Kategori
3. Saldo / Data Awal
4. User

---

# 22. ACCOUNT SETTINGS

Display:
- Code
- Name
- Opening Balance
- Active status

Initial accounts:
- AK01
- AK02
- AK03

Adding future accounts may be allowed.

Rules:
- Code must be unique.
- Existing account with transactions must not be hard-deleted.
- Use active/inactive.
- Deactivating an account must not erase history.

---

# 23. CATEGORY SETTINGS

Use tabs:

`Pemasukan | Pengeluaran`

Functions:
- View categories
- Add category
- Edit category
- Activate/deactivate category

Rules:
- Code unique.
- Type immutable or carefully validated.
- Categories already used by transactions should not be hard deleted.
- Inactive categories remain visible in historical records but cannot be selected for new transactions.

---

# 24. OPENING DATA SETTINGS

Display cut-off:

`31 July 2026`

Opening account balances:

- AK01 Bank Al-Misykat = 238957146
- AK02 Cash Pesantren = 25700
- AK03 Cash Yandi = 11423611

Total:

`250406457`

After initial production setup:
- Opening data should be locked by default.
- If edit capability exists, require explicit confirmation.
- Opening balance changes must be auditable.
- Prefer restricting opening-balance edits after transactions exist.

---

# 25. USER SETTINGS

Allow logged-in user to manage:
- Name
- Email
- Password

Do not expose unnecessary technical account fields.

---

# 26. DATABASE MODEL

Suggested schema.

## profiles

- id UUID PK references auth.users
- name TEXT NOT NULL
- email TEXT
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

---

## accounts

- id UUID PK
- code TEXT UNIQUE NOT NULL
- name TEXT NOT NULL
- opening_balance BIGINT NOT NULL DEFAULT 0
- opening_balance_date DATE NOT NULL
- is_active BOOLEAN NOT NULL DEFAULT TRUE
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

---

## categories

- id UUID PK
- code TEXT UNIQUE NOT NULL
- name TEXT NOT NULL
- type ENUM/TEXT CHECK IN ('INCOME','EXPENSE')
- is_active BOOLEAN NOT NULL DEFAULT TRUE
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

---

## transactions

- id UUID PK
- transaction_number TEXT UNIQUE NOT NULL
- transaction_date DATE NOT NULL
- type ENUM/TEXT CHECK IN ('INCOME','EXPENSE','TRANSFER')
- source_account_id UUID NULL REFERENCES accounts
- destination_account_id UUID NULL REFERENCES accounts
- category_id UUID NULL REFERENCES categories
- amount BIGINT NOT NULL CHECK amount > 0
- description TEXT NOT NULL
- note TEXT NULL
- created_by UUID NOT NULL
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

Validation constraints:

INCOME:
- source_account_id IS NULL
- destination_account_id IS NOT NULL
- category_id references INCOME category

EXPENSE:
- source_account_id IS NOT NULL
- destination_account_id IS NULL
- category_id references EXPENSE category

TRANSFER:
- source_account_id IS NOT NULL
- destination_account_id IS NOT NULL
- source_account_id != destination_account_id
- category_id IS NULL

Enforce what can be enforced at database level and validate the remainder server-side.

---

## transaction_attachments

- id UUID PK
- transaction_id UUID NOT NULL REFERENCES transactions ON DELETE CASCADE
- file_name TEXT NOT NULL
- file_path TEXT NOT NULL
- mime_type TEXT NOT NULL
- file_size BIGINT
- uploaded_at TIMESTAMPTZ

---

## optional legacy_summary

Only if aggregate January–July data is needed.

- id UUID PK
- period_start DATE
- period_end DATE
- total_income BIGINT NULL
- total_expense BIGINT NULL
- closing_balance BIGINT NOT NULL
- note TEXT

Do not represent legacy summary as transactions.

---

# 27. BALANCE CALCULATION

Never store mutable current balance as the source of truth unless implemented as a carefully synchronized cache.

Source of truth:

`opening_balance + transaction ledger`

For account X:

```
balance =
opening_balance
+ sum(INCOME where destination_account = X)
- sum(EXPENSE where source_account = X)
+ sum(TRANSFER where destination_account = X)
- sum(TRANSFER where source_account = X)
```

Total system balance:

`sum(all active/inactive historical account balances as applicable)`

Do not exclude inactive historical accounts from financial truth simply because they are inactive.

---

# 28. PERIOD BALANCE CALCULATION

Monthly opening balance:

Balance at end of day immediately before selected month.

Monthly closing balance:

Balance at end of last day of selected month.

Do NOT depend on separately entered monthly opening balances.

August 2026 opening balance must equal:

`250406457`

---

# 29. FINANCIAL ATOMICITY

Critical operations must be atomic.

For every transaction:
1. Validate.
2. Confirm sufficient source balance if money leaves an account.
3. Create/update/delete ledger entry.
4. Attach evidence metadata.
5. Return success only after required financial operation succeeds.

Avoid UI states where a user sees success while database write failed.

Use database transactions/RPC/server transaction patterns where needed.

---

# 30. CONCURRENCY

Prevent race conditions.

Especially for:
- transaction number generation
- expense balance validation
- transfer balance validation

Do not generate unique transaction IDs only by "count existing rows + 1" on the client.

Use safe server/database sequencing or collision retry protected by unique constraint.

---

# 31. MONEY HANDLING

All Rupiah values:
- store as integer/bigint.
- never store monetary amounts as floating point.
- format only in presentation layer.

Display example:

`Rp238.957.146`

Input may accept:
`238957146`
or formatted Rupiah input.

Persist:
`238957146`

---

# 32. DATE HANDLING

Business timezone:
`Asia/Jakarta`

Store timestamps consistently.

Transaction date is a DATE representing local business date.

Do not accidentally shift transaction dates due to UTC conversion.

---

# 33. UI / UX DESIGN

Design direction:

- Light mode.
- Clean.
- Spacious.
- Professional.
- Financial admin dashboard.
- Calm neutral palette.
- High readability.
- Laptop-friendly.
- Responsive on tablet/mobile.

Avoid:
- excessive gradients
- glassmorphism everywhere
- overly animated cards
- huge hero sections
- decorative landing-page layout inside admin app

Typography:
- clear sans-serif.
- strong number hierarchy.

Use color semantically but accessibly:
- Income / positive
- Expense / negative
- Transfer / neutral
- Warning
- Error

Do not rely on color alone.

---

# 34. LOADING, EMPTY, ERROR STATES

Every data page must support:
- Loading state
- Empty state
- Error state

Examples:

Transaction empty:
`Belum ada transaksi pada periode ini.`

Report empty:
`Belum ada data transaksi untuk periode yang dipilih.`

Upload error:
`File gagal diunggah. Silakan coba kembali.`

Use actionable Indonesian messages.

---

# 35. DELETE CONFIRMATION

Deletion must never happen on one accidental click.

Use dialog:

`Hapus transaksi TRX-2608-0001?`

Show:
- description
- amount

Require explicit confirmation.

---

# 36. AUDIT-FRIENDLY DATA

Minimum:
- created_at
- updated_at
- created_by

Do not silently overwrite original creation metadata.

Optional future expansion:
- transaction audit_log table

Not required for this MVP unless easy to implement safely.

---

# 37. SECURITY

Minimum security requirements:

- Protected routes.
- Server-side authorization checks.
- Do not trust hidden form fields.
- Validate IDs and ownership/access server-side.
- Storage bucket should not expose unrestricted upload access.
- File type/size validation.
- Prevent path traversal.
- Use environment variables for secrets.
- Never expose service-role key to client.
- Enable appropriate RLS policies if using Supabase.
- Only authenticated app user(s) may access financial data.

---

# 38. SEED / INITIALIZATION

Create seed/bootstrap for:

## Accounts

AK01 — Bank Al-Misykat — 238957146
AK02 — Cash Pesantren — 25700
AK03 — Cash Yandi — 11423611

Opening date:
2026-07-31

## Income Categories

PM01 through PM16 exactly as listed.

## Expense Categories

PG01 through PG19 exactly as listed.

Seed must be idempotent or safe to run once.

Do not duplicate master data if re-run.

---

# 39. BUSINESS VALIDATION RULES

## All transactions

- date required
- type required
- amount > 0
- description required
- at least one evidence attachment required for newly created transactions
- user authenticated

## Income

- destination account required
- income category required
- source account null

## Expense

- source account required
- expense category required
- destination account null
- source account balance >= amount

## Transfer

- source required
- destination required
- source != destination
- category null
- source account balance >= amount

---

# 40. ACCEPTANCE TESTS

Do NOT mark the project complete until these tests pass.

---

## TEST 01 — Opening Balance

Input state:

Bank Al-Misykat:
238957146

Cash Pesantren:
25700

Cash Yandi:
11423611

Expected total:

250406457

Dashboard must display:

`Rp250.406.457`

No operational transactions exist yet.

---

## TEST 02 — Income

Create:

Type:
INCOME

Destination:
AK01 Bank Al-Misykat

Category:
PM01 Infaq/Shodaqoh Pesantren Berseri

Amount:
1000000

Expected:

Bank Al-Misykat:
239957146

Cash Pesantren:
25700

Cash Yandi:
11423611

Total:
251406457

Current period Income:
1000000

Current period Expense:
0

Net:
1000000

---

## TEST 03 — Transfer

After TEST 02 create:

Type:
TRANSFER

Source:
AK01 Bank Al-Misykat

Destination:
AK03 Cash Yandi

Amount:
10000000

Expected:

Bank:
229957146

Cash Pesantren:
25700

Cash Yandi:
21423611

Total:
251406457

Income:
1000000

Expense:
0

Net:
1000000

Transfer must not change total balance.

---

## TEST 04 — Expense

After TEST 03 create:

Type:
EXPENSE

Source:
AK03 Cash Yandi

Category:
PG11 Kebutuhan Dapur

Amount:
2000000

Expected:

Bank:
229957146

Cash Pesantren:
25700

Cash Yandi:
19423611

Total:
249406457

Income:
1000000

Expense:
2000000

Net:
-1000000

---

## TEST 05 — Insufficient Expense

Try:

Source:
AK02 Cash Pesantren

Expense:
1000000

Current Cash Pesantren balance:
25700

Expected:
- Request rejected.
- No transaction created.
- Balance unchanged.
- Clear error shown.

---

## TEST 06 — Invalid Transfer

Try transfer:

AK01 → AK01

Expected:
- Rejected.
- No transaction created.

---

## TEST 07 — Transfer Insufficient Balance

Try transfer:
AK02 → AK01
1000000

Expected:
- Rejected.
- No balance change.

---

## TEST 08 — Evidence Required

Try creating a new income transaction without evidence.

Expected:
- Submission rejected.
- Clear evidence-required validation message.

---

## TEST 09 — Unsupported File

Upload `.exe` as evidence.

Expected:
- Rejected.
- No stored file.
- Clear validation.

---

## TEST 10 — Transaction Number

Create multiple transactions in the same month.

Expected examples:
- TRX-2608-0001
- TRX-2608-0002
- TRX-2608-0003

No duplicates.

---

## TEST 11 — Edit Expense Amount

Edit TEST 04 expense:

From:
2000000

To:
1500000

Expected Cash Yandi:
19923611

Expected total:
249906457

Expected Expense:
1500000

Expected Net:
-500000

No manual balance adjustment.

---

## TEST 12 — Delete Expense

Delete edited expense.

Expected:

Cash Yandi:
21423611

Total:
251406457

Income:
1000000

Expense:
0

Net:
1000000

---

## TEST 13 — Delete Transfer

Delete TEST 03 transfer.

Expected:

Bank:
239957146

Cash Pesantren:
25700

Cash Yandi:
11423611

Total:
251406457

Income:
1000000

Expense:
0

---

## TEST 14 — Monthly Report

For month containing TEST 02 only after other test transactions are deleted:

Opening total:
250406457

Income:
1000000

Expense:
0

Closing:
251406457

Transfer impact:
0

---

## TEST 15 — Auth Protection

Open `/dashboard` without login.

Expected:
redirect to login.

Open `/transactions` without login.

Expected:
redirect to login.

---

## TEST 16 — Duplicate Submit Protection

Double-click Save during transaction creation.

Expected:
Only one transaction created.

---

# 41. TECHNICAL QUALITY GATES

Before completion run:

- lint
- type-check
- production build
- relevant automated tests
- database validation
- authentication validation
- storage upload validation

Fix all errors.

Do not ignore TypeScript errors.

Do not disable lint rules simply to make checks green unless justified.

No production page may depend on mock financial data.

---

# 42. DEFINITION OF DONE

The project is complete only when:

- Login works.
- Protected routes work.
- Dashboard uses database data.
- Opening balances are correct.
- Income works.
- Expense works.
- Transfer works.
- Transfer does not affect income/expense.
- Insufficient balance is blocked.
- Evidence upload works.
- Transaction detail works.
- Transaction edit works.
- Transaction evidence management works.
- Transaction delete works.
- Search/filter works.
- Monthly report works.
- Yearly report works.
- Account balances always reconcile.
- Settings work.
- Master accounts/categories seeded correctly.
- Excel export works.
- PDF export works.
- Responsive layout works.
- Empty/loading/error states exist.
- Lint passes.
- Type-check passes.
- Production build passes.
- Acceptance tests pass.

Do not announce completion with unfinished TODOs.

---

# 43. NON-GOALS FOR THIS VERSION

Do NOT implement unless explicitly requested later:

- Debt / accounts payable
- Receivables
- Budget planning
- Asset management
- Inventory
- Payroll module
- Accounting journal/debit-credit UI
- Multi-step approvals
- Multiple user roles
- WhatsApp integration
- Bank API integration
- OCR receipt reading
- Automatic bank statement import
- Tax reporting
- Mobile native app
- Dark mode
- Complex analytics
- AI features

Keep this release focused and reliable.

---

# 44. IMPLEMENTATION ORDER INSIDE THIS SINGLE STAGE

Although this is ONE stage, implement internally in this order:

1. Inspect existing project.
2. Configure database/auth/storage.
3. Create migrations/schema.
4. Create seed/master data.
5. Implement authentication and route protection.
6. Implement financial domain logic.
7. Implement transaction number generation.
8. Implement attachment upload.
9. Implement transaction CRUD.
10. Implement dashboard.
11. Implement reports.
12. Implement settings.
13. Implement exports.
14. Add UI states and validation.
15. Run acceptance tests.
16. Run lint/type-check/build.
17. Fix discovered defects.
18. Re-run all checks.
19. Only then mark completed.

Do not stop after each internal step asking for confirmation.

---

# 45. FINAL DELIVERY REQUIREMENT

At the end of implementation, provide a concise walkthrough containing:

- What was implemented
- Database tables/migrations created
- Required environment variables
- How to create/login to the initial admin user
- Where opening balances are configured
- How transaction evidence is stored
- How to run the app
- How to run tests
- Confirmation of lint/type-check/build status
- Acceptance test results
- Any known limitation, if one genuinely remains

If a requirement could not be implemented, state it explicitly instead of pretending it is done.
