-- المرحلة الثانية: مجموعات الطلاب وربط الطلاب بها
CREATE TABLE IF NOT EXISTS student_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (group_id, student_id),
  FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_pages (
  group_id INTEGER NOT NULL,
  page TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (group_id, page),
  FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS group_members_student ON group_members(student_id);
CREATE INDEX IF NOT EXISTS group_pages_page ON group_pages(page);
