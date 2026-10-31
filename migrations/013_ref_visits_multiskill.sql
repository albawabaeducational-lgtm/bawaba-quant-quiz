-- يُنشأ تلقائيًا أيضًا من الكود عند أول استخدام (لا حاجة لتشغيله يدويًا)
-- ١) زيارات الإحالة: رمز عشوائي لكل زائر فتح رابط مسوّق، بصلاحية محددة، يُستخدم مرة واحدة عند إنشاء الحساب
CREATE TABLE IF NOT EXISTS ref_visits (token TEXT PRIMARY KEY, referrer_id INTEGER NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, used_by INTEGER, used_at TEXT);
-- ٢) تصنيف السؤال بأكثر من مهارة (يُرحَّل إليه محتوى question_skills مرة واحدة تلقائيًا، ويبقى الجدول القديم نسخة احتياطية)
CREATE TABLE IF NOT EXISTS question_skill_links (course TEXT NOT NULL, qkey TEXT NOT NULL, skill_id INTEGER NOT NULL, by_name TEXT, updated_at TEXT NOT NULL, PRIMARY KEY (course, qkey, skill_id));
CREATE INDEX IF NOT EXISTS qsl_skill ON question_skill_links(skill_id);
