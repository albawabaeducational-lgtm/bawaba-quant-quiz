ارفع هذه الملفات (تحديث 2.1 — المقررات ووضع التحرير) مع الحفاظ على المسارات:

functions/api/[[path]].js
functions/_middleware.js
admin.html
bw-content.js              ← جديد
bw-editor.js               ← جديد
_routes.json
aksam kamy.html
aksam lafzi.html
muhaky mohawsab.html.html
muhaky warky1.html
muhaky warky2.html
tasis lafzi.html.html
schema.sql
migrations/006_courses_content.sql   ← جديد
CHANGELOG.md
UPLOAD-ORDER.md

لا تحتاج تشغيل SQL يدويًا؛ الجداول الجديدة تُنشأ تلقائيًا عند أول دخول للوحة التحكم.

بعد النشر:
1. ادخل /admin بحساب الإدارة ← قسم «المقررات».
2. أضف كل معلم للمقرر الخاص به وحدد: تعديل / إضافة / حذف.
3. المعلم يدخل /admin بحسابه، ثم يفتح المقرر من «المقررات» ← «وضع التحرير».

ملاحظة: لو عدّلت ملف اختبار يدويًا ورفعته، تعديلات المعلمين تظل مطبّقة فوقه (حسب رقم السؤال).
