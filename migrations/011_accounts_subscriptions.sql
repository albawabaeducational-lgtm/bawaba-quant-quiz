-- حسابات الطلاب (تسجيل ذاتي) + الاشتراك لكل قسم + طلبات التجديد + المدفوعات اليدوية
-- (تُنشأ تلقائيًا أيضًا عند أول استخدام من الخادم)
CREATE TABLE IF NOT EXISTS accounts (student_id INTEGER PRIMARY KEY, email TEXT UNIQUE, phone TEXT UNIQUE, pass_hash TEXT NOT NULL, show_counter INTEGER NOT NULL DEFAULT 1, ref_code TEXT UNIQUE, ref_by INTEGER, created_at TEXT NOT NULL, marketer INTEGER NOT NULL DEFAULT 0, ref_rate REAL);
CREATE TABLE IF NOT EXISTS subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, course TEXT NOT NULL, start_at TEXT NOT NULL, end_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT, note TEXT);
CREATE INDEX IF NOT EXISTS subs_student ON subscriptions(student_id, status);
CREATE INDEX IF NOT EXISTS subs_course ON subscriptions(course, status);
CREATE TABLE IF NOT EXISTS renewal_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, course TEXT NOT NULL, days INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, handled_by TEXT, handled_at TEXT, note TEXT);
CREATE INDEX IF NOT EXISTS renew_status ON renewal_requests(status, created_at);
CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, course TEXT, amount REAL NOT NULL DEFAULT 0, note TEXT, created_by TEXT, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS payments_student ON payments(student_id);
-- الإحالة والعمولات
CREATE TABLE IF NOT EXISTS commissions (id INTEGER PRIMARY KEY AUTOINCREMENT, referrer_id INTEGER NOT NULL, referred_id INTEGER NOT NULL, payment_id INTEGER, course TEXT, base_amount REAL NOT NULL DEFAULT 0, rate REAL NOT NULL DEFAULT 0, amount REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, available_at TEXT, paid_at TEXT, paid_by TEXT, note TEXT);
CREATE INDEX IF NOT EXISTS comm_ref ON commissions(referrer_id, status);
