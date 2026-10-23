ارفع الملفات مع الحفاظ على المسارات:

admin.html
index.html
login.html
bw-ui.js
schema.sql
functions/api/[[path]].js
migrations/001_staff_roles.sql
migrations/002_student_groups.sql
migrations/003_teacher_permissions.sql
migrations/004_guest_leads.sql

الإصلاحات الأخيرة:
- إصلاح خطأ PBKDF2 في Cloudflare بتخفيض عدد الدورات إلى 100000، وهو الحد المدعوم.
- جعل صلاحيات حساب المعلم في صف مستقل بعرض كامل حتى لا تختفي خلف القائمة الجانبية.
