CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT, last_seen TEXT, kind TEXT NOT NULL DEFAULT 'single', max_devices INTEGER NOT NULL DEFAULT 2, expires_at TEXT, duration_minutes INTEGER, pause_used INTEGER NOT NULL DEFAULT 0, paused_at INTEGER, pause_until INTEGER);
CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, page TEXT NOT NULL, kind TEXT NOT NULL, sub TEXT, score INTEGER, correct INTEGER, total INTEGER, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS ev_student ON events(student_id, page);
CREATE TABLE IF NOT EXISTS usage (student_id INTEGER NOT NULL, page TEXT NOT NULL, day TEXT NOT NULL, seconds INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (student_id, page, day));
CREATE TABLE IF NOT EXISTS devices (student_id INTEGER NOT NULL, device TEXT NOT NULL, first_seen TEXT, last_seen TEXT, PRIMARY KEY (student_id, device));
CREATE TABLE IF NOT EXISTS login_fails (ip TEXT NOT NULL, at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS lf_ip ON login_fails(ip, at);
CREATE TABLE IF NOT EXISTS trials (fp TEXT PRIMARY KEY, ip TEXT, ua TEXT, started_at INTEGER NOT NULL, strikes INTEGER NOT NULL DEFAULT 0, last_at INTEGER);
CREATE TABLE IF NOT EXISTS ip_bans (ip TEXT PRIMARY KEY, until TEXT NOT NULL, at TEXT);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
INSERT OR IGNORE INTO settings (key, value) VALUES ('require_login', '0');
INSERT OR IGNORE INTO settings (key, value) VALUES ('trial_minutes', '0');
INSERT OR IGNORE INTO settings (key, value) VALUES ('contact', '966556992385');
INSERT OR IGNORE INTO settings (key, value) VALUES ('trial_guard', '1');
INSERT OR IGNORE INTO settings (key, value) VALUES ('plans', '[{"name":"اشتراك شهري","days":30,"price":50},{"name":"٣ شهور","days":90,"price":100},{"name":"٦ شهور","days":180,"price":150}]');

-- حسابات العاملين والجلسات وسجل العمليات
CREATE TABLE IF NOT EXISTS staff_users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'supervisor' CHECK (role IN ('super_admin','content_manager','supervisor')), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked')), created_at TEXT NOT NULL, last_seen TEXT);
CREATE TABLE IF NOT EXISTS staff_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id INTEGER NOT NULL, token_hash TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, FOREIGN KEY (staff_id) REFERENCES staff_users(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS staff_sessions_token ON staff_sessions(token_hash);
CREATE INDEX IF NOT EXISTS staff_sessions_expiry ON staff_sessions(expires_at);
CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, actor_type TEXT NOT NULL, actor_id INTEGER, actor_name TEXT, action TEXT NOT NULL, target_type TEXT, target_id INTEGER, details TEXT, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS audit_log_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS audit_log_actor ON audit_log(actor_type, actor_id);


-- مجموعات الطلاب
CREATE TABLE IF NOT EXISTS student_groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS group_members (group_id INTEGER NOT NULL, student_id INTEGER NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (group_id, student_id), FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE, FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS group_pages (group_id INTEGER NOT NULL, page TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (group_id, page), FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS group_members_student ON group_members(student_id);
CREATE INDEX IF NOT EXISTS group_pages_page ON group_pages(page);

CREATE TABLE IF NOT EXISTS staff_permissions (staff_id INTEGER PRIMARY KEY, can_manage_students INTEGER NOT NULL DEFAULT 0, can_manage_groups INTEGER NOT NULL DEFAULT 0, can_manage_content INTEGER NOT NULL DEFAULT 0, can_view_guests INTEGER NOT NULL DEFAULT 0, can_view_reports INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS guest_leads (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'website', interest TEXT, status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL, last_contacted_at TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS guest_leads_phone ON guest_leads(phone);
CREATE INDEX IF NOT EXISTS guest_leads_created ON guest_leads(created_at);
