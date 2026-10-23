# الملفات المعدلة فقط

ارفع الملفات مع الحفاظ على المسارات كما هي داخل الريبو:

- `admin.html`
- `index.html`
- `login.html`
- `bw-ui.js`
- `schema.sql`
- `functions/api/[[path]].js`
- `migrations/001_staff_roles.sql`
- `migrations/002_student_groups.sql`
- `migrations/003_teacher_permissions.sql`
- `migrations/004_guest_leads.sql`

لا ترفع مجلد الحزمة بدل المشروع كاملًا؛ انسخ الملفات فوق الملفات التي تحمل الأسماء نفسها، وأنشئ مجلد `migrations` إذا لم يكن موجودًا.

بعد الرفع اعمل Commit ثم Push، وانتظر نشر Cloudflare Pages.

رسالة واتساب التي تم ضبطها:

السلام عليكم ورحمة الله وبركاته
كيف أقدر أنضم لمنصة الاختبارات في البوابة التعليمية

ملاحظة: `functions/api/[[path]].js` و`schema.sql` ملفات Backend مشتركة، وليست صفحات اختبارات، لكنها ضرورية لتشغيل الصلاحيات ومجموعات الطلاب والضيوف.
