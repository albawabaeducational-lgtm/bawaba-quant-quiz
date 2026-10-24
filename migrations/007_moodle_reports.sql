-- الدخول بحساب منصة الدورات (مودل) + بلاغات الطلاب عن الأسئلة. تُنشأ تلقائيًا أيضًا.
CREATE TABLE IF NOT EXISTS moodle_links (moodle_id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL, username TEXT, courses TEXT, created_at TEXT NOT NULL, checked_at TEXT);
CREATE INDEX IF NOT EXISTS moodle_links_student ON moodle_links(student_id);
CREATE TABLE IF NOT EXISTS question_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, course TEXT NOT NULL, qkey TEXT, reason TEXT, note TEXT, student_id INTEGER, status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL, handled_by TEXT, handled_at TEXT);
CREATE INDEX IF NOT EXISTS question_reports_course ON question_reports(course,status);
