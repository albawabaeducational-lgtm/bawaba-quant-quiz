-- المرحلة التالية: دور المعلم وصلاحيات الحسابات
-- إذا كانت staff_users قد أُنشئت من migration 001، نعيد بناء الجدول لتوسيع الأدوار.
PRAGMA foreign_keys=OFF;
CREATE TABLE IF NOT EXISTS staff_users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'supervisor' CHECK (role IN ('super_admin','content_manager','supervisor','teacher')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked')),
  created_at TEXT NOT NULL,
  last_seen TEXT
);
INSERT OR IGNORE INTO staff_users_new (id,name,username,password_hash,role,status,created_at,last_seen)
SELECT id,name,username,password_hash,role,status,created_at,last_seen FROM staff_users;
DROP TABLE IF EXISTS staff_users;
ALTER TABLE staff_users_new RENAME TO staff_users;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS staff_permissions (
  staff_id INTEGER PRIMARY KEY,
  can_manage_students INTEGER NOT NULL DEFAULT 0,
  can_manage_groups INTEGER NOT NULL DEFAULT 0,
  can_manage_content INTEGER NOT NULL DEFAULT 0,
  can_view_guests INTEGER NOT NULL DEFAULT 0,
  can_view_reports INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
