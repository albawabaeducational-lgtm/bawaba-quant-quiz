-- تصنيف الأسئلة حسب المهارات (يُنشأ تلقائيًا أيضًا عند أول استخدام، مع قائمة مهارات مبدئية)
CREATE TABLE IF NOT EXISTS skills (id INTEGER PRIMARY KEY AUTOINCREMENT, subject TEXT NOT NULL, name TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS question_skills (course TEXT NOT NULL, qkey TEXT NOT NULL, skill_id INTEGER NOT NULL, by_name TEXT, updated_at TEXT NOT NULL, PRIMARY KEY (course, qkey));
CREATE INDEX IF NOT EXISTS question_skills_skill ON question_skills(skill_id);
