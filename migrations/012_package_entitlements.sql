-- Package entitlements and idempotent offline package-sale records.
-- Apply after 011_accounts_subscriptions.sql and before deploying the new API.
ALTER TABLE subscriptions ADD COLUMN package_id TEXT;
ALTER TABLE subscriptions ADD COLUMN package_name TEXT;
ALTER TABLE subscriptions ADD COLUMN package_access TEXT;
ALTER TABLE payments ADD COLUMN sale_key TEXT;
ALTER TABLE commissions ADD COLUMN sale_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS payments_sale_once ON payments(sale_key) WHERE sale_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS comm_sale_once ON commissions(sale_key) WHERE sale_key IS NOT NULL;
CREATE TABLE IF NOT EXISTS package_sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_key TEXT NOT NULL UNIQUE,
  student_id INTEGER NOT NULL,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  days INTEGER NOT NULL,
  rate_override REAL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS package_sales_student ON package_sales(student_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS package_sub_student_once ON subscriptions(student_id, package_id) WHERE package_id IS NOT NULL;
