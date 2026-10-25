-- بنك الأسئلة الموحد (يُنشأ تلقائيًا أيضًا عند أول فتح لقسم «بنك الأسئلة»)
CREATE TABLE IF NOT EXISTS qbank (id INTEGER PRIMARY KEY AUTOINCREMENT, subject TEXT NOT NULL, skill_id INTEGER, difficulty INTEGER NOT NULL DEFAULT 0, source TEXT, stem TEXT, passage TEXT, image_id INTEGER, image_url TEXT, options TEXT NOT NULL, correct TEXT NOT NULL, multi INTEGER NOT NULL DEFAULT 0, explanation TEXT, status TEXT NOT NULL DEFAULT 'active', hash TEXT, ext_ref TEXT, created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS qbank_ext ON qbank(ext_ref);
CREATE INDEX IF NOT EXISTS qbank_subject ON qbank(subject,status);
CREATE INDEX IF NOT EXISTS qbank_skill ON qbank(skill_id);
CREATE INDEX IF NOT EXISTS qbank_hash ON qbank(hash);
