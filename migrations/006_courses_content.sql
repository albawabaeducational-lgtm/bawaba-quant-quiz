-- المقررات: إسناد المعلمين لكل اختبار وصلاحياتهم داخله، وتعديلات الأسئلة من «وضع التحرير».
-- كل هذه الجداول تُنشأ تلقائيًا أيضًا عند أول دخول للوحة التحكم.
CREATE TABLE IF NOT EXISTS course_staff (course TEXT NOT NULL, staff_id INTEGER NOT NULL, can_edit INTEGER NOT NULL DEFAULT 1, can_add INTEGER NOT NULL DEFAULT 0, can_delete INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, PRIMARY KEY (course, staff_id));
CREATE INDEX IF NOT EXISTS course_staff_staff ON course_staff(staff_id);
-- تعديل/إضافة/حذف لكل سؤال أو قسم أو قطعة. الملف الأصلي لا يتغير، والتعديلات تُطبَّق فوقه عند فتح الصفحة.
CREATE TABLE IF NOT EXISTS exam_patch (course TEXT NOT NULL, kind TEXT NOT NULL, key TEXT NOT NULL, data TEXT, deleted INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT, PRIMARY KEY (course, kind, key));
-- صور الأسئلة التي يرفعها المعلمون
CREATE TABLE IF NOT EXISTS exam_images (id INTEGER PRIMARY KEY AUTOINCREMENT, course TEXT NOT NULL, mime TEXT NOT NULL, data BLOB NOT NULL, created_at TEXT NOT NULL, created_by TEXT);
-- ذاكرة مؤقتة لأرقام الأسئلة الأصلية في كل ملف (للتحقق من الصلاحيات)
CREATE TABLE IF NOT EXISTS exam_base (course TEXT PRIMARY KEY, etag TEXT, data TEXT NOT NULL, updated_at TEXT NOT NULL);
