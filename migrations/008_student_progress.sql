-- حفظ تقدم الطالب في حسابه (مزامنة بين الأجهزة). يُنشأ تلقائيًا أيضًا عند أول استخدام.
CREATE TABLE IF NOT EXISTS student_progress (student_id INTEGER NOT NULL, key TEXT NOT NULL, data TEXT NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY (student_id, key));
