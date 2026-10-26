const J = (o, s = 200, h = {}) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...h } });
const ck = (req, n) => { const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; };
const norm = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const tok = async env => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bw|' + env.ADMIN_PASSWORD)))].map(x => x.toString(16).padStart(2, '0')).join('');
const newCode = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (const x of crypto.getRandomValues(new Uint8Array(8))) s += a[x % a.length]; return s; };
const COOKIE = 'Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax';
const STAFF_COOKIE = 'Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Strict';
const TRIALS = [0, 120, 720, 1440, 2880, 10080, 14400, 43200];
const DEF_PLANS = [{ name: 'اشتراك شهري', days: 30, price: 50 }, { name: '٣ شهور', days: 90, price: 100 }, { name: '٦ شهور', days: 180, price: 150 }];
const plansOf = v => { try { const a = JSON.parse(v); if (Array.isArray(a) && a.length) return a; } catch (e) { } return DEF_PLANS; };
const phone = v => { let d = String(v || '').replace(/[٠-٩]/g, x => '٠١٢٣٤٥٦٧٨٩'.indexOf(x)).replace(/\D/g, ''); if (d.startsWith('00')) d = d.slice(2); if (d.startsWith('0') && d.length === 10) d = '966' + d.slice(1); else if (d.startsWith('5') && d.length === 9) d = '966' + d; return d.slice(0, 20); };
const pauseLeft = s => Math.max(0, Math.floor((s.duration_minutes || 0) * 0.10) - (s.pause_used || 0));
const fmtMin = m => m >= 1440 ? Math.floor(m / 1440) + ' يوم' + (m % 1440 >= 60 ? ' و' + Math.floor(m % 1440 / 60) + ' ساعة' : '') : Math.floor(m / 60) + ' ساعة';
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const passwordHash = async (password, salt = crypto.randomUUID()) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
  return `v1$${salt}$${b64(bits)}`;
};
const safeEq = (a, b) => { a = String(a); b = String(b); if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
const passwordMatches = async (password, stored) => {
  const [version, salt, expected] = String(stored || '').split('$');
  if (version !== 'v1' || !salt || !expected) return false;
  return safeEq(await passwordHash(password, salt), stored);
};

// ===================== كتالوج الصلاحيات =====================
// كل صلاحية تُفرض هنا في الخادم. الواجهة تُخفي أي قسم لا يملك الحساب صلاحيته، والخادم لا يرسل بياناته أصلًا.
const PERM_GROUPS = [
  { key: 'reports', title: 'لوحة المؤشرات والتقارير', items: [
    ['dashboard.view', 'عرض لوحة المؤشرات والنشاط المباشر'],
    ['reports.view', 'عرض النتائج وتقارير الأقسام وآخر الأنشطة'],
    ['reports.export', 'تصدير بيانات الطلاب (Excel / CSV)']] },
  { key: 'students', title: 'الطلاب والأكواد', items: [
    ['students.view', 'عرض قائمة الطلاب'],
    ['students.codes', 'رؤية أكواد الطلاب كاملة'],
    ['students.create', 'إضافة أكواد جديدة'],
    ['students.edit', 'تعديل الاسم والتمديد والأجهزة والاستراحة'],
    ['students.block', 'حظر الأكواد وتفعيلها'],
    ['students.delete', 'حذف الأكواد ونتائجها نهائيًا'],
    ['students.message', 'إرسال رسالة واتساب للطالب بكوده']] },
  { key: 'groups', title: 'مجموعات الطلاب', items: [
    ['groups.view', 'عرض المجموعات وأعضائها'],
    ['groups.manage', 'إنشاء المجموعات وتعديلها وإضافة الطلاب وإزالتهم'],
    ['groups.delete', 'حذف المجموعات']] },
  { key: 'leads', title: 'الضيوف والمهتمون', items: [
    ['leads.view', 'عرض المهتمين وأرقام الواتساب'],
    ['leads.manage', 'التواصل مع المهتمين وتغيير حالتهم'],
    ['leads.delete', 'حذف المهتمين']] },
  { key: 'settings', title: 'إعدادات المنصة', items: [
    ['settings.access', 'نمط الدخول ومدة التجربة المجانية'],
    ['settings.plans', 'باقات الاشتراك والأسعار'],
    ['settings.contact', 'رقم واتساب المنصة ورسالة المهتمين'],
    ['settings.guard', 'حماية التجربة المجانية ورفع الحظر']] },
  { key: 'bank', title: 'بنك الأسئلة', items: [
    ['bank.view', 'عرض بنك الأسئلة'],
    ['bank.edit', 'تعديل الأسئلة وتصنيفها'],
    ['bank.import', 'إضافة واستيراد الأسئلة (مودل، صور، إكسيل، نص)'],
    ['bank.delete', 'حذف الأسئلة من البنك']] },
  { key: 'audit', title: 'الرقابة', items: [
    ['audit.view', 'عرض سجل العمليات']] }
];
const ALL_PERMS = PERM_GROUPS.flatMap(g => g.items.map(x => x[0]));
// أي صلاحية فرعية تتطلب صلاحية العرض الخاصة بقسمها
const PERM_NEEDS = {
  'bank.edit': ['bank.view'], 'bank.import': ['bank.view'], 'bank.delete': ['bank.view'],
  'students.codes': ['students.view'], 'students.create': ['students.view'], 'students.edit': ['students.view'], 'students.block': ['students.view'], 'students.delete': ['students.view'], 'students.message': ['students.view', 'students.codes'],
  'reports.view': ['students.view'], 'reports.export': ['students.view'], 'groups.manage': ['groups.view', 'students.view'], 'groups.delete': ['groups.view'], 'leads.manage': ['leads.view'], 'leads.delete': ['leads.view']
};
const ROLES = {
  super_admin: { label: 'الإدارة العامة', perms: ALL_PERMS },
  supervisor: { label: 'مشرف', perms: ['dashboard.view', 'reports.view', 'reports.export', 'students.view', 'students.codes', 'students.create', 'students.edit', 'students.block', 'students.message', 'groups.view', 'groups.manage', 'leads.view', 'leads.manage'] },
  teacher: { label: 'معلم', perms: [] }, // المعلم يعمل داخل المقررات المسندة له فقط (تحرير الأسئلة + تقارير المقرر)
  content_manager: { label: 'مدير المحتوى', perms: ['dashboard.view', 'reports.view', 'settings.access', 'settings.plans', 'bank.view', 'bank.edit', 'bank.import'] }
};
const cleanPerms = list => {
  const set = new Set((Array.isArray(list) ? list : []).filter(x => ALL_PERMS.includes(x)));
  for (const k of [...set]) for (const n of (PERM_NEEDS[k] || [])) set.add(n);
  return ALL_PERMS.filter(x => set.has(x));
};
// تحويل الصلاحيات القديمة (٥ أعمدة) إلى الصلاحيات التفصيلية الجديدة
const LEGACY_MAP = {
  can_manage_students: ['students.view', 'students.codes', 'students.create', 'students.edit', 'students.block', 'students.delete', 'students.message', 'reports.export', 'settings.guard'],
  can_manage_groups: ['groups.view', 'groups.manage', 'groups.delete'],
  can_manage_content: ['settings.access', 'settings.plans', 'settings.contact'],
  can_view_guests: ['leads.view', 'leads.manage'],
  can_view_reports: ['dashboard.view', 'reports.view', 'students.view']
};
const DEFAULT_LEAD_MSG = `باقات الدورات التعليمية

*باقة القدرات الكمية واللفظية الشاملة، 350 ريالًا لفترة محدودة*
تشمل التأسيس الكامل للقسمين الكمي واللفظي، وشرح نماذج الاختبار المحوسب، وملفات الأسئلة الأكثر تكرارًا، وسلسلة الاختبارات المحاكية.

*باقة القدرات الكمية، 200 ريال*
تشمل التأسيس الكمي كاملًا، وشرح الأقسام المحوسبة الكمية، وباقة الاختبارات المحاكية كاملة.

*باقة القدرات اللفظية، 200 ريال*
تشمل التأسيس اللفظي كاملًا، وشرح الأقسام المحوسبة اللفظية، وباقة الاختبارات المحاكية كاملة.

*باقة الاستعداد لاختبار القدرات الورقي، 200 ريال*
تشمل 48 حصة مباشرة، بواقع أربعة أيام أسبوعيًا، مع التأسيس في القسمين، وحل تجميعات السنوات الخمس الماضية، والمراجعة المكثفة خلال أيام الاختبارات، وباقة الاختبارات المحاكية للقدرات الورقي.`;
const LEAD_STATUS = ['new', 'contacted', 'added', 'subscribed', 'not_interested'];

// ===================== المقررات (الاختبارات) =====================
// model: bank = بنك أسئلة بأقسام (JSON داخل الصفحة) · raw = مصفوفة أسئلة نصية · key = مفتاح إجابات لاختبار ورقي مصوّر
// نفس القائمة موجودة في functions/_middleware.js — أي مقرر جديد يُضاف في الملفين.
const COURSES = [
  { slug: 'aksam kamy', title: 'أقسام الكمي', file: '/aksam kamy.html', model: 'bank', img: true, hints: true },
  { slug: 'aksam lafzi', title: 'أقسام اللفظي', file: '/aksam lafzi.html', model: 'bank' },
  { slug: 'muhaky mohawsab', title: 'المحاكي المحوسب', file: '/muhaky mohawsab.html.html', model: 'linked', link: ['aksam lafzi', 'aksam kamy'] }, // يُبنى تلقائيًا من الكمي واللفظي
  { slug: 'muhaky warky1', title: 'المحاكي الورقي – النموذج الأول', file: '/muhaky warky1.html', model: 'key' },
  { slug: 'muhaky warky2', title: 'المحاكي الورقي – النموذج الثاني', file: '/muhaky warky2.html', model: 'key' },
  { slug: 'tasis lafzi', title: 'تأسيس اللفظي', file: '/tasis lafzi.html.html', model: 'raw' },
  { slug: 'aktar kamy', title: 'الأسئلة الأكثر تكرارًا – كمي', file: '/aktar kamy.html', model: 'static' } // بنك صور: تصنيف المهارات والتقارير فقط
];
const COURSE = Object.fromEntries(COURSES.map(c => [c.slug, c]));
const KINDS = { bank: ['q', 's', 'p', 'o'], raw: ['r'], key: ['k'], linked: [], static: ['ak', 'ah', 'ai', 'ax'] };
// @@REVIEW_SEED@@ (يُولَّد تلقائيًا: أسئلة يُشك في مفتاح إجابتها)
const REVIEW_SEED = {"aksam kamy": {"12": "مجموع ٣ أعداد متتالية = ١٨ → الأصغر ٥ (أ) لكن المفتاح د", "59": "جدول الساق والأوراق: عدد طلاب ٣/١ لا يطابق ٢٠ (المفتاح د)", "72": "مجموع زوايا المثلث ١٨٠ والمربع ٣٦٠ → القيمة الثانية أكبر (ب) لكن المفتاح د", "274": "الأوراق ٥ و١٠ و١٠ و٢٠ → المبالغ مضاعفات ٥، والاختيار ١٠ (ج) ممكن لكن المفتاح ب (٩)", "357": "الزاويتان متقابلتان أو متجاورتان، وفي الحالتين س لا تعطي قيمتين متساويتين (المفتاح ج)", "477": "الناتج تقريبًا ٢٧٠ وأقرب اختيار ٢٤٠ (د) لكن المفتاح أ (٣٦٠)", "498": "لو الجذر تربيعي فالناتج ١٦ (د) والمفتاح أ (٤) — راجع دليل الجذر في الصورة", "504": "تكرار العدد ٣ هو ٢ من ٢٠ أي ٠٫١ (د) لكن المفتاح ب", "549": "تحت ٣٠٠٠ شركتان (أو ثلاث) لكن المفتاح أ (١)", "560": "الفرق بين عددي ١٤٣٤ و ١٤٣٥ يبدو ٧٠ (ج) لكن المفتاح أ (٩٠)", "577": "بالتعويض ص = ٢س القيمتان متساويتان دائمًا (ج) لكن المفتاح د", "578": "الشرط يحدد أن س و ص موجبان، فالمقارنة محددة (ليست د) — راجع اتجاه العلامة", "599": "س موجبة فالقيمتان متساويتان (ج) لكن المفتاح د", "691": "الضلعان عند ص يوازيان ضلعي الزاوية ١٠٠، فالمتوقع ١٠٠ (ب) لكن المفتاح د (٣٦٠)", "703": "قطاع الألعاب ١٥٠ وهو الأكبر (ج) لكن المفتاح أ (إكسسوارات)", "868": "نفس السؤال ٨٦٧ والإجابة ٥٫٩ (ج) لكن المفتاح د (٨)", "943": "مساحة المثلث ٣ س تربيع ناقص المربع س تربيع = ٢ س تربيع (ب) لكن المفتاح د", "1077": "لا يوجد نوع عدده أكبر من ٢٠ (البرونزية ١٨)، والمفتاح ج", "1079": "الناتج ٥ جذر ٣ على ٩ (ب) لكن المفتاح د", "1083": "كل كسر ثلاثة أرباع فالمجموع تسعة أرباع (ج) لكن المفتاح أ", "1087": "٣ سم × ٤٠٠ = ١٢ مترًا (ب) لكن المفتاح ج (١٦)", "1088": "أحرف ١ و ٢ و ٣: الفرق ٢٧ − ١ = ٢٦ (ج) لكن المفتاح ب (٧)", "1121": "٢س + ١ = ٩ تعطي س = ٤ وليست ضمن الاختيارات (المفتاح ب ٦)", "1138": "ثلاثة أثمان المبلغ = ٣٠ فالمبلغ ٨٠ (ج) لكن المفتاح ب (٧٤)", "1142": "ارتفاع المثلث ٢ فمساحة المستطيل ٥ × ٢ = ١٠ (ب) لكن المفتاح أ (١٥)", "1147": "الصياغة غامضة (أربعة أخماس العدد = ٢ والسؤال عن أربعة أخماسه)، المفتاح ب (٣)", "1158": "٦٣ × (١٠٠ على ٣) تربيع × (١٠٠ على ٧) = مليون (ب) لكن المفتاح ج", "1182": "بقي ٥ ثم اشترى ٣ فالناتج ٨ وليس ضمن الاختيارات (المفتاح ج ١٣)", "1192": "النمط غير واضح؛ المفتاح ب (٤٥)"}, "aktar kamy": {"307": "س = ستة وثلاثون على ٢٥ و ص مقلوبها، فحاصل الضرب ١ (ج) لكن المفتاح أ", "379": "المكيف ١٠٠٠ − الثلاجة والغسالة ٩٥٠ − الثلاجة، فالمكيف أكبر (أ) لكن المفتاح ب", "432": "كل التعبيرات ممكنة بحسب الحدود المكتوبة (حاصل الضرب بين ٦ و ٤٢) — راجع نص الحدود والمفتاح ب", "509": "لو الشرط ١ على ٣ أس (ن − ٢) أكبر من ١ على ٢٧ فـ ن أقل من ٥ ولا يمكن المقارنة بـ سالب ١ (د) والمفتاح أ — راجع اتجاه العلامة", "781": "نفس سؤال ٥٠٩ لكن المفتاح مختلف (ب هنا و أ هناك)", "988": "إجابة المفتاح ٩٧٦ لا تطابق الحساب المباشر (نصف السائحين نزل ونصفهم ركب)", "1058": "المحيط متساوٍ فضلع المربع (المحيط على ٤) أكبر دائمًا من ضلع الخماسي، والمفتاح د", "1066": "بمساواة الضلعين ٢س − ١ = س + ٥ يكون المحيط ٣٣ لا ٤٢، والمفتاح ج (راجع قراءة الشكل)", "1099": "بقراءة مباشرة قيمة الحدث ٥٠ وسعر ٥٥ تذكرة أقل منها، والمفتاح أ (صياغة غامضة)", "1156": "أحد عشر عددًا مجموعها ٤٤ لا يعطي أيًا من الخيارات بشكل واضح؛ النص يحتاج مراجعة", "1268": "٣٦٪ من ٥٠ = ١٨ فلا يوجد نوع يزيد على ٢٠ ميدالية، والمفتاح أ", "1331": "(−٢)(٦) + (−١٦)÷(−١٦) − (−٣٢) = ٢١ (الخيار أ)، والمفتاح ج (−٤٣) يفترض طرح ٣٢ موجبة", "1338": "بقراءة الشكل (مماس ١٠ ونصف قطر ٦) لا تخرج س = ٢؛ راجع الأرقام", "1392": "٤س + ٦ص = ٣٦٠ لا تحدد س + ص بدون معطى إضافي", "1430": "الطول ضعف العرض فالمحيط ٦ × العرض = ١٢س² + ٣٠س + ٤٢، والمفتاح أ يساوي نصفه", "1436": "بنصف قطر ١٫٥ وزاوية ١٢٠ تكون المساحة ٠٫٧٥ط، وهي ليست بين الخيارات", "1445": "بالتناسب من الجدول ٣٤٠ سعرة تقابل نحو ٩٧ كم، والمفتاح ج (٨٥)"}};
// @@END_REVIEW_SEED@@

const LETTERS = ['أ', 'ب', 'ج', 'د'];
const txt = (v, n) => String(v == null ? '' : v).replace(/\r/g, '').slice(0, n);
const int = v => { const n = Math.trunc(+v); return Number.isFinite(n) ? n : NaN; };
// يستخرج من الملف الأصلي المرفوع على الموقع أرقام الأسئلة الموجودة (للتحقق من نوع العملية: تعديل أم إضافة)
const extractBase = (course, html) => {
  if (course.model === 'bank') {
    const a = html.indexOf('<script id="db" type="application/json">'), b = html.indexOf('</script>', a);
    const d = JSON.parse(html.slice(a + 40, b));
    return { q: d.qs.map(x => x[0]), s: d.secs.map(x => x.id), p: (d.ps || []).length, qq: (d.qq || []).map(x => x[0]) };
  }
  if (course.model === 'static') {
    const a = html.indexOf('<script id="db" type="application/json">'), b = html.indexOf('</script>', a);
    return { q: JSON.parse(html.slice(a + 40, b)).qs.map(x => x[0]) };
  }
  if (course.model === 'raw') {
    const a = html.indexOf('const RAW = '), b = html.indexOf('\n', a);
    return { n: JSON.parse(html.slice(a + 12, b).trim().replace(/;$/, '')).length };
  }
  const i = html.indexOf('KEY='), m = i >= 0 ? /"([^"]*)"/.exec(html.slice(i, i + 2000)) : null;
  return { n: m ? [...m[1]].length : 0 };
};

let schemaReady = false, leadsReady = false, moodleReady = false;
// معرّف تطبيق جوجل (ليس سرًا) — يمكن تغييره من لوحة التحكم
const GOOGLE_CLIENT_ID = '1017687433947-oscl9bci17amtnqp8hlrgogk1p29ub23.apps.googleusercontent.com';
const MOODLE_URL = 'https://albawaba-edu.com/e';
// مفاتيح التقدم التي تُحفظ على الخادم لكل طالب (نفس مفاتيح صفحات الاختبارات في المتصفح)
const SYNC_KEYS = ['bw-stats-v1', 'quant-quiz-errors-v1', 'bw-sim-v1', 'bw-sel-v1', 'bwq-seen', 'bwv-stats-v1', 'verbal-quiz-errors-v1', 'bwv-sim-v1', 'bwv-sel-v1', 'bwm-sim-v1', 'bwm-seen', 'tanazur.best', 'tanazur.prefs', 'bawaba_folder_v1_e1', 'bawaba_folder_v1_e2', 'bw-place-v1', 'bw-why-v1', 'bwmt-seen', 'bwmt-errors', 'bwmt-hist', 'bw-goal-v1', 'bw-skill-v1', 'bw-rank-off'];
let progressReady = false;
const ensureProgressSchema = async DB => { if (progressReady) return; await DB.prepare('CREATE TABLE IF NOT EXISTS student_progress (student_id INTEGER NOT NULL, key TEXT NOT NULL, data TEXT NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY (student_id, key))').run(); progressReady = true; };
const ensureMoodleSchema = async DB => {
  if (moodleReady) return;
  await DB.batch([
    DB.prepare('CREATE TABLE IF NOT EXISTS moodle_links (moodle_id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL, username TEXT, courses TEXT, created_at TEXT NOT NULL, checked_at TEXT)'),
    DB.prepare('CREATE INDEX IF NOT EXISTS moodle_links_student ON moodle_links(student_id)'),
    DB.prepare('CREATE TABLE IF NOT EXISTS question_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, course TEXT NOT NULL, qkey TEXT, reason TEXT, note TEXT, student_id INTEGER, status TEXT NOT NULL DEFAULT \'open\', created_at TEXT NOT NULL, handled_by TEXT, handled_at TEXT)'),
    DB.prepare('CREATE INDEX IF NOT EXISTS question_reports_course ON question_reports(course,status)')
  ]);
  moodleReady = true;
};
const fetchAsset = async (env, request, file) => {
  if (!env.ASSETS) return null;
  let url = new URL(file.split('/').map(encodeURIComponent).join('/'), request.url), res = null;
  for (let i = 0; i < 4; i++) {
    res = await env.ASSETS.fetch(new Request(url.toString(), { headers: { accept: 'text/html' } }));
    const loc = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && loc) { url = new URL(loc, url); continue; }
    break;
  }
  return res && res.ok ? res : null;
};
// ---------- تصنيف الأسئلة حسب المهارات ----------
// البنوك التي يمكن تصنيف أسئلتها، ومادة كل بنك (كمي/لفظي)
// النسخة المجانية: حذف أسئلة الأجزاء المقفولة (نفس الدالة في functions/_middleware.js)
function freeDb(text, n, kind) {
  const d = JSON.parse(text);
  const cut = (arr, i) => { const k = new Set([...new Set(arr.map(a => a[i]))].sort((a, b) => a - b).slice(0, n)); return arr.filter(a => k.has(a[i])); };
  if (kind === 'aktar') { if (Array.isArray(d.qs)) d.qs = d.qs.slice(0, n * 5); }
  else {
    if (Array.isArray(d.qs)) d.qs = cut(d.qs, 1);
    if (Array.isArray(d.qq)) { d.qq = cut(d.qq, 1); if (d.qh) { const k = new Set(d.qq.map(a => String(a[0]))); for (const x of Object.keys(d.qh)) if (!k.has(x)) delete d.qh[x]; } }
    if (Array.isArray(d.ps) && Array.isArray(d.qs)) { const u = new Set(d.qs.map(a => a[3])); d.ps = d.ps.map((x, i) => u.has(i) ? x : ''); }
  }
  return JSON.stringify(d).replace(/</g, '\\u003c');
}
// الاختبارات التي يمكن إخفاؤها عن الطلاب من لوحة التحكم
const VIS = [['muhaky mohawsab', 'المحاكي المحوسب'], ['tasis lafzi', 'تأسيس اللفظي'], ['aksam kamy', 'أقسام الكمي'], ['aksam lafzi', 'أقسام اللفظي'], ['aktar kamy', 'الأسئلة الأكثر تكرارًا – كمي'], ['skills', 'التدريب حسب المهارة'], ['waraqi', 'المحاكي الورقي (النموذجان)'], ['placement', 'اختبار تحديد المستوى']];
const hiddenOf = v => { try { const a = JSON.parse(v || '[]'); return Array.isArray(a) ? a.filter(k => VIS.some(x => x[0] === k)) : []; } catch (e) { return []; } };
const SKILL_BANKS = { 'aksam kamy': 'kamy', 'aktar kamy': 'kamy', 'aksam lafzi': 'lafzi' };
const SUBJECTS = { kamy: 'الكمي', lafzi: 'اللفظي' };
const SEED_SKILLS = {
  kamy: ['المهارات الأساسية والعمليات الذهنية', 'جمع وطرح الأعداد', 'الضرب والقسمة (مهارة ضرب الآحاد)', 'عدد المئات – الخمسينات – العشرات', 'الأعداد الفردية والزوجية', 'القيمة المطلقة', 'مفهوم الكسور الاعتيادية والكسور العشرية', 'الكسور', 'الكسور العشرية', 'جمع وطرح الكسور العشرية', 'ضرب الكسور العشرية', 'قسمة الكسور العشرية', 'العمليات على الكسور الاعتيادية', 'تقريب ومقارنة الكسور', 'الربط بين الكسور العشرية والاعتيادية والنسب المئوية', 'قابلية القسمة', 'المضاعفات المشتركة – المضاعف المشترك الأصغر', 'القواسم المشتركة – القاسم المشترك الأكبر', 'الأعداد الأولية', 'الأسس', 'رقم الآحاد لأي عدد مرفوع لأي أس', 'الجذور', 'تحليل المقادير الجبرية (تحليل الفرق بين مربعين – تحليل المقدار الثلاثي – مربع مقدار ذي حدين)', 'ترتيب العمليات الحسابية', 'التناسب', 'التناسب الطردي', 'التناسب العكسي', 'التناسب المتعدد', 'تطبيقات التناسب', 'النسب المئوية', 'حساب النسب المئوية في الزيادة والنقصان', 'المعادلات', 'الدوريات', 'قوانين متفرقة', 'قانون المصافحات', 'عدد المربعات والمستطيلات والمثلثات', 'الزكاة', 'أعواد الكبريت', 'أعمدة الإنارة', 'مشابك الغسيل', 'التحويل بين الوحدات', 'قانون صفحات الكتاب', 'الطابور', 'الزاوية بين عقارب الساعة', 'مسائل الساعات', 'الأنماط والمتتابعات', 'الأعداد المحصورة', 'قانون المسافة – السرعة – الزمن', 'قانون زمن الالتقاء (التقابل)', 'قانون زمن اللحاق', 'مسائل الصنابير وملحقاتها', 'قانون زمن التساوي (المرتبات)', 'مسائل الأعمار', 'شكل فن', 'الإحصاء', 'المتوسط الحسابي', 'الوسيط والمنوال', 'المدى', 'الاحتمالات', 'مبدأ العد الأساسي والتباديل والتوافيق', 'مهارة تجريب الخيارات', 'مهارة استبدال المتغيرات', 'مسائل فئات العملات', 'زوايا قياسها ١٨٠', 'الزاويتين المتقابلتين بالرأس', 'زوايا قياسها ٣٦٠', 'الزوايا الخارجة عن المثلث', 'التوازي', 'المضلع', 'الأشكال الرباعية (متوازي الأضلاع – المعين – المستطيل – المربع – شبه المنحرف – الطائرة الورقية)', 'مساحة المثلث', 'المساحة', 'المحيط', 'قوانين المثلث (متباينة المثلث – تساوي مثلثين)', 'فيثاغورث', 'الدائرة (محيط الدائرة – مساحة الدائرة)', 'الزاوية المحيطية والمركزية', 'طول القوس', 'مماس الدائرة', 'علاقة الدائرة بالأشكال الهندسية الأخرى', 'المسافة التي تقطعها عجلة تدور', 'معادلة الدائرة', 'تقاطع الأوتار داخل وخارج الدائرة', 'الحجوم', 'المظلل', 'هندسة الإحداثيات', 'إحداثيات نقطة المنتصف', 'ميل المستقيم', 'المستوى الإحداثي', 'تفسير الجداول والرسومات البيانية', 'المسائل العامة', 'المسائل اللفظية', 'مسائل المقارنات', 'أسئلة إجابتها (ج) – المقارنات', 'أسئلة إجابتها (د) – المقارنات'],
  lafzi: ['التناظر اللفظي', 'إكمال الجمل', 'الخطأ السياقي', 'استيعاب المقروء', 'المفردة الشاذة', 'الارتباط والاختلاف']
};
let skillsReady = false;
const ensureSkillsSchema = async DB => {
  if (skillsReady) return;
  await DB.batch([
    DB.prepare('CREATE TABLE IF NOT EXISTS skills (id INTEGER PRIMARY KEY AUTOINCREMENT, subject TEXT NOT NULL, name TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)'),
    DB.prepare('CREATE TABLE IF NOT EXISTS question_skills (course TEXT NOT NULL, qkey TEXT NOT NULL, skill_id INTEGER NOT NULL, by_name TEXT, updated_at TEXT NOT NULL, PRIMARY KEY (course, qkey))'),
    DB.prepare('CREATE INDEX IF NOT EXISTS question_skills_skill ON question_skills(skill_id)')
  ]);
  const iso = new Date().toISOString();
  // مزامنة قائمة المهارات مع القائمة المعتمدة (مرة واحدة لكل إصدار من القائمة):
  // تُضاف المهارات الناقصة، وتُحذف المهارات القديمة غير المعتمدة إن لم يُصنف تحتها أي سؤال، ويُعاد الترتيب
  if (!(await DB.prepare("SELECT 1 x FROM settings WHERE key='skills_v3'").first())) {
    const cur = (await DB.prepare('SELECT s.id,s.subject,s.name,COUNT(q.qkey) n FROM skills s LEFT JOIN question_skills q ON q.skill_id=s.id GROUP BY s.id').all()).results || [], st = [];
    for (const [sub, list] of Object.entries(SEED_SKILLS)) {
      const mine = cur.filter(r => r.subject === sub), byName = Object.fromEntries(mine.map(r => [r.name, r]));
      mine.forEach(r => { if (!list.includes(r.name) && !r.n) st.push(DB.prepare('DELETE FROM skills WHERE id=?').bind(r.id)); });
      list.forEach((name, i) => st.push(byName[name] ? DB.prepare('UPDATE skills SET sort=? WHERE id=?').bind(i + 1, byName[name].id) : DB.prepare('INSERT INTO skills (subject,name,sort,created_at) VALUES (?,?,?,?)').bind(sub, name, i + 1, iso)));
      mine.forEach(r => { if (!list.includes(r.name) && r.n) st.push(DB.prepare('UPDATE skills SET sort=? WHERE id=?').bind(1000 + r.id, r.id)); });
    }
    st.push(DB.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES ('skills_v3','1')"));
    await DB.batch(st);
  }
  skillsReady = true;
};
// ---------- بنك الأسئلة الموحد ----------
// كل سؤال يُسجَّل مرة واحدة (اختيار من متعدد): صورة أو نص، اختيارات بعدد مرن، إجابة صحيحة واحدة افتراضيًا أو أكثر.
let bankReady = false;
const ensureBankSchema = async DB => {
  if (bankReady) return;
  await DB.batch([
    DB.prepare("CREATE TABLE IF NOT EXISTS qbank (id INTEGER PRIMARY KEY AUTOINCREMENT, subject TEXT NOT NULL, skill_id INTEGER, difficulty INTEGER NOT NULL DEFAULT 0, source TEXT, stem TEXT, passage TEXT, image_id INTEGER, image_url TEXT, options TEXT NOT NULL, correct TEXT NOT NULL, multi INTEGER NOT NULL DEFAULT 0, explanation TEXT, status TEXT NOT NULL DEFAULT 'active', hash TEXT, ext_ref TEXT, created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    DB.prepare('CREATE UNIQUE INDEX IF NOT EXISTS qbank_ext ON qbank(ext_ref)'),
    DB.prepare('CREATE INDEX IF NOT EXISTS qbank_subject ON qbank(subject,status)'),
    DB.prepare('CREATE INDEX IF NOT EXISTS qbank_skill ON qbank(skill_id)'),
    DB.prepare('CREATE INDEX IF NOT EXISTS qbank_hash ON qbank(hash)')
  ]);
  bankReady = true;
};
const normAr = t => String(t || '').replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^\u0621-\u064A0-9\u0660-\u0669a-z]+/gi, ' ').trim();
const textHash = async (stem, opts) => 't:' + (await sha256hex(normAr(stem) + '|' + (opts || []).map(normAr).join('|'))).slice(0, 24);
const sha256hex = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(x => x.toString(16).padStart(2, '0')).join('');
const hamming = (a, b) => { let d = 0; for (let i = 0; i < 16; i += 4) { let x = parseInt(a.slice(i, i + 4), 16) ^ parseInt(b.slice(i, i + 4), 16); while (x) { d += x & 1; x >>= 1; } } return d; };
// يتحقق من سؤال قادم من الاستيراد أو التعديل ويعيده بالشكل المخزّن
const cleanQ = q => {
  const subject = SUBJECTS[q.subject] ? q.subject : null; if (!subject) throw new Error('المادة غير معروفة');
  let options = (Array.isArray(q.options) ? q.options : []).map(o => txt(o, 600).trim());
  while (options.length && !options[options.length - 1]) options.pop();
  if (options.length < 2 || options.length > 6) throw new Error('عدد الاختيارات يجب أن يكون من ٢ إلى ٦');
  let correct = (Array.isArray(q.correct) ? q.correct : [q.correct]).map(int).filter(i => i >= 0 && i < options.length);
  correct = [...new Set(correct)].sort();
  const multi = q.multi ? 1 : 0;
  if (!multi && correct.length > 1) correct = correct.slice(0, 1);
  const stem = txt(q.stem, 4000).trim(), image_url = /^\/(mt|img)\/[\w.-]+$|^\/api\/exam\/img\/\d+$/.test(q.image_url || '') ? q.image_url : null;
  if (!stem && !q.image_id && !image_url) throw new Error('السؤال بلا نص ولا صورة');
  const diff = int(q.difficulty); 
  return { subject, skill_id: q.skill_id ? int(q.skill_id) : null, difficulty: diff >= 0 && diff <= 3 ? diff : 0, source: txt(q.source, 120).trim() || null, stem: stem || null, passage: txt(q.passage, 8000).trim() || null, image_id: q.image_id ? int(q.image_id) : null, image_url, options: JSON.stringify(options), correct: JSON.stringify(correct), multi, explanation: txt(q.explanation, 4000).trim() || null, status: ['active', 'draft'].includes(q.status) ? q.status : 'active', hash: /^[0-9a-f]{16}$|^t:[0-9a-f]{24}$/.test(q.hash || '') ? q.hash : null };
};

// أسئلة البنك كما يراها الطالب (الملف الأصلي + تعديلات المعلمين)، مع ذاكرة مؤقتة داخل العامل
const bankCache = {};
const bankItems = async (env, request, DB, slug) => {
  const c = COURSE[slug]; if (!c || !SKILL_BANKS[slug]) return [];
  const res = await fetchAsset(env, request, c.file); if (!res) return [];
  let pv = { n: 0, m: '' };
  try { pv = await DB.prepare('SELECT COUNT(*) n, MAX(updated_at) m FROM exam_patch WHERE course=?').bind(slug).first() || pv; } catch (e) { }
  const sig = (res.headers.get('etag') || res.headers.get('last-modified') || '') + '|' + pv.n + '|' + pv.m;
  if (bankCache[slug] && bankCache[slug].sig === sig) { try { await res.body.cancel(); } catch (e) { } return bankCache[slug].items; }
  const html = await res.text(), a = html.indexOf('<script id="db" type="application/json">'), z = a < 0 ? -1 : html.indexOf('</script>', a);
  if (a < 0 || z < 0) return [];
  const D = JSON.parse(html.slice(a + 40, z)); let items = [];
  if (c.model === 'static') {
    const MN = Object.fromEntries((D.models || []).map(m => [m.id, m.name]));
    const SP = { ak: {}, ah: {}, ai: {}, ax: {} }; try { for (const r of ((await DB.prepare("SELECT kind,key,data FROM exam_patch WHERE course=? AND kind IN ('ak','ah','ai','ax') AND deleted=0").bind(slug).all()).results || [])) SP[r.kind][r.key] = JSON.parse(r.data); } catch (e) { }
    const { ak: AK, ah: AH, ai: AI, ax: AX } = SP;
    items = D.qs.filter(q => !AX[q[0]]).map(q => ({ key: String(q[0]), sec: MN[q[1]] || '', img: AI[q[0]] || '/mt/' + String(q[0]).padStart(4, '0') + '.webp', c: AK[q[0]] !== undefined ? AK[q[0]] : q[2], h: AH[q[0]] !== undefined ? AH[q[0]] : (q[3] || '') }));
  } else {
    let secs = D.secs.slice(), qs = D.qs.slice();
    let rows = []; try { rows = (await DB.prepare('SELECT kind,key,data,deleted FROM exam_patch WHERE course=? ORDER BY created_at,rowid').bind(slug).all()).results || []; } catch (e) { }
    for (const r of rows) {
      const d = r.deleted ? null : (r.data ? JSON.parse(r.data) : null);
      if (r.kind === 's') { const i = secs.findIndex(x => String(x.id) === r.key); if (!d) { if (i >= 0) secs.splice(i, 1); } else if (i >= 0) secs[i] = { id: secs[i].id, name: d.name }; else secs.push({ id: +r.key, name: d.name }); }
      else if (r.kind === 'q') { const i = qs.findIndex(x => String(x[0]) === r.key); if (!d) { if (i >= 0) qs.splice(i, 1); } else if (i >= 0) qs[i] = d; else qs.push(d); }
      else if (r.kind === 'p' && d !== null) { D.ps = D.ps || []; D.ps[+r.key] = d; }
    }
    const SN = Object.fromEntries(secs.map(x => [x.id, x.name]));
    qs = qs.filter(q => SN[q[1]] !== undefined);
    if (slug === 'aksam lafzi') items = qs.map(q => ({ key: String(q[0]), sec: SN[q[1]], t: q[2], p: q[3] >= 0 && D.ps ? D.ps[q[3]] || '' : '', s: q[4], o: q[5], c: q[6] }));
    else items = qs.map(q => { const m = /\/api\/exam\/img\/\d+/.exec(q[4] || ''); return { key: String(q[0]), sec: SN[q[1]], img: m ? m[0] : '/img/' + q[0] + '.webp', c: q[6], h: q[7] || '' }; });
  }
  bankCache[slug] = { sig, items };
  return items;
};

const ensureLeadsSchema = async DB => {
  if (leadsReady) return;
  await DB.batch([
    DB.prepare("CREATE TABLE IF NOT EXISTS guest_leads (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'website', interest TEXT, status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL, last_contacted_at TEXT)"),
    DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS guest_leads_phone ON guest_leads(phone)"),
    DB.prepare("CREATE INDEX IF NOT EXISTS guest_leads_created ON guest_leads(created_at)")
  ]);
  leadsReady = true;
};
const ensureStaffSchema = async DB => {
  if (schemaReady) return;
  await DB.batch([
    DB.prepare("CREATE TABLE IF NOT EXISTS staff_users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'supervisor', status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL, last_seen TEXT)"),
    DB.prepare("CREATE TABLE IF NOT EXISTS staff_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id INTEGER NOT NULL, token_hash TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, expires_at TEXT NOT NULL)"),
    DB.prepare("CREATE INDEX IF NOT EXISTS staff_sessions_token ON staff_sessions(token_hash)"),
    DB.prepare("CREATE INDEX IF NOT EXISTS staff_sessions_expiry ON staff_sessions(expires_at)"),
    DB.prepare("CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, actor_type TEXT NOT NULL, actor_id INTEGER, actor_name TEXT, action TEXT NOT NULL, target_type TEXT, target_id INTEGER, details TEXT, created_at TEXT NOT NULL)"),
    DB.prepare("CREATE INDEX IF NOT EXISTS audit_log_created ON audit_log(created_at)"),
    DB.prepare("CREATE TABLE IF NOT EXISTS student_groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL)"),
    DB.prepare("CREATE TABLE IF NOT EXISTS group_members (group_id INTEGER NOT NULL, student_id INTEGER NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (group_id, student_id))"),
    DB.prepare("CREATE TABLE IF NOT EXISTS group_pages (group_id INTEGER NOT NULL, page TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (group_id, page))"),
    DB.prepare("CREATE INDEX IF NOT EXISTS group_members_student ON group_members(student_id)"),
    DB.prepare("CREATE INDEX IF NOT EXISTS group_pages_page ON group_pages(page)"),
    DB.prepare("CREATE TABLE IF NOT EXISTS staff_permissions (staff_id INTEGER PRIMARY KEY, can_manage_students INTEGER NOT NULL DEFAULT 0, can_manage_groups INTEGER NOT NULL DEFAULT 0, can_manage_content INTEGER NOT NULL DEFAULT 0, can_view_guests INTEGER NOT NULL DEFAULT 0, can_view_reports INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL)"),
    DB.prepare("CREATE TABLE IF NOT EXISTS staff_perms (staff_id INTEGER NOT NULL, perm TEXT NOT NULL, PRIMARY KEY (staff_id, perm))"),
    DB.prepare("CREATE TABLE IF NOT EXISTS course_staff (course TEXT NOT NULL, staff_id INTEGER NOT NULL, can_edit INTEGER NOT NULL DEFAULT 1, can_add INTEGER NOT NULL DEFAULT 0, can_delete INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, PRIMARY KEY (course, staff_id))"),
    DB.prepare("CREATE INDEX IF NOT EXISTS course_staff_staff ON course_staff(staff_id)"),
    DB.prepare("CREATE TABLE IF NOT EXISTS exam_patch (course TEXT NOT NULL, kind TEXT NOT NULL, key TEXT NOT NULL, data TEXT, deleted INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT, PRIMARY KEY (course, kind, key))"),
    DB.prepare("CREATE TABLE IF NOT EXISTS exam_images (id INTEGER PRIMARY KEY AUTOINCREMENT, course TEXT NOT NULL, mime TEXT NOT NULL, data BLOB NOT NULL, created_at TEXT NOT NULL, created_by TEXT)"),
    DB.prepare("CREATE TABLE IF NOT EXISTS exam_base (course TEXT PRIMARY KEY, etag TEXT, data TEXT NOT NULL, updated_at TEXT NOT NULL)")
  ]);
  // ترحيل لمرة واحدة: الصلاحيات القديمة => الصلاحيات التفصيلية
  const done = await DB.prepare("SELECT value FROM settings WHERE key='perms_v2'").first();
  if (!done) {
    const old = (await DB.prepare('SELECT * FROM staff_permissions').all()).results || [];
    const st = [];
    for (const r of old) {
      const list = cleanPerms(Object.entries(LEGACY_MAP).flatMap(([col, perms]) => r[col] ? perms : []));
      for (const perm of list) st.push(DB.prepare('INSERT OR IGNORE INTO staff_perms (staff_id,perm) VALUES (?,?)').bind(r.staff_id, perm));
    }
    st.push(DB.prepare("INSERT INTO settings (key,value) VALUES ('perms_v2','1') ON CONFLICT(key) DO UPDATE SET value='1'"));
    await DB.batch(st);
  }
  await ensureLeadsSchema(DB);
  schemaReady = true;
};


export async function onRequest({ request, env, params }) {
  const DB = env.DB, p = (params.path || []).join('/'), m = request.method;
  if (!DB) return J({ error: 'قاعدة البيانات غير مربوطة بعد' }, 500);
  const now = Date.now(), iso = new Date(now).toISOString(), day = iso.slice(0, 10);
  const ip = request.headers.get('cf-connecting-ip') || 'x';
  const body = async () => { try { return await request.json(); } catch (e) { return {}; } };
  const setting = async k => { const r = await DB.prepare('SELECT value FROM settings WHERE key=?').bind(k).first(); return r ? r.value : ''; };
  const putSetting = (k, v) => DB.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k, v);
  const tooMany = async (key, max = 10) => (await DB.prepare('SELECT COUNT(*) n FROM login_fails WHERE ip=? AND at>?').bind(key, now - 900000).first()).n >= max;
  const addFail = key => DB.batch([DB.prepare('INSERT INTO login_fails (ip,at) VALUES (?,?)').bind(key, now), DB.prepare('DELETE FROM login_fails WHERE at<?').bind(now - 86400000)]);
  const byCode = c => c ? DB.prepare('SELECT * FROM students WHERE code=?').bind(c).first() : null;
  // هل لهذا الزائر النسخة الكاملة؟ (الموقع مفتوح، أو طالب صالح، أو داخل التجربة، أو من فريق العمل)
  const fullAccess = async () => {
    if (await setting('require_login') !== '1') return true;
    const st = await byCode(norm(ck(request, 'bw_code'))), tm = +(await setting('trial_minutes')) || 0, ts = +ck(request, 'bw_trial') || 0;
    if (st && st.status === 'active' && (!st.expires_at || st.expires_at > iso) && !((st.pause_until || 0) > Date.now())) return true;
    if (!st && tm > 0 && ts && Date.now() - ts < tm * 60000) return true;
    if (env.ADMIN_PASSWORD && ck(request, 'bw_admin') && ck(request, 'bw_admin') === await tok(env)) return true;
    if (ck(request, 'bw_staff')) { try { if (await DB.prepare("SELECT 1 x FROM staff_sessions s JOIN staff_users u ON u.id=s.staff_id WHERE s.token_hash=? AND u.status='active' AND s.expires_at>?").bind(await tok({ ADMIN_PASSWORD: 'staff|' + ck(request, 'bw_staff') }), iso).first()) return true; } catch (e) { } }
    return false;
  };
  // نتيجة النسخة المجانية ثابتة لكل نسخة من الملف، فتُحفظ في ذاكرة Cloudflare بدل إعادة حسابها مع كل زائر
  const freeCached = async (slug, n, ver, make) => {
    const key = ver && typeof caches !== 'undefined' ? new Request('https://bw-free.cache/data/' + encodeURIComponent(slug) + '/' + n + '/' + encodeURIComponent(ver)) : null;
    if (key) { try { const r = await caches.default.match(key); if (r) return await r.text(); } catch (e) { } }
    const out = make();
    if (key) { try { await caches.default.put(key, new Response(out, { headers: { 'cache-control': 'public, max-age=604800' } })); } catch (e) { } }
    return out;
  };
  const freeN = async () => Math.max(1, Math.min(50, +(await setting('free_count')) || 10));
  // إنهاء الاستراحة: يُرجَّع الوقت غير المستخدم من الاستراحة إلى رصيدها ويُخصم من تاريخ الانتهاء
  const endPause = async s => {
    if ((s.pause_until || 0) > now && s.expires_at) {
      const unused = Math.max(0, Math.floor((s.pause_until - now) / 60000));
      await DB.prepare('UPDATE students SET pause_until=NULL,paused_at=NULL,expires_at=?,pause_used=MAX(0,pause_used-?) WHERE id=?')
        .bind(new Date(new Date(s.expires_at).getTime() - unused * 60000).toISOString(), unused, s.id).run();
    } else if (s.pause_until) await DB.prepare('UPDATE students SET pause_until=NULL,paused_at=NULL WHERE id=?').bind(s.id).run();
  };
  const admit = async (s, c) => {
    let dev = ck(request, 'bw_dev'); if (!/^[0-9a-f-]{36}$/.test(dev)) dev = crypto.randomUUID();
    const has = await DB.prepare('SELECT 1 x FROM devices WHERE student_id=? AND device=?').bind(s.id, dev).first();
    if (has) await DB.prepare('UPDATE devices SET last_seen=? WHERE student_id=? AND device=?').bind(iso, s.id, dev).run();
    else {
      const n = (await DB.prepare('SELECT COUNT(*) n FROM devices WHERE student_id=?').bind(s.id).first()).n;
      if (s.max_devices > 0 && n >= s.max_devices) return J({ error: `وصل حسابك للحد الأقصى من الأجهزة (${s.max_devices}). تواصل مع المنصة.` }, 403);
      await DB.prepare('INSERT INTO devices (student_id,device,first_seen,last_seen) VALUES (?,?,?,?)').bind(s.id, dev, iso, iso).run();
    }
    return new Response(JSON.stringify({ ok: 1, name: s.name }), { headers: loginHeaders(c, dev) });
  };
  const loginHeaders = (c, dev) => { const h = new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' }); h.append('set-cookie', `bw_code=${c}; ${COOKIE}`); h.append('set-cookie', `bw_dev=${dev}; ${COOKIE}`); return h; };

  if (p === 'guest-lead' && m === 'POST') {
    await ensureLeadsSchema(DB);
    // حماية من الإغراق: ٥ طلبات كحد أقصى لكل شبكة كل ربع ساعة
    if (await tooMany('lead|' + ip, 5)) return J({ error: 'تم استلام طلبك بالفعل. حاول لاحقًا.' }, 429);
    await addFail('lead|' + ip);
    const b = await body(), name = String(b.name || '').trim().slice(0, 80), leadPhone = phone(b.phone), interest = String(b.interest || '').trim().slice(0, 160), source = String(b.source || 'website').slice(0, 40);
    if (leadPhone.length < 9 || leadPhone.length > 15) return J({ error: 'اكتب رقم واتساب صحيحًا' }, 400);
    await DB.prepare("INSERT INTO guest_leads (name,phone,source,interest,status,created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET name=COALESCE(excluded.name,guest_leads.name),interest=excluded.interest,source=excluded.source").bind(name || null, leadPhone, source, interest, 'new', iso).run();
    return J({ ok: 1 });
  }
  // الصفحة الرئيسية تعرض «تفاصيل الدورات» من نفس رسالة واتساب التي تُرسل للمهتمين (تُعدَّل من لوحة التحكم ← الإعدادات)
  if (p === 'public') return J({ contact: await setting('contact'), plans: plansOf(await setting('plans')), courses: (await setting('lead_message')) || DEFAULT_LEAD_MSG, moodle: (await setting('moodle_enabled')) !== '0', google: env.MOODLE_TOKEN ? ((await setting('google_client_id')) || GOOGLE_CLIENT_ID) : '', hidden: hiddenOf(await setting('hidden_courses')) });

  if (p === 'login' && m === 'POST') {
    if (await tooMany(ip)) return J({ error: 'محاولات خاطئة كثيرة. حاول بعد ربع ساعة.' }, 429);
    const c = norm((await body()).code), s = await byCode(c);
    if (!s) { await addFail(ip); return J({ error: 'الكود غير صحيح' }, 401); }
    if (s.status !== 'active') return J({ error: 'تم إيقاف هذا الكود. تواصل مع المنصة.' }, 403);
    if (s.expires_at && s.expires_at < iso) return J({ error: 'انتهت صلاحية هذا الكود. تواصل مع المنصة للتجديد.' }, 403);
    if ((s.pause_until || 0) > now) return J({ error: 'حسابك في فترة استراحة حاليًا.', paused: true, until: s.pause_until }, 403);
    return admit(s, c);
  }

  // ===================== الدخول بحساب منصة الدورات (Moodle) =====================
  // يتحقق من اسم المستخدم وكلمة المرور عبر خدمة تطبيق مودل الرسمية، ثم من تسجيل الطالب في الدورات المسموح بها.
  // كلمة المرور لا تُحفظ عندنا، ولا يُغيَّر أي شيء في مودل.
  // حساب مودل تم التحقق منه (بكلمة المرور أو بجوجل): نتأكد أنه مسجّل في دورة، ثم نربطه بحساب الطالب ونُدخله
  const admitMoodle = async (info, username, courses) => {
      const allowed = String((await setting('moodle_courses')) || '').split(/[^0-9]+/).filter(Boolean).map(Number);
      const mine = Array.isArray(courses) ? courses.map(x => +x.id) : [];
      if (allowed.length ? !mine.some(id => allowed.includes(id)) : !mine.length) return J({ error: 'حسابك على منصة الدورات لا يشمل اشتراكًا في دورات الاختبارات. تواصل مع المنصة للاشتراك.', moodle: 1 }, 403);
      await ensureMoodleSchema(DB);
      const name = String(info.fullname || username).slice(0, 80), link = await DB.prepare('SELECT * FROM moodle_links WHERE moodle_id=?').bind(+info.userid).first();
      let s = link ? await DB.prepare('SELECT * FROM students WHERE id=?').bind(link.student_id).first() : null;
      const exp = new Date(now + 30 * 864e5).toISOString();
      if (!s) {
        let c = '', r = null;
        for (let i = 0; i < 5 && !r; i++) { c = 'M' + newCode().slice(1); try { r = await DB.prepare('INSERT INTO students (name,code,created_at,kind,max_devices,expires_at) VALUES (?,?,?,?,?,?)').bind(name, c, iso, 'single', 3, exp).run(); } catch (e) { r = null; } }
        if (!r) return J({ error: 'تعذّر إنشاء حسابك، حاول مرة أخرى' }, 500);
        await DB.prepare('INSERT OR REPLACE INTO moodle_links (moodle_id,student_id,username,courses,created_at,checked_at) VALUES (?,?,?,?,?,?)').bind(+info.userid, r.meta.last_row_id, username, mine.join(','), iso, iso).run();
        s = await DB.prepare('SELECT * FROM students WHERE id=?').bind(r.meta.last_row_id).first();
      } else {
        if (s.status !== 'active') return J({ error: 'تم إيقاف حسابك على منصة الاختبارات. تواصل مع المنصة.' }, 403);
        // التسجيل في مودل ما زال ساريًا: نجدد الصلاحية ٣٠ يومًا من الآن (ما لم تكن دائمة)
        await DB.batch([DB.prepare('UPDATE students SET name=?,expires_at=CASE WHEN expires_at IS NULL THEN NULL WHEN expires_at>? THEN expires_at ELSE ? END WHERE id=?').bind(name, exp, exp, s.id), DB.prepare('UPDATE moodle_links SET username=?,courses=?,checked_at=? WHERE moodle_id=?').bind(username, mine.join(','), iso, +info.userid)]);
        s = await DB.prepare('SELECT * FROM students WHERE id=?').bind(s.id).first();
      }
      if ((s.pause_until || 0) > now) await endPause(s);
      return admit(s, s.code);
  };
  if (p === 'login/moodle' && m === 'POST') {
    if (await setting('moodle_enabled') === '0') return J({ error: 'الدخول بحساب منصة الدورات غير مفعّل حاليًا' }, 403);
    if (await tooMany('m|' + ip)) return J({ error: 'محاولات خاطئة كثيرة. حاول بعد ربع ساعة.' }, 429);
    const b = await body(), username = String(b.username || '').trim().toLowerCase().slice(0, 100), password = String(b.password || '').slice(0, 200);
    if (!username || !password) return J({ error: 'اكتب اسم المستخدم وكلمة المرور' }, 400);
    const base = ((await setting('moodle_url')) || MOODLE_URL).replace(/\/+$/, '');
    let tokRes;
    try {
      const r = await fetch(base + '/login/token.php', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ username, password, service: 'moodle_mobile_app' }) });
      tokRes = await r.json();
    } catch (e) { return J({ error: 'تعذّر الاتصال بمنصة الدورات الآن. حاول بعد قليل أو ادخل بالكود.' }, 502); }
    if (!tokRes || !tokRes.token) { await addFail('m|' + ip); return J({ error: tokRes && tokRes.errorcode === 'invalidlogin' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'تعذّر الدخول بحساب منصة الدورات' + (tokRes && tokRes.error ? ': ' + String(tokRes.error).slice(0, 120) : '') }, 401); }
    const ws = async (fn, params = {}) => { const r = await fetch(base + '/webservice/rest/server.php', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ wstoken: tokRes.token, wsfunction: fn, moodlewsrestformat: 'json', ...params }) }); return r.json(); };
    let info, courses;
    try { info = await ws('core_webservice_get_site_info'); courses = await ws('core_enrol_get_users_courses', { userid: String(info.userid) }); }
    catch (e) { return J({ error: 'تعذّر قراءة بيانات حسابك من منصة الدورات' }, 502); }
    if (!info || !info.userid) return J({ error: 'تعذّر قراءة بيانات حسابك من منصة الدورات' }, 502);
    return admitMoodle(info, username, courses);
  }
  // ===== الدخول التلقائي من منصة الدورات (مودل) بدون تسجيل دخول ثانٍ =====
  // سكربت صغير في مودل (Additional HTML) يطلب رمزًا مؤقتًا من هنا، ويحفظه في تفضيلات الطالب على مودل
  // (لا يستطيع أحد كتابة تفضيلات طالب غيره)، ثم يفتح sso/finish. نحن نقرأ التفضيل بتوكن مودل ونتأكد أنه نفس الرمز.
  const SSO_PREF = 'filepicker_recentlicense';
  const ssoCors = async () => { const o = request.headers.get('origin') || '', base = ((await setting('moodle_url')) || MOODLE_URL); let mo = ''; try { mo = new URL(base).origin; } catch (e) { } return o && o === mo ? { 'access-control-allow-origin': o, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-max-age': '600', vary: 'origin' } : {}; };
  const ensureSso = () => DB.prepare('CREATE TABLE IF NOT EXISTS sso_nonces (n TEXT PRIMARY KEY, at INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0)').run();
  if (p === 'sso/nonce') {
    const cors = await ssoCors();
    if (m === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (m !== 'POST') return J({ error: 'not found' }, 404, cors);
    if (!env.MOODLE_TOKEN || await setting('moodle_enabled') === '0') return J({ error: 'off' }, 503, cors);
    if (await tooMany('s|' + ip, 40)) return J({ error: 'محاولات كثيرة' }, 429, cors);
    await addFail('s|' + ip);
    await ensureSso();
    const n = 'bw' + [...crypto.getRandomValues(new Uint8Array(18))].map(x => x.toString(36).padStart(2, '0')).join('').slice(0, 30);
    await DB.batch([DB.prepare('INSERT INTO sso_nonces (n,at) VALUES (?,?)').bind(n, now), DB.prepare('DELETE FROM sso_nonces WHERE at<?').bind(now - 3600000)]);
    return J({ n }, 200, { ...cors, 'cache-control': 'no-store' });
  }
  if (p === 'sso/finish' && m === 'GET') {
    const q = new URL(request.url).searchParams, n = String(q.get('n') || ''), uid = int(q.get('u')), nx0 = String(q.get('next') || '/');
    const nx = nx0.charAt(0) === '/' && nx0.charAt(1) !== '/' ? nx0 : '/';
    const fail = msg => new Response(null, { status: 302, headers: { location: '/login?next=' + encodeURIComponent(nx) + (msg ? '&sso=' + encodeURIComponent(msg) : ''), 'cache-control': 'no-store' } });
    if (!env.MOODLE_TOKEN || await setting('moodle_enabled') === '0' || !/^bw[a-z0-9]{20,40}$/.test(n) || !(uid > 1)) return fail('');
    if (await tooMany('sf|' + ip, 20)) return fail('محاولات كثيرة، حاول بعد ربع ساعة');
    await ensureSso();
    const row = await DB.prepare('SELECT at,used FROM sso_nonces WHERE n=?').bind(n).first();
    if (!row || row.used || now - row.at > 300000) { await addFail('sf|' + ip); return fail('انتهت صلاحية رابط الدخول، سجّل دخولك مرة واحدة'); }
    await DB.prepare('UPDATE sso_nonces SET used=1 WHERE n=?').bind(n).run();
    const base = ((await setting('moodle_url')) || MOODLE_URL).replace(/\/+$/, '');
    const ws = async (fn, params = {}) => { const r = await fetch(base + '/webservice/rest/server.php', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ wstoken: env.MOODLE_TOKEN, wsfunction: fn, moodlewsrestformat: 'json', ...params }) }); return r.json(); };
    let pref, users, courses;
    try { pref = await ws('core_user_get_user_preferences', { name: SSO_PREF, userid: String(uid) }); } catch (e) { return fail('تعذّر الاتصال بمنصة الدورات'); }
    const val = pref && Array.isArray(pref.preferences) && pref.preferences[0] ? String(pref.preferences[0].value || '') : '';
    if (val !== n) { await addFail('sf|' + ip); return fail(pref && pref.exception ? 'إعداد الدخول التلقائي غير مكتمل (' + String(pref.errorcode || '').slice(0, 50) + ')' : ''); }
    try { users = await ws('core_user_get_users_by_field', { field: 'id', 'values[0]': String(uid) }); courses = await ws('core_enrol_get_users_courses', { userid: String(uid) }); }
    catch (e) { return fail('تعذّر قراءة بيانات حسابك من منصة الدورات'); }
    const u = Array.isArray(users) ? users[0] : null;
    if (!u || u.suspended) return fail('');
    const res = await admitMoodle({ userid: uid, fullname: u.fullname }, String(u.username || u.email || uid).toLowerCase(), courses);
    if (res.status !== 200) { let e = ''; try { e = (await res.json()).error || ''; } catch (x) { } return fail(e); }
    const h = new Headers({ location: nx, 'cache-control': 'no-store' });
    for (const [k, v] of res.headers) if (k.toLowerCase() === 'set-cookie') h.append('set-cookie', v);
    if (typeof res.headers.getSetCookie === 'function') { h.delete('set-cookie'); for (const v of res.headers.getSetCookie()) h.append('set-cookie', v); }
    return new Response(null, { status: 302, headers: h });
  }
  // الدخول بحساب جوجل: نتحقق من جوجل، ثم نبحث عن نفس الإيميل في مودل ونتأكد من اشتراكه في دورة
  if (p === 'login/google' && m === 'POST') {
    if (await setting('moodle_enabled') === '0') return J({ error: 'الدخول بحساب منصة الدورات غير مفعّل حاليًا' }, 403);
    if (!env.MOODLE_TOKEN) return J({ error: 'الدخول بجوجل لم يُجهَّز بعد. ادخل باسم المستخدم وكلمة المرور.' }, 503);
    if (await tooMany('g|' + ip, 20)) return J({ error: 'محاولات كثيرة. حاول بعد ربع ساعة.' }, 429);
    const b = await body(), cred = String(b.credential || '').slice(0, 4000), cid = (await setting('google_client_id')) || GOOGLE_CLIENT_ID;
    if (!cred) return J({ error: 'تعذّر الدخول بجوجل' }, 400);
    let g;
    try { g = await (await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(cred))).json(); }
    catch (e) { return J({ error: 'تعذّر الاتصال بجوجل الآن. حاول بعد قليل.' }, 502); }
    if (!g || g.aud !== cid || !['accounts.google.com', 'https://accounts.google.com'].includes(g.iss) || !(+g.exp * 1000 > now) || String(g.email_verified) !== 'true' || !g.email) { await addFail('g|' + ip); return J({ error: 'تعذّر التحقق من حساب جوجل' }, 401); }
    const email = String(g.email).toLowerCase(), base = ((await setting('moodle_url')) || MOODLE_URL).replace(/\/+$/, '');
    const ws = async (fn, params = {}) => { const r = await fetch(base + '/webservice/rest/server.php', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ wstoken: env.MOODLE_TOKEN, wsfunction: fn, moodlewsrestformat: 'json', ...params }) }); return r.json(); };
    let users, courses;
    try { users = await ws('core_user_get_users_by_field', { field: 'email', 'values[0]': email }); }
    catch (e) { return J({ error: 'تعذّر الاتصال بمنصة الدورات الآن. حاول بعد قليل.' }, 502); }
    if (users && users.exception) return J({ error: 'إعداد الربط مع منصة الدورات غير مكتمل (' + String(users.errorcode || '').slice(0, 60) + ')' }, 502);
    const u = Array.isArray(users) ? users.find(x => !x.suspended && String(x.email || '').toLowerCase() === email) : null;
    if (!u) { await addFail('g|' + ip); return J({ error: 'الإيميل ' + email + ' غير مسجّل على منصة الدورات. أنشئ حسابًا بنفس الإيميل أولًا ثم اشترك في دورة.', signup: 1 }, 404); }
    try { courses = await ws('core_enrol_get_users_courses', { userid: String(u.id) }); }
    catch (e) { return J({ error: 'تعذّر قراءة بيانات حسابك من منصة الدورات' }, 502); }
    return admitMoodle({ userid: u.id, fullname: u.fullname || g.name }, String(u.username || email).toLowerCase(), courses);
  }
  if (p === 'logout') return J({ ok: 1 }, 200, { 'set-cookie': 'bw_code=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax' });

  // الطالب يوقف اشتراكه مؤقتًا (حتى ١٠٪ من مدة اشتراكه)، ويُضاف وقت الاستراحة لتاريخ الانتهاء
  if (p === 'pause' && m === 'POST') {
    const s = await byCode(norm(ck(request, 'bw_code')));
    if (!s || s.status !== 'active' || !s.expires_at || s.expires_at < iso || (s.pause_until || 0) > now) return J({ error: 'غير متاح الآن' }, 403);
    if (s.kind !== 'single' || !(s.duration_minutes > 0)) return J({ error: 'الاستراحة غير متاحة لهذا الكود' }, 403);
    const mins = Math.floor(+(await body()).minutes), lim = pauseLeft(s);
    if (!(mins >= 60 && mins <= lim)) return J({ error: lim >= 60 ? `أقصى مدة متاحة لك ${fmtMin(lim)}` : 'لا يوجد رصيد استراحة متاح' }, 400);
    const until = now + mins * 60000;
    await DB.prepare('UPDATE students SET pause_until=?,paused_at=?,pause_used=pause_used+?,expires_at=? WHERE id=?')
      .bind(until, now, mins, new Date(new Date(s.expires_at).getTime() + mins * 60000).toISOString(), s.id).run();
    return J({ ok: 1, until });
  }
  if (p === 'resume' && m === 'POST') {
    if (await tooMany(ip)) return J({ error: 'محاولات خاطئة كثيرة. حاول بعد ربع ساعة.' }, 429);
    const s = await byCode(norm((await body()).code));
    if (!s) { await addFail(ip); return J({ error: 'الكود غير صحيح' }, 401); }
    await endPause(s);
    return J({ ok: 1 });
  }

  // ===================== حفظ التقدم على الخادم =====================
  if (p === 'progress/restore.js' && m === 'GET') {
    const s = await byCode(norm(ck(request, 'bw_code')));
    const hdr = { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'private, no-cache' };
    if (!s) return new Response('', { headers: hdr });
    await ensureProgressSchema(DB);
    const rows = (await DB.prepare('SELECT key,data,ts FROM student_progress WHERE student_id=?').bind(s.id).all()).results || [];
    const tag = '"p-' + s.id + '-' + rows.length + '-' + rows.reduce((a, r) => Math.max(a, r.ts), 0) + '"';
    hdr.etag = tag;
    if (request.headers.get('if-none-match') === tag) return new Response(null, { status: 304, headers: hdr });
    const S = {}; rows.forEach(r => { S[r.key] = { v: r.data, t: r.ts }; });
    const js = '(function(){try{var S=' + JSON.stringify(S).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ',sid=' + s.id + ',K=' + JSON.stringify(SYNC_KEYS) + ',L=localStorage,M={};try{M=JSON.parse(L.getItem("bw-sync-meta")||"{}")||{}}catch(e){}'
      + 'if(M.sid!==sid){if(M.sid)K.forEach(function(k){L.removeItem(k)});M={sid:sid,t:{}}}M.t=M.t||{};'
      + 'for(var k in S){if(!M.t[k]||M.t[k]<S[k].t){L.setItem(k,S[k].v);M.t[k]=S[k].t}}'
      + 'L.setItem("bw-sync-meta",JSON.stringify(M));window.__bwSrv={};for(var k2 in S)window.__bwSrv[k2]=S[k2].t;window.__bwSid=sid}catch(e){}})();';
    return new Response(js, { headers: hdr });
  }
  if (p === 'progress' && m === 'POST') {
    const s = await byCode(norm(ck(request, 'bw_code')));
    if (!s || s.status !== 'active') return J({ ok: 0 }, 401);
    await ensureProgressSchema(DB);
    const b = await body(), items = b && typeof b.items === 'object' ? b.items : {}, st = [];
    let total = 0;
    for (const k of Object.keys(items).slice(0, SYNC_KEYS.length)) {
      if (!SYNC_KEYS.includes(k)) continue;
      const v = String(items[k] && items[k].v || ''), t = Math.min(now, Math.max(0, Math.trunc(+(items[k] && items[k].t) || now)));
      total += v.length; if (v.length > 600000 || total > 1500000) return J({ error: 'too large' }, 413);
      st.push(DB.prepare('INSERT INTO student_progress (student_id,key,data,ts) VALUES (?,?,?,?) ON CONFLICT(student_id,key) DO UPDATE SET data=excluded.data,ts=excluded.ts WHERE excluded.ts>student_progress.ts').bind(s.id, k, v, t));
    }
    if (st.length) await DB.batch(st);
    return J({ ok: 1 });
  }

  if (p === 'track' && m === 'POST') {
    const s = await byCode(norm(ck(request, 'bw_code')));
    if (!s || s.status !== 'active' || (s.expires_at && s.expires_at < iso) || (s.pause_until || 0) > now) return J({ ok: 0 });
    const b = await body(), page = String(b.page || '').replace(/(\.html)+$/i, '').slice(0, 120);
    if (!page) return J({ ok: 0 });
    const num = v => (v === null || v === undefined || isNaN(+v)) ? null : Math.round(+v);
    if (b.t === 'open') {
      await DB.batch([
        DB.prepare("INSERT INTO events (student_id,page,kind,created_at) VALUES (?,?,'open',?)").bind(s.id, page, iso),
        DB.prepare('UPDATE students SET last_seen=? WHERE id=?').bind(iso, s.id)]);
    } else if (b.t === 'beat') {
      await DB.prepare('INSERT INTO usage (student_id,page,day,seconds) VALUES (?,?,?,?) ON CONFLICT(student_id,page,day) DO UPDATE SET seconds=seconds+excluded.seconds')
        .bind(s.id, page, day, Math.min(Math.max(num(b.s) || 0, 0), 120)).run();
    } else if (b.t === 'attempt') {
      await DB.prepare("INSERT INTO events (student_id,page,kind,sub,score,correct,total,created_at) VALUES (?,?,'attempt',?,?,?,?,?)")
        .bind(s.id, page, String(b.sub || '').slice(0, 60), num(b.score), num(b.correct), num(b.total), iso).run();
    }
    return J({ ok: 1 });
  }

  // مقارنة مجهولة بباقي الطلاب في اختبارات المحاكاة (متوسط آخر ٣ محاولات، آخر ١٢٠ يومًا).
  // من يختار «إخفاء المقارنة» لا يرى المقارنة ولا يدخل في حسابها عند غيره.
  if (p === 'rank' && m === 'GET') {
    const s = await byCode(norm(ck(request, 'bw_code')));
    if (!s || s.status !== 'active') return J({ list: [] });
    const OFF = "SELECT student_id FROM student_progress WHERE key='bw-rank-off' AND data IN ('1','true')";
    const me = await DB.prepare(OFF + ' AND student_id=?').bind(s.id).first().catch(() => null);
    if (me) return J({ off: true, list: [] });
    const since = new Date(now - 120 * 864e5).toISOString();
    const rows = (await DB.prepare("SELECT student_id sid, page, score FROM events WHERE kind='attempt' AND score IS NOT NULL AND sub IN ('محاكي','ورقي') AND created_at>? AND student_id NOT IN (" + OFF + ") ORDER BY id").bind(since).all().catch(() => ({ results: [] }))).results || [];
    const by = {};
    for (const r of rows) { const P = by[r.page] = by[r.page] || {}; (P[r.sid] = P[r.sid] || []).push(r.score); }
    const avg = a => { const x = a.slice(-3); return x.reduce((t, v) => t + v, 0) / x.length; }, list = [];
    for (const pg of Object.keys(by)) {
      const P = by[pg]; if (!P[s.id]) continue;
      const mine = avg(P[s.id]), others = Object.keys(P).filter(k => +k !== s.id).map(k => avg(P[k]));
      if (others.length < 4) continue;
      list.push({ page: pg, mine: Math.round(mine), n: others.length + 1, pct: Math.round(others.filter(v => v < mine).length / others.length * 100) });
    }
    return J({ off: false, list });
  }

  // بيانات أسئلة «أقسام الكمي» و«أقسام اللفظي» يستخدمها المحاكي المحوسب مباشرة،
  // فأي قسم أو سؤال يُضاف في ملف الأقسام يظهر في المحاكي تلقائيًا بدون رفع أي ملف آخر.
  if (p === 'exam/data' && m === 'GET') {
    const c = COURSE[new URL(request.url).searchParams.get('c')];
    if (!c || c.model !== 'bank') return J({ error: 'not found' }, 404);
    const res = await fetchAsset(env, request, c.file);
    if (!res) return J({ error: 'not found' }, 404);
    // غير المشترك (بعد التجربة) يأخذ نسخة البيانات المجانية فقط، لا البنك كاملًا
    const full = await fullAccess(), n = full ? 0 : await freeN();
    const raw = res.headers.get('etag') || res.headers.get('last-modified') || '';
    const tag = raw ? '"d-' + (await tok({ ADMIN_PASSWORD: 'data|' + c.slug + '|' + raw + '|' + n })).slice(0, 24) + '"' : '';
    const hdr = { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'private, no-cache', vary: 'cookie' };
    if (tag) hdr.etag = tag;
    if (tag && request.headers.get('if-none-match') === tag) { try { await res.body.cancel(); } catch (e) { } return new Response(null, { status: 304, headers: hdr }); }
    const html = await res.text(), a = html.indexOf('<script id="db" type="application/json">'), z = a < 0 ? -1 : html.indexOf('</script>', a);
    if (a < 0 || z < 0) return J({ error: 'not found' }, 404);
    return new Response('window.__BWD=window.__BWD||{};window.__BWD[' + JSON.stringify(c.slug) + ']=' + (full ? html.slice(a + 40, z) : await freeCached(c.slug, n, raw, () => freeDb(html.slice(a + 40, z), n, 'bank'))) + ';', { headers: hdr });
  }

  // بلاغ من الطالب عن خطأ في سؤال: يظهر للمعلم في وضع التحرير
  if (p === 'report' && m === 'POST') {
    await ensureMoodleSchema(DB);
    if (await tooMany('r|' + ip, 15)) return J({ error: 'أرسلت بلاغات كثيرة. حاول لاحقًا.' }, 429);
    await addFail('r|' + ip);
    const b = await body(), c = COURSE[b.course];
    if (!c) return J({ error: 'المقرر غير معروف' }, 400);
    const reason = ['answer', 'text', 'image', 'other'].includes(b.reason) ? b.reason : 'other', note = String(b.note || '').trim().slice(0, 600), qkey = String(b.qkey || '').slice(0, 40);
    if (!qkey && !note) return J({ error: 'اكتب وصفًا للمشكلة ورقم السؤال' }, 400);
    const st = await byCode(norm(ck(request, 'bw_code')));
    await DB.prepare('INSERT INTO question_reports (course,qkey,reason,note,student_id,created_at) VALUES (?,?,?,?,?,?)').bind(c.slug, qkey, reason, note, st ? st.id : null, iso).run();
    return J({ ok: 1 });
  }

  // أسماء الأقسام فقط (لصفحة «تقدمي») بدون تحميل بنك الأسئلة كاملًا
  // قائمة المهارات وعدد أسئلة كل مهارة (للطالب وللمعلم في الشرح)
  if (p === 'skills' && m === 'GET') {
    await ensureSkillsSchema(DB);
    const sub = new URL(request.url).searchParams.get('subject') || '';
    const rows = await DB.prepare('SELECT s.id,s.subject,s.name,s.sort,COUNT(q.qkey) n FROM skills s LEFT JOIN question_skills q ON q.skill_id=s.id ' + (SUBJECTS[sub] ? 'WHERE s.subject=? ' : '') + 'GROUP BY s.id ORDER BY s.subject,s.sort,s.id').bind(...(SUBJECTS[sub] ? [sub] : [])).all();
    return J({ subjects: SUBJECTS, skills: rows.results || [] });
  }
  // كل أسئلة مهارة معينة من كل البنوك
  if (p === 'skills/questions' && m === 'GET') {
    await ensureSkillsSchema(DB);
    const id = int(new URL(request.url).searchParams.get('id'));
    const sk = await DB.prepare('SELECT id,subject,name FROM skills WHERE id=?').bind(id).first();
    if (!sk) return J({ error: 'المهارة غير موجودة' }, 404);
    const tags = (await DB.prepare('SELECT course,qkey FROM question_skills WHERE skill_id=?').bind(id).all()).results || [];
    const by = {}; tags.forEach(t => (by[t.course] = by[t.course] || new Set()).add(t.qkey));
    const out = [];
    for (const slug of Object.keys(by)) { const items = await bankItems(env, request, DB, slug); for (const it of items) if (by[slug].has(it.key)) out.push({ course: slug, bank: COURSE[slug].title, ...it }); }
    // النسخة المجانية: غير المشترك (بعد انتهاء التجربة) يرى أول N سؤال فقط من كل مهارة
    if (out.length && !(await fullAccess())) { const n = await freeN(); if (out.length > n) return J({ skill: sk, items: out.slice(0, n), locked: out.length - n, total: out.length }); }
    return J({ skill: sk, items: out });
  }

  if (p === 'exam/secs' && m === 'GET') {
    const c = COURSE[new URL(request.url).searchParams.get('c')];
    if (!c || c.model !== 'bank') return J({ error: 'not found' }, 404);
    const res = await fetchAsset(env, request, c.file);
    if (!res) return J({ error: 'not found' }, 404);
    const html = await res.text(), a = html.indexOf('"secs":'), z = a < 0 ? -1 : html.indexOf('}]', a);
    let secs = []; try { secs = JSON.parse(html.slice(a + 7, z + 2)); } catch (e) { }
    try { await ensureStaffSchema(DB); for (const r of await DB.prepare("SELECT key,data,deleted FROM exam_patch WHERE course=? AND kind='s'").bind(c.slug).all().then(x => x.results)) { const i = secs.findIndex(x => String(x.id) === r.key); if (r.deleted) { if (i >= 0) secs.splice(i, 1); } else { const d = JSON.parse(r.data); if (i >= 0) secs[i].name = d.name; else secs.push({ id: +r.key, name: d.name }); } } } catch (e) { }
    return J({ secs }, 200, { 'cache-control': 'public, max-age=300' });
  }

  // صور الأسئلة التي رفعها المعلمون من وضع التحرير
  if (p.startsWith('exam/img/') && m === 'GET') {
    const id = int(p.slice(9));
    if (!(id > 0)) return J({ error: 'not found' }, 404);
    await ensureStaffSchema(DB);
    const r = await DB.prepare('SELECT mime,data FROM exam_images WHERE id=?').bind(id).first();
    if (!r) return J({ error: 'not found' }, 404);
    return new Response(r.data instanceof ArrayBuffer ? r.data : new Uint8Array(r.data), { headers: { 'content-type': r.mime, 'cache-control': 'public, max-age=31536000, immutable' } });
  }

  // ===================== لوحة التحكم =====================
  if (!p.startsWith('admin/')) return J({ error: 'not found' }, 404);
  await ensureStaffSchema(DB);
  const all = async (sql, ...binds) => ((await DB.prepare(sql).bind(...binds).all()).results) || [];
  const one = (sql, ...binds) => DB.prepare(sql).bind(...binds).first();
  const sessionHash = raw => tok({ ADMIN_PASSWORD: 'staff|' + raw });
  const permsFor = async (id, role) => role === 'super_admin' ? ALL_PERMS.slice() : cleanPerms((await all('SELECT perm FROM staff_perms WHERE staff_id=?', id)).map(r => r.perm));
  const staffToken = ck(request, 'bw_staff');
  const actorOf = async () => {
    if (staffToken) {
      const row = await one('SELECT u.id,u.name,u.username,u.role,u.status,s.expires_at FROM staff_sessions s JOIN staff_users u ON u.id=s.staff_id WHERE s.token_hash=?', await sessionHash(staffToken));
      if (row && row.status === 'active' && row.expires_at > iso) {
        await DB.prepare('UPDATE staff_users SET last_seen=? WHERE id=?').bind(iso, row.id).run();
        return { type: 'staff', id: row.id, name: row.name, username: row.username, role: row.role, perms: await permsFor(row.id, row.role) };
      }
    }
    if (env.ADMIN_PASSWORD && safeEq(ck(request, 'bw_admin'), await tok(env))) return { type: 'legacy', id: 0, name: 'المدير العام', username: 'admin', role: 'super_admin', perms: ALL_PERMS.slice() };
    return null;
  };
  const audit = (a, action, targetType = null, targetId = null, details = '') => DB.prepare('INSERT INTO audit_log (actor_type,actor_id,actor_name,action,target_type,target_id,details,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(a.type, a.id || null, a.name, action, targetType, targetId, String(details || '').slice(0, 300), iso);

  if (p === 'admin/login' && m === 'POST') {
    if (await tooMany('a|' + ip)) return J({ error: 'محاولات كثيرة. حاول بعد ربع ساعة.' }, 429);
    const b = await body(), username = String(b.username || '').trim().toLowerCase(), password = String(b.password || '');
    if (username) {
      const u = await one('SELECT * FROM staff_users WHERE username=?', username);
      if (!u || u.status !== 'active' || !(await passwordMatches(password, u.password_hash))) { await addFail('a|' + ip); return J({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, 401); }
      const raw = crypto.randomUUID() + crypto.randomUUID(), th = await sessionHash(raw);
      await DB.batch([
        DB.prepare('INSERT INTO staff_sessions (staff_id,token_hash,created_at,expires_at) VALUES (?,?,?,?)').bind(u.id, th, iso, new Date(now + 2592000000).toISOString()),
        DB.prepare('UPDATE staff_users SET last_seen=? WHERE id=?').bind(iso, u.id),
        DB.prepare('DELETE FROM staff_sessions WHERE expires_at<?').bind(iso),
        audit({ type: 'staff', id: u.id, name: u.name }, 'login', 'staff', u.id, u.username)]);
      return J({ ok: 1 }, 200, { 'set-cookie': `bw_staff=${encodeURIComponent(raw)}; ${STAFF_COOKIE}` });
    }
    if (!env.ADMIN_PASSWORD || !safeEq(password, env.ADMIN_PASSWORD)) { await addFail('a|' + ip); return J({ error: 'كلمة المرور غير صحيحة' }, 401); }
    return J({ ok: 1 }, 200, { 'set-cookie': `bw_admin=${await tok(env)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Strict` });
  }
  if (p === 'admin/logout') {
    if (staffToken) await DB.prepare('DELETE FROM staff_sessions WHERE token_hash=?').bind(await sessionHash(staffToken)).run();
    const h = new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' });
    h.append('set-cookie', 'bw_staff=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict');
    h.append('set-cookie', 'bw_admin=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict');
    return new Response('{"ok":1}', { headers: h });
  }

  const A = await actorOf();
  if (!A) return J({ error: 'auth' }, 401);
  const can = k => A.role === 'super_admin' || A.perms.includes(k);
  const deny = (msg = 'ليس لديك صلاحية لهذه العملية') => J({ error: msg }, 403);
  const isSuper = A.role === 'super_admin';

  // ---------- المقررات: صلاحيات المعلم داخل كل مقرر ----------
  const courseRights = async slug => {
    if (!COURSE[slug]) return null;
    if (isSuper) return { edit: true, add: true, delete: true, all: true };
    if (A.type !== 'staff') return null;
    const r = await one('SELECT can_edit,can_add,can_delete FROM course_staff WHERE course=? AND staff_id=?', slug, A.id);
    return r ? { edit: !!r.can_edit, add: !!r.can_add, delete: !!r.can_delete } : null;
  };
  const baseOf = async c => {
    const res = await fetchAsset(env, request, c.file);
    if (!res) return null;
    const tagRaw = res.headers.get('etag') || res.headers.get('last-modified') || '', etag = tagRaw ? 'v1|' + tagRaw : '';
    const row = await one('SELECT etag,data FROM exam_base WHERE course=?', c.slug);
    if (row && etag && row.etag === etag) { const d0 = JSON.parse(row.data); if (c.model !== 'static' || d0.q) { try { await res.body.cancel(); } catch (e) { } return d0; } }
    const b = extractBase(c, await res.text());
    await DB.prepare('INSERT INTO exam_base (course,etag,data,updated_at) VALUES (?,?,?,?) ON CONFLICT(course) DO UPDATE SET etag=excluded.etag,data=excluded.data,updated_at=excluded.updated_at').bind(c.slug, etag, JSON.stringify(b), iso).run();
    return b;
  };
  const cleanOp = (c, kind, key, d) => {
    const bad = m => { throw new Error(m || 'بيانات غير صالحة'); };
    if (kind === 'q') {
      const id = int(key); if (!(id > 0) || !Array.isArray(d) || int(d[0]) !== id) bad();
      const sec = int(d[1]); if (!(sec > 0)) bad('اختر القسم');
      let t = int(d[2]) || 0, pi = int(d[3]), stem = txt(d[4], 6000), opts = (Array.isArray(d[5]) ? d[5] : []).slice(0, 5).map(x => txt(x, 800)), cor = int(d[6]);
      const hint = c.hints ? txt(d[7], 2000).trim() : '';
      if (c.img) { const mm = /\/api\/exam\/img\/(\d+)/.exec(stem); stem = '<p><img src="' + (mm ? '/api/exam/img/' + mm[1] : 'img/' + id + '.webp') + '" alt="صورة السؤال"></p>'; opts = LETTERS.slice(); t = 0; pi = -1; }
      else { if (!stem.trim()) bad('اكتب نص السؤال'); if (opts.length < 2 || opts.some(o => !o.trim())) bad('اكتب كل الاختيارات'); if (!(t >= 0 && t < 20)) t = 0; if (!(pi >= -1)) pi = -1; }
      if (!(cor >= 0 && cor < opts.length)) bad('اختر الإجابة الصحيحة');
      return hint ? [id, sec, t, pi, stem, opts, cor, hint] : [id, sec, t, pi, stem, opts, cor];
    }
    if (kind === 's') { if (!(int(key) > 0)) bad(); const name = txt(d && d.name, 120).trim(); if (!name) bad('اكتب اسم القسم'); return { name }; }
    if (kind === 'p') { if (!(int(key) >= 0)) bad(); const t = txt(d, 20000).trim(); if (!t) bad('اكتب نص القطعة'); return t; }
    if (kind === 'o') { if (!(int(key) > 0) || !Array.isArray(d)) bad(); return d.slice(0, 5000).map(int).filter(x => x > 0); }
    if (kind === 'qq') { const n = int(key), cor = int(d && d[2]); if (!(n > 0) || !(cor >= 0 && cor < 4)) bad(); return [n, int(d[1]) || 0, cor]; }
    if (kind === 'qh') return txt(d, 2000).trim();
    if (kind === 'ah') { if (!(int(key) > 0)) bad(); return txt(d, 400).trim(); }
    if (kind === 'ai') { if (!(int(key) > 0) || !/^\/api\/exam\/img\/\d+$/.test(String(d || ''))) bad('ارفع صورة السؤال'); return String(d); }
    if (kind === 'ax') { if (!(int(key) > 0)) bad(); return 1; }
    if (kind === 'ak') { const n = int(key), cor = int(d); if (!(n > 0) || !(cor >= 0 && cor < 4)) bad(); return cor; }
    if (kind === 'r') { if (!Array.isArray(d)) bad(); const stem = txt(d[0], 2000).trim(), o = [1, 2, 3, 4].map(i => txt(d[i], 600).trim()), cor = int(d[5]); if (!stem) bad('اكتب نص السؤال'); if (o.some(x => !x)) bad('اكتب الاختيارات الأربعة'); if (!(cor >= 0 && cor < 4)) bad('اختر الإجابة الصحيحة'); return [stem, ...o, cor]; }
    if (kind === 'k') { if (!(int(key) > 0) || !LETTERS.includes(d)) bad(); return d; }
    bad();
  };
  // تقارير مقرر واحد: يراها المعلم المسند للمقرر والإدارة فقط
  if (p === 'admin/course/report' && m === 'GET') {
    const c = COURSE[new URL(request.url).searchParams.get('course')], R = c && await courseRights(c.slug);
    if (!R) return deny('هذا المقرر غير مسند لك');
    const pg = c.slug, since = new Date(now - 14 * 864e5).toISOString();
    const [sum, secs, students, subs, days, feed] = await Promise.all([
      one("SELECT COUNT(DISTINCT student_id) students,SUM(kind='open') opens,SUM(kind='attempt') attempts,ROUND(AVG(CASE WHEN kind='attempt' THEN score END)) avg,MAX(score) best FROM events WHERE page=?", pg),
      one('SELECT COALESCE(SUM(seconds),0) secs FROM usage WHERE page=?', pg),
      all("SELECT s.id,s.name,SUM(e.kind='open') opens,SUM(e.kind='attempt') attempts,ROUND(AVG(CASE WHEN e.kind='attempt' THEN e.score END)) avg,MAX(e.score) best,MAX(e.created_at) last,(SELECT COALESCE(SUM(u.seconds),0) FROM usage u WHERE u.student_id=s.id AND u.page=?) secs FROM events e JOIN students s ON s.id=e.student_id WHERE e.page=? GROUP BY s.id ORDER BY last DESC LIMIT 500", pg, pg),
      all("SELECT sub,COUNT(*) attempts,COUNT(DISTINCT student_id) students,ROUND(AVG(score)) avg,MAX(score) best FROM events WHERE page=? AND kind='attempt' GROUP BY sub ORDER BY attempts DESC LIMIT 60", pg),
      all("SELECT substr(created_at,1,10) day,COUNT(*) events,COUNT(DISTINCT student_id) students FROM events WHERE page=? AND created_at>? GROUP BY day ORDER BY day DESC", pg, since),
      all("SELECT s.name,e.kind,e.sub,e.score,e.created_at FROM events e JOIN students s ON s.id=e.student_id WHERE e.page=? ORDER BY e.id DESC LIMIT 30", pg)
    ]);
    // تعلّم الطلاب من تقدمهم المحفوظ على الخادم: الأقسام الأصعب، الأسئلة الأكثر خطأ، ودقة كل طالب
    let learn = null;
    const LK = { 'aksam kamy': { st: 'bw-stats-v1', er: 'quant-quiz-errors-v1', pl: 'k' }, 'aksam lafzi': { st: 'bwv-stats-v1', er: 'verbal-quiz-errors-v1', pl: 'v' } }[c.slug];
    if (LK) {
      try {
        await ensureProgressSchema(DB);
        const rows = await all('SELECT p.student_id sid,s.name,p.key,p.data,p.ts FROM student_progress p JOIN students s ON s.id=p.student_id WHERE p.key IN (?,?,?) LIMIT 6000', LK.st, LK.er, 'bw-place-v1');
        const per = {}, sec = {}, miss = {};
        const P = (sid, name) => per[sid] || (per[sid] = { id: sid, name, n: 0, g: 0, wk: 0, last: 0, errs: 0, weak: null, place: null });
        for (const r of rows) {
          let d; try { d = JSON.parse(r.data); } catch (e) { continue; }
          const x = P(r.sid, r.name); x.last = Math.max(x.last, r.ts || 0);
          if (r.key === LK.st) {
            for (const h of (Array.isArray(d.h) ? d.h : [])) { x.n += +h.n || 0; x.g += +h.g || 0; if (now - new Date(h.d).getTime() < 7 * 864e5) x.wk += +h.n || 0; }
            let wp = 2;
            for (const [k, v] of Object.entries(d.s || {})) {
              const t = +v.t || 0, cc = +v.c || 0; if (!t || +k >= 1000) continue;
              const S2 = sec[k] || (sec[k] = { id: +k, t: 0, c: 0, students: 0 }); S2.t += t; S2.c += cc; S2.students++;
              if (t >= 5 && cc / t < wp) { wp = cc / t; x.weak = { id: +k, p: Math.round(cc / t * 100) }; }
            }
          } else if (r.key === LK.er) {
            for (const e of Object.values(d || {})) { if (!e || !(e.id < 100000)) continue; x.errs++; const M = miss[e.id] || (miss[e.id] = { id: e.id, sectionId: e.sectionId, students: 0 }); M.students++; }
          } else if (Array.isArray(d) && d.length) { const L2 = d[d.length - 1]; x.place = { lvl: txt(L2.lvl, 30), p: +L2[LK.pl] || 0, d: L2.d }; }
        }
        const list = Object.values(per).filter(x => x.n || x.errs || x.place).sort((a2, b2) => b2.last - a2.last).slice(0, 500);
        learn = {
          students: list.map(x => ({ ...x, acc: x.n ? Math.round(x.g / x.n * 100) : null })),
          hardest: Object.values(sec).filter(x => x.t >= 10).map(x => ({ ...x, p: Math.round(x.c / x.t * 100) })).sort((a2, b2) => a2.p - b2.p).slice(0, 12),
          missed: Object.values(miss).filter(x => x.students >= 2).sort((a2, b2) => b2.students - a2.students).slice(0, 15),
          active7: list.filter(x => x.wk > 0).length
        };
      } catch (e) { learn = null; }
    }
    return J({ course: { slug: c.slug, title: c.title }, summary: { ...sum, secs: secs.secs }, students, subs, days, feed, learn });
  }
  if (p === 'admin/exam/save' && m === 'POST') {
    const b = await body(), c = COURSE[b.course], R = c && await courseRights(c.slug);
    if (!R) return deny('ليس لديك صلاحية على هذا المقرر');
    const ops = (Array.isArray(b.ops) ? b.ops : []).slice(0, 400);
    if (!ops.length) return J({ error: 'لا توجد تغييرات' }, 400);
    let base = null; try { base = await baseOf(c); } catch (e) { base = null; }
    const rows = {}; for (const r of await all('SELECT kind,key,deleted FROM exam_patch WHERE course=?', c.slug)) rows[r.kind + '|' + r.key] = r;
    const inBase = (kind, key) => {
      if (!base) return undefined;
      if (kind === 'q') return base.q.includes(int(key));
      if (kind === 's') return base.s.includes(int(key));
      if (kind === 'p') return int(key) < base.p;
      if (kind === 'qq') return base.qq.includes(int(key));
      if (kind === 'r') return /^\d+$/.test(key) && int(key) < base.n;
      if (kind === 'k') return int(key) >= 1 && int(key) <= base.n;
      if (['ak', 'ah', 'ai', 'ax'].includes(kind)) return base.q ? base.q.includes(int(key)) : undefined;
      return true;
    };
    const exists = (kind, key) => { const r = rows[kind + '|' + key]; if (r) return !r.deleted; return inBase(kind, key); };
    const st = [], count = { edit: 0, add: 0, delete: 0 }, NAMES = { edit: 'التعديل', add: 'الإضافة', delete: 'الحذف' };
    try {
      for (const o of ops) {
        const kind = String(o.kind || ''), key = txt(o.key, 40);
        if (!KINDS[c.model].includes(kind) || !key) return J({ error: 'عملية غير صالحة' }, 400);
        let act = (o.data === null || o.act === 'delete') ? 'delete' : o.act === 'add' ? 'add' : 'edit';
        if (['o', 'qh', 'k', 'ak', 'ah', 'ai', 'ax'].includes(kind) && act !== 'edit') act = 'edit';
        if (kind === 'ax' && !R.delete) return deny('إخفاء سؤال يحتاج صلاحية الحذف');
        if (kind === 'qq' && act === 'add') return J({ error: 'لا يمكن إضافة أسئلة لهذا الجزء' }, 400);
        const ex = exists(kind, key);
        if (act === 'add' && ex === true) return J({ error: 'الرقم ' + key + ' مستخدم بالفعل. حدّث الصفحة وحاول مرة أخرى.' }, 409);
        if (act !== 'add' && ex === false) return J({ error: 'العنصر ' + key + ' غير موجود (ربما حُذف). حدّث الصفحة.' }, 404);
        if (!R[act]) return deny('صلاحيتك في هذا المقرر لا تشمل ' + NAMES[act]);
        const data = act === 'delete' ? null : JSON.stringify(cleanOp(c, kind, key, o.data));
        count[act]++;
        st.push(DB.prepare('INSERT INTO exam_patch (course,kind,key,data,deleted,created_at,updated_at,updated_by) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(course,kind,key) DO UPDATE SET data=excluded.data,deleted=excluded.deleted,updated_at=excluded.updated_at,updated_by=excluded.updated_by').bind(c.slug, kind, key, data, act === 'delete' ? 1 : 0, iso, iso, A.name));
      }
    } catch (e) { return J({ error: e.message || 'بيانات غير صالحة' }, 400); }
    st.push(audit(A, 'content', 'course', null, c.title + ' — ' + [count.edit ? 'تعديل ' + count.edit : '', count.add ? 'إضافة ' + count.add : '', count.delete ? 'حذف ' + count.delete : ''].filter(Boolean).join('، ')));
    await DB.batch(st);
    return J({ ok: 1 });
  }
  if (p === 'admin/exam/reports' && m === 'GET') {
    await ensureMoodleSchema(DB);
    const c = COURSE[new URL(request.url).searchParams.get('course')], R = c && await courseRights(c.slug);
    if (!R) return deny('ليس لديك صلاحية على هذا المقرر');
    return J({ reports: await all("SELECT r.id,r.qkey,r.reason,r.note,r.created_at,r.status,s.name student FROM question_reports r LEFT JOIN students s ON s.id=r.student_id WHERE r.course=? AND r.status='open' ORDER BY r.id DESC LIMIT 200", c.slug) });
  }
  if (p === 'admin/exam/report-close' && m === 'POST') {
    await ensureMoodleSchema(DB);
    const b = await body(), r = await one('SELECT course FROM question_reports WHERE id=?', int(b.id));
    if (!r || !(await courseRights(r.course))) return deny();
    await DB.prepare("UPDATE question_reports SET status='closed',handled_by=?,handled_at=? WHERE id=?").bind(A.name, iso, int(b.id)).run();
    return J({ ok: 1 });
  }
  if (p === 'admin/exam/upload' && m === 'POST') {
    const b = await body(), c = COURSE[b.course], R = c && await courseRights(c.slug);
    if (!R || !(R.edit || R.add)) return deny('ليس لديك صلاحية على هذا المقرر');
    const mm = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(String(b.data || ''));
    if (!mm) return J({ error: 'الصورة غير صالحة' }, 400);
    const bin = atob(mm[2]); if (bin.length > 1500000) return J({ error: 'حجم الصورة كبير، الحد الأقصى ١٫٥ ميجابايت' }, 400);
    const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const r = await DB.prepare('INSERT INTO exam_images (course,mime,data,created_at,created_by) VALUES (?,?,?,?,?)').bind(c.slug, mm[1], bytes.buffer, iso, A.name).run();
    return J({ ok: 1, id: r.meta.last_row_id, src: '/api/exam/img/' + r.meta.last_row_id });
  }
  if (p === 'admin/exam/history' && m === 'GET') {
    const c = COURSE[new URL(request.url).searchParams.get('course')], R = c && await courseRights(c.slug);
    if (!R) return deny('ليس لديك صلاحية على هذا المقرر');
    return J({ history: await all('SELECT kind,key,deleted,updated_at,updated_by FROM exam_patch WHERE course=? ORDER BY updated_at DESC LIMIT 300', c.slug) });
  }
  if (p === 'admin/exam/revert' && m === 'POST') {
    const b = await body(), c = COURSE[b.course], R = c && await courseRights(c.slug), kind = String(b.kind || ''), key = txt(b.key, 40);
    if (!R) return deny('ليس لديك صلاحية على هذا المقرر');
    let base = null; try { base = await baseOf(c); } catch (e) { }
    const added = base && ((kind === 'q' && !base.q.includes(int(key))) || (kind === 's' && !base.s.includes(int(key))) || (kind === 'r' && !(/^\d+$/.test(key) && int(key) < base.n)));
    if (added ? !R.delete : !R.edit) return deny(added ? 'الرجوع هنا يحذف عنصرًا مضافًا، ويحتاج صلاحية الحذف' : 'ليس لديك صلاحية التعديل في هذا المقرر');
    await DB.batch([DB.prepare('DELETE FROM exam_patch WHERE course=? AND kind=? AND key=?').bind(c.slug, kind, key), audit(A, 'revert', 'course', null, c.title + ' — ' + kind + ' ' + key)]);
    return J({ ok: 1 });
  }
  if (p === 'admin/courses/assign' && m === 'POST') {
    if (!isSuper) return deny('إسناد المقررات من صلاحيات الإدارة العامة فقط');
    const b = await body(), c = COURSE[b.course], sid = int(b.staff_id);
    const u = c && sid > 0 && await one('SELECT name,role FROM staff_users WHERE id=?', sid);
    if (!u) return J({ error: 'اختر المقرر والمعلم' }, 400);
    await DB.batch([DB.prepare('INSERT INTO course_staff (course,staff_id,can_edit,can_add,can_delete,created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(course,staff_id) DO UPDATE SET can_edit=excluded.can_edit,can_add=excluded.can_add,can_delete=excluded.can_delete').bind(c.slug, sid, b.can_edit ? 1 : 0, b.can_add ? 1 : 0, b.can_delete ? 1 : 0, iso),
      audit(A, 'course_assign', 'staff', sid, c.title + ' — ' + u.name + ' (' + [b.can_edit ? 'تعديل' : '', b.can_add ? 'إضافة' : '', b.can_delete ? 'حذف' : ''].filter(Boolean).join('، ') + ')')]);
    return J({ ok: 1 });
  }
  if (p === 'admin/courses/remove' && m === 'POST') {
    if (!isSuper) return deny('إسناد المقررات من صلاحيات الإدارة العامة فقط');
    const b = await body(), c = COURSE[b.course], sid = int(b.staff_id);
    if (!c || !(sid > 0)) return J({ error: 'بيانات غير صحيحة' }, 400);
    await DB.batch([DB.prepare('DELETE FROM course_staff WHERE course=? AND staff_id=?').bind(c.slug, sid), audit(A, 'course_remove', 'staff', sid, c.title)]);
    return J({ ok: 1 });
  }

  // ---------- حسابي ----------
  if (p === 'admin/me/password' && m === 'POST') {
    if (A.type !== 'staff') return J({ error: 'كلمة مرور المدير العام القديم تُغيَّر من إعدادات Cloudflare (ADMIN_PASSWORD).' }, 400);
    const b = await body(), u = await one('SELECT * FROM staff_users WHERE id=?', A.id);
    if (!(await passwordMatches(String(b.current || ''), u.password_hash))) return J({ error: 'كلمة المرور الحالية غير صحيحة' }, 400);
    if (String(b.password || '').length < 8) return J({ error: 'كلمة المرور الجديدة يجب ألا تقل عن ٨ أحرف' }, 400);
    await DB.batch([
      DB.prepare('UPDATE staff_users SET password_hash=? WHERE id=?').bind(await passwordHash(String(b.password)), A.id),
      DB.prepare('DELETE FROM staff_sessions WHERE staff_id=? AND token_hash<>?').bind(A.id, await sessionHash(staffToken)),
      audit(A, 'password', 'staff', A.id, 'تغيير كلمة المرور')]);
    return J({ ok: 1 });
  }

  // ---------- فريق العمل (الإدارة العامة فقط) ----------
  const staffList = async () => {
    const users = await all('SELECT id,name,username,role,status,created_at,last_seen FROM staff_users ORDER BY id DESC');
    const rows = await all('SELECT staff_id,perm FROM staff_perms');
    return users.map(u => ({ ...u, perms: u.role === 'super_admin' ? ALL_PERMS : cleanPerms(rows.filter(r => r.staff_id === u.id).map(r => r.perm)) }));
  };
  const writeCourses = (id, list) => [DB.prepare('DELETE FROM course_staff WHERE staff_id=?').bind(id)].concat((Array.isArray(list) ? list : []).filter(x => x && COURSE[x.course]).map(x => DB.prepare('INSERT OR REPLACE INTO course_staff (course,staff_id,can_edit,can_add,can_delete,created_at) VALUES (?,?,?,?,?,?)').bind(x.course, id, x.can_edit ? 1 : 0, x.can_add ? 1 : 0, x.can_delete ? 1 : 0, iso)));
  const writePerms = (id, list) => [DB.prepare('DELETE FROM staff_perms WHERE staff_id=?').bind(id)].concat(cleanPerms(list).map(x => DB.prepare('INSERT INTO staff_perms (staff_id,perm) VALUES (?,?)').bind(id, x)));
  if (p === 'admin/staff' && m === 'GET') { if (!isSuper) return deny(); return J({ staff: await staffList() }); }
  if (p === 'admin/staff/add' && m === 'POST') {
    if (!isSuper) return deny();
    const b = await body(), name = String(b.name || '').trim().slice(0, 80), username = String(b.username || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40), password = String(b.password || ''), role = ROLES[b.role] ? b.role : 'teacher';
    if (name.length < 2 || username.length < 3 || password.length < 8) return J({ error: 'أدخل اسمًا، واسم مستخدم إنجليزيًا من ٣ أحرف على الأقل، وكلمة مرور لا تقل عن ٨ أحرف' }, 400);
    if (await one('SELECT id FROM staff_users WHERE username=?', username)) return J({ error: 'اسم المستخدم مستخدم بالفعل' }, 409);
    try {
      const r = await DB.prepare('INSERT INTO staff_users (name,username,password_hash,role,status,created_at) VALUES (?,?,?,?,?,?)').bind(name, username, await passwordHash(password), role, 'active', iso).run();
      const id = r.meta.last_row_id;
      await DB.batch(writePerms(id, Array.isArray(b.perms) ? b.perms : ROLES[role].perms).concat(Array.isArray(b.courses) ? writeCourses(id, b.courses) : [], audit(A, 'create', 'staff', id, `${username} (${ROLES[role].label})` + (Array.isArray(b.courses) && b.courses.length ? ' — ' + b.courses.map(x => (COURSE[x.course] || {}).title).filter(Boolean).join('، ') : ''))));
      return J({ ok: 1, id });
    } catch (e) {
      const text = String(e && e.message || e);
      return J({ error: /unique|constraint/i.test(text) ? 'اسم المستخدم مستخدم بالفعل' : 'تعذر إنشاء الحساب: ' + text.slice(0, 120) }, /unique|constraint/i.test(text) ? 409 : 500);
    }
  }
  if (p === 'admin/staff/update' && m === 'POST') {
    if (!isSuper) return deny();
    const b = await body(), id = +b.id, u = await one('SELECT * FROM staff_users WHERE id=?', id);
    if (!u) return J({ error: 'الحساب غير موجود' }, 404);
    const role = ROLES[b.role] ? b.role : u.role, status = b.status === undefined ? u.status : (b.status === 'blocked' ? 'blocked' : 'active'), name = String(b.name || u.name).trim().slice(0, 80);
    if (A.type === 'staff' && id === A.id && (status === 'blocked' || role !== 'super_admin')) return J({ error: 'لا يمكنك إيقاف حسابك أو سحب صلاحية الإدارة من نفسك' }, 400);
    if (b.password && String(b.password).length < 8) return J({ error: 'كلمة المرور يجب ألا تقل عن ٨ أحرف' }, 400);
    const st = [DB.prepare('UPDATE staff_users SET name=?,role=?,status=? WHERE id=?').bind(name, role, status, id)];
    if (b.password) st.push(DB.prepare('UPDATE staff_users SET password_hash=? WHERE id=?').bind(await passwordHash(String(b.password)), id));
    if (b.password || status === 'blocked') st.push(DB.prepare('DELETE FROM staff_sessions WHERE staff_id=?').bind(id));
    if (Array.isArray(b.perms)) st.push(...writePerms(id, b.perms));
    if (Array.isArray(b.courses)) st.push(...writeCourses(id, b.courses));
    const what = [Array.isArray(b.courses) ? 'المقررات: ' + (b.courses.map(x => (COURSE[x.course] || {}).title).filter(Boolean).join('، ') || 'لا شيء') : '', u.role !== role ? 'الدور: ' + ROLES[role].label : '', u.status !== status ? (status === 'blocked' ? 'إيقاف' : 'تفعيل') : '', b.password ? 'كلمة مرور جديدة' : '', Array.isArray(b.perms) ? 'الصلاحيات: ' + cleanPerms(b.perms).length : ''].filter(Boolean).join('، ');
    st.push(audit(A, 'update', 'staff', id, `${u.username} — ${what || 'تعديل'}`));
    await DB.batch(st);
    return J({ ok: 1 });
  }
  if (p === 'admin/staff/delete' && m === 'POST') {
    if (!isSuper) return deny();
    const id = +((await body()).id), u = await one('SELECT username FROM staff_users WHERE id=?', id);
    if (!id || (A.type === 'staff' && id === A.id)) return J({ error: 'لا يمكن حذف الحساب الحالي' }, 400);
    await DB.batch([DB.prepare('DELETE FROM staff_sessions WHERE staff_id=?').bind(id), DB.prepare('DELETE FROM staff_perms WHERE staff_id=?').bind(id), DB.prepare('DELETE FROM staff_permissions WHERE staff_id=?').bind(id), DB.prepare('DELETE FROM course_staff WHERE staff_id=?').bind(id), DB.prepare('DELETE FROM staff_users WHERE id=?').bind(id), audit(A, 'delete', 'staff', id, u ? u.username : '')]);
    return J({ ok: 1 });
  }
  // ---------- مراجعة مفاتيح الإجابات: أسئلة يُشك في إجابتها، تُعتمد كما هي أو تُصحَّح من مكان واحد ----------
  if (p.startsWith('admin/review')) {
    await DB.prepare("CREATE TABLE IF NOT EXISTS qreview (course TEXT NOT NULL, qkey TEXT NOT NULL, note TEXT, status TEXT NOT NULL DEFAULT 'open', old_c INTEGER, new_c INTEGER, added_by TEXT, resolved_by TEXT, created_at TEXT NOT NULL, resolved_at TEXT, PRIMARY KEY (course, qkey))").run();
    const RC = ['aksam kamy', 'aktar kamy'], mine = {};
    for (const c of RC) { const r = await courseRights(c); if (r) mine[c] = r; }
    if (!Object.keys(mine).length) return deny('لا توجد مقررات مسندة لك');
    if (p === 'admin/review' && m === 'GET') {
      const st0 = [];
      for (const c of Object.keys(REVIEW_SEED)) for (const k of Object.keys(REVIEW_SEED[c])) st0.push(DB.prepare("INSERT OR IGNORE INTO qreview (course,qkey,note,status,added_by,created_at) VALUES (?,?,?,'open','مراجعة آلية',?)").bind(c, k, REVIEW_SEED[c][k], iso));
      for (let i = 0; i < st0.length; i += 90) await DB.batch(st0.slice(i, i + 90));
      const rows = await all('SELECT * FROM qreview WHERE course IN (' + Object.keys(mine).map(() => '?').join(',') + ') ORDER BY CASE status WHEN \'open\' THEN 0 ELSE 1 END, course, CAST(qkey AS INTEGER)', ...Object.keys(mine));
      const cur = {};
      for (const c of Object.keys(mine)) { const its = await bankItems(env, request, DB, c); cur[c] = Object.fromEntries(its.map(x => [x.key, x])); }
      return J({ courses: Object.keys(mine).map(c => ({ slug: c, title: COURSE[c].title, edit: !!mine[c].edit, url: '/' + c })), items: rows.map(r => { const it = (cur[r.course] || {})[r.qkey]; return { course: r.course, key: r.qkey, note: r.note, status: r.status, old_c: r.old_c, new_c: r.new_c, by: r.resolved_by || r.added_by, at: r.resolved_at || r.created_at, c: it ? it.c : null, h: it ? it.h || '' : '', hedit: !!(COURSE[r.course].model === 'static' || COURSE[r.course].hints), img: it ? it.img : null, sec: it ? it.sec : '', gone: !it }; }) });
    }
    const b = await body(), c = String(b.course || ''), key = String(int(b.key) || ''), R = mine[c];
    if (!R) return deny('ليس لديك صلاحية على هذا المقرر');
    if (!key) return J({ error: 'رقم السؤال غير صحيح' }, 400);
    if (p === 'admin/review/add' && m === 'POST') {
      const its = await bankItems(env, request, DB, c); if (!its.some(x => x.key === key)) return J({ error: 'السؤال رقم ' + key + ' غير موجود في هذا المقرر' }, 404);
      await DB.batch([DB.prepare("INSERT INTO qreview (course,qkey,note,status,added_by,created_at) VALUES (?,?,?,'open',?,?) ON CONFLICT(course,qkey) DO UPDATE SET note=excluded.note,status='open',resolved_by=NULL,resolved_at=NULL").bind(c, key, txt(b.note, 400).trim() || null, A.name, iso), audit(A, 'review_add', 'question', int(key), COURSE[c].title + ' #' + key)]);
      return J({ ok: 1 });
    }
    // تعديل سطر الإرشاد للسؤال من صفحة المراجعة
    if (p === 'admin/review/hint' && m === 'POST') {
      if (!R.edit) return deny('صلاحيتك في هذا المقرر لا تشمل التعديل');
      const its = await bankItems(env, request, DB, c), it = its.find(x => x.key === key);
      if (!it) return J({ error: 'السؤال غير موجود' }, 404);
      const hint = txt(b.hint, 400).trim().replace(/\s+/g, ' ');
      let kind = 'ah', data = hint;
      if (COURSE[c].model === 'bank') {
        if (!COURSE[c].hints) return J({ error: 'هذا المقرر لا يدعم الإرشادات' }, 400);
        const res = await fetchAsset(env, request, COURSE[c].file), html = res ? await res.text() : '', a0 = html.indexOf('<script id="db" type="application/json">'), z0 = a0 < 0 ? -1 : html.indexOf('</script>', a0);
        if (a0 < 0 || z0 < 0) return J({ error: 'تعذّر قراءة أسئلة المقرر' }, 500);
        let row = JSON.parse(html.slice(a0 + 40, z0)).qs.find(x => String(x[0]) === key) || null;
        const pr = await one("SELECT data,deleted FROM exam_patch WHERE course=? AND kind='q' AND key=?", c, key);
        if (pr && !pr.deleted && pr.data) row = JSON.parse(pr.data);
        if (!row) return J({ error: 'السؤال غير موجود' }, 404);
        row = row.slice(0, 7); if (hint) row[7] = hint; kind = 'q'; data = cleanOp(COURSE[c], 'q', key, row);
      } else data = cleanOp(COURSE[c], 'ah', key, hint);
      await DB.batch([
        DB.prepare('INSERT INTO exam_patch (course,kind,key,data,deleted,created_at,updated_at,updated_by) VALUES (?,?,?,?,0,?,?,?) ON CONFLICT(course,kind,key) DO UPDATE SET data=excluded.data,deleted=0,updated_at=excluded.updated_at,updated_by=excluded.updated_by').bind(c, kind, key, JSON.stringify(data), iso, iso, A.name),
        audit(A, 'review_hint', 'question', int(key), COURSE[c].title + ' #' + key + ' — تعديل الإرشاد')]);
      return J({ ok: 1, h: hint });
    }
    if (p === 'admin/review/resolve' && m === 'POST') {
      if (!R.edit) return deny('صلاحيتك في هذا المقرر لا تشمل التعديل');
      const its = await bankItems(env, request, DB, c), it = its.find(x => x.key === key);
      if (!it) return J({ error: 'السؤال غير موجود' }, 404);
      const want = b.correct === undefined || b.correct === null ? null : int(b.correct);
      const st = [];
      if (b.status === 'open') {
        st.push(DB.prepare("UPDATE qreview SET status='open',resolved_by=NULL,resolved_at=NULL WHERE course=? AND qkey=?").bind(c, key));
      } else if (want === null || want === it.c) {
        st.push(DB.prepare("UPDATE qreview SET status='ok',old_c=?,new_c=?,resolved_by=?,resolved_at=? WHERE course=? AND qkey=?").bind(it.c, it.c, A.name, iso, c, key));
        st.push(audit(A, 'review_ok', 'question', int(key), COURSE[c].title + ' #' + key + ' — الإجابة معتمدة'));
      } else {
        if (!(want >= 0 && want < 4)) return J({ error: 'اختر الإجابة الصحيحة' }, 400);
        let kind = 'ak', data = want;
        if (COURSE[c].model === 'bank') {
          const res = await fetchAsset(env, request, COURSE[c].file), html = res ? await res.text() : '', a0 = html.indexOf('<script id="db" type="application/json">'), z0 = a0 < 0 ? -1 : html.indexOf('</script>', a0);
          if (a0 < 0 || z0 < 0) return J({ error: 'تعذّر قراءة أسئلة المقرر' }, 500);
          let row = JSON.parse(html.slice(a0 + 40, z0)).qs.find(x => String(x[0]) === key) || null;
          const pr = await one("SELECT data,deleted FROM exam_patch WHERE course=? AND kind='q' AND key=?", c, key);
          if (pr && !pr.deleted && pr.data) row = JSON.parse(pr.data);
          if (!row) return J({ error: 'السؤال غير موجود' }, 404);
          row = row.slice(); row[6] = want; kind = 'q'; data = cleanOp(COURSE[c], 'q', key, row);
        }
        st.push(DB.prepare('INSERT INTO exam_patch (course,kind,key,data,deleted,created_at,updated_at,updated_by) VALUES (?,?,?,?,0,?,?,?) ON CONFLICT(course,kind,key) DO UPDATE SET data=excluded.data,deleted=0,updated_at=excluded.updated_at,updated_by=excluded.updated_by').bind(c, kind, key, JSON.stringify(data), iso, iso, A.name));
        st.push(DB.prepare("UPDATE qreview SET status='fixed',old_c=?,new_c=?,resolved_by=?,resolved_at=? WHERE course=? AND qkey=?").bind(it.c, want, A.name, iso, c, key));
        st.push(audit(A, 'review_fix', 'question', int(key), COURSE[c].title + ' #' + key + ' — الإجابة من ' + 'أبجد'[it.c] + ' إلى ' + 'أبجد'[want]));
      }
      await DB.batch(st);
      return J({ ok: 1 });
    }
    return J({ error: 'not found' }, 404);
  }
  // ---------- بنك الأسئلة الموحد ----------
  if (p.startsWith('admin/bank')) {
    if (!can('bank.view')) return deny();
    await ensureBankSchema(DB); await ensureSkillsSchema(DB); await ensureStaffSchema(DB);
    const imgOf = r => r.image_id ? '/api/exam/img/' + r.image_id : r.image_url || null;
    const shape = r => ({ id: r.id, subject: r.subject, skill_id: r.skill_id, difficulty: r.difficulty, source: r.source, stem: r.stem, passage: r.passage, img: imgOf(r), image_id: r.image_id, image_url: r.image_url, options: JSON.parse(r.options), correct: JSON.parse(r.correct), multi: !!r.multi, explanation: r.explanation, status: r.status, hash: r.hash, ext_ref: r.ext_ref, updated_at: r.updated_at });
    if (p === 'admin/bank/meta' && m === 'GET') {
      const [counts, sources, issues] = await Promise.all([
        all("SELECT subject,status,COUNT(*) n,SUM(skill_id IS NULL) unskilled FROM qbank GROUP BY subject,status"),
        all("SELECT subject,source,COUNT(*) n FROM qbank WHERE source IS NOT NULL GROUP BY subject,source ORDER BY source"),
        all("SELECT subject,SUM(correct='[]') nocorrect,SUM(hash IS NULL) nohash FROM qbank GROUP BY subject")
      ]);
      const skills = await all('SELECT id,subject,name,sort FROM skills ORDER BY subject,sort,id');
      return J({ subjects: SUBJECTS, counts, sources, issues, skills, perms: { edit: can('bank.edit'), import: can('bank.import'), del: can('bank.delete'), legacy: isSuper } });
    }
    if (p === 'admin/bank/list' && m === 'GET') {
      const u = new URL(request.url).searchParams, w = ['1=1'], v = [];
      if (SUBJECTS[u.get('subject')]) { w.push('subject=?'); v.push(u.get('subject')); }
      const sk = u.get('skill'); if (sk === 'none') w.push('skill_id IS NULL'); else if (int(sk) > 0) { w.push('skill_id=?'); v.push(int(sk)); }
      if (u.get('source')) { w.push('source=?'); v.push(u.get('source')); }
      const stt = u.get('status'); if (['active', 'draft'].includes(stt)) { w.push('status=?'); v.push(stt); }
      const iss = u.get('issue'); if (iss === 'nocorrect') w.push("correct='[]'"); else if (iss === 'short') w.push("json_array_length(options)<4"); else if (iss === 'multi') w.push('multi=1');
      const q = String(u.get('q') || '').trim(); if (q) { if (/^\d+$/.test(q)) { w.push('(id=? OR ext_ref LIKE ?)'); v.push(int(q), '%:' + q); } else { w.push('(stem LIKE ? OR passage LIKE ? OR options LIKE ? OR source LIKE ?)'); v.push('%' + q + '%', '%' + q + '%', '%' + q + '%', '%' + q + '%'); } }
      const size = Math.min(100, Math.max(10, int(u.get('size')) || 40)), page = Math.max(0, int(u.get('page')) || 0);
      const where = w.join(' AND ');
      const [tot, rows] = await Promise.all([one('SELECT COUNT(*) n FROM qbank WHERE ' + where, ...v), all('SELECT * FROM qbank WHERE ' + where + ' ORDER BY id LIMIT ? OFFSET ?', ...v, size, page * size)]);
      return J({ total: tot.n, page, size, items: rows.map(shape) });
    }
    if (p === 'admin/bank/get' && m === 'GET') {
      const r = await one('SELECT * FROM qbank WHERE id=?', int(new URL(request.url).searchParams.get('id')));
      return r ? J({ item: shape(r) }) : J({ error: 'غير موجود' }, 404);
    }
    if (p === 'admin/bank/image' && m === 'POST') {
      if (!can('bank.import') && !can('bank.edit')) return deny();
      const b = await body(), mm = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(String(b.data || ''));
      if (!mm) return J({ error: 'الصورة غير صالحة' }, 400);
      const bin = atob(mm[2]); if (bin.length > 1500000) return J({ error: 'حجم الصورة كبير، الحد الأقصى ١٫٥ ميجابايت' }, 400);
      const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const r = await DB.prepare('INSERT INTO exam_images (course,mime,data,created_at,created_by) VALUES (?,?,?,?,?)').bind('bank', mm[1], bytes.buffer, iso, A.name).run();
      return J({ ok: 1, id: r.meta.last_row_id, src: '/api/exam/img/' + r.meta.last_row_id });
    }
    // كشف التكرار قبل الإضافة: النصوص هنا (بعد التطبيع)، وبصمات الصور تُرسل للمتصفح ليقارنها هو (أخف على الخادم)
    if (p === 'admin/bank/check' && m === 'POST') {
      const b = await body(), sub = String(b.subject || ''), list = (Array.isArray(b.items) ? b.items : []).slice(0, 2000);
      const have = await all("SELECT id,hash,source FROM qbank WHERE subject=? AND hash IS NOT NULL", sub);
      const txtMap = Object.fromEntries(have.filter(r => r.hash.startsWith('t:')).map(r => [r.hash, r]));
      const out = [];
      for (const it of list) {
        if (!it || !it.stem || it.hash) { out.push(null); continue; }
        const h = await textHash(it.stem, it.options), r = txtMap[h];
        out.push(r ? { id: r.id, source: r.source, hash: h } : { hash: h });
      }
      return J({ results: out, images: b.withImages ? have.filter(r => !r.hash.startsWith('t:')).map(r => [r.id, r.hash]) : undefined });
    }
    if (p === 'admin/bank/import' && m === 'POST') {
      if (!can('bank.import')) return deny();
      const b = await body(), list = (Array.isArray(b.items) ? b.items : []).slice(0, 50), ids = [], errors = [];
      const skills = Object.fromEntries((await all('SELECT id,subject,name FROM skills')).map(x => [x.subject + '|' + normAr(x.name), x.id]));
      const st = [];
      for (let i = 0; i < list.length; i++) {
        try {
          const raw = list[i] || {};
          if (!raw.skill_id && raw.skill_name) raw.skill_id = skills[raw.subject + '|' + normAr(raw.skill_name)] || null;
          const q = cleanQ(raw); if (!q.hash && q.stem && !q.image_id && !q.image_url) q.hash = await textHash(q.stem, JSON.parse(q.options));
          const ext = raw.ext_ref ? txt(raw.ext_ref, 80) : null;
          st.push(DB.prepare('INSERT INTO qbank (subject,skill_id,difficulty,source,stem,passage,image_id,image_url,options,correct,multi,explanation,status,hash,ext_ref,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(ext_ref) DO NOTHING').bind(q.subject, q.skill_id, q.difficulty, q.source, q.stem, q.passage, q.image_id, q.image_url, q.options, q.correct, q.multi, q.explanation, q.status, q.hash, ext, A.name, iso, iso));
        } catch (e) { errors.push({ i, error: e.message }); }
      }
      if (st.length) { const res = await DB.batch(st); res.forEach(r => ids.push(r.meta && r.meta.changes ? r.meta.last_row_id : null)); }
      if (st.length) await audit(A, 'bank_import', 'qbank', null, (list[0] && list[0].source || '') + ' — ' + ids.filter(Boolean).length + ' سؤال').run();
      return J({ ok: 1, added: ids.filter(Boolean).length, ids, errors });
    }
    if (p === 'admin/bank/save' && m === 'POST') {
      const b = await body(), id = int(b.id);
      if (id ? !can('bank.edit') : !can('bank.import')) return deny();
      let q; try { q = cleanQ(b); } catch (e) { return J({ error: e.message }, 400); }
      if (!q.hash && q.stem && !q.image_id && !q.image_url) q.hash = await textHash(q.stem, JSON.parse(q.options));
      if (id) {
        const old = await one('SELECT id,hash,image_id,image_url FROM qbank WHERE id=?', id); if (!old) return J({ error: 'غير موجود' }, 404);
        if (!q.hash && (old.image_id === q.image_id && old.image_url === q.image_url)) q.hash = old.hash;
        await DB.batch([DB.prepare('UPDATE qbank SET subject=?,skill_id=?,difficulty=?,source=?,stem=?,passage=?,image_id=?,image_url=?,options=?,correct=?,multi=?,explanation=?,status=?,hash=?,updated_at=? WHERE id=?').bind(q.subject, q.skill_id, q.difficulty, q.source, q.stem, q.passage, q.image_id, q.image_url, q.options, q.correct, q.multi, q.explanation, q.status, q.hash, iso, id), audit(A, 'bank_edit', 'qbank', id, (q.source || '') + ' #' + id)]);
        return J({ ok: 1, id });
      }
      const r = await DB.prepare('INSERT INTO qbank (subject,skill_id,difficulty,source,stem,passage,image_id,image_url,options,correct,multi,explanation,status,hash,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(q.subject, q.skill_id, q.difficulty, q.source, q.stem, q.passage, q.image_id, q.image_url, q.options, q.correct, q.multi, q.explanation, q.status, q.hash, A.name, iso, iso).run();
      return J({ ok: 1, id: r.meta.last_row_id });
    }
    if (p === 'admin/bank/bulk' && m === 'POST') {
      if (!can('bank.edit')) return deny();
      const b = await body(), ids = (Array.isArray(b.ids) ? b.ids : []).map(int).filter(x => x > 0).slice(0, 2000), set = b.set || {}, sets = [], vals = [];
      if ('skill_id' in set) { sets.push('skill_id=?'); vals.push(set.skill_id ? int(set.skill_id) : null); }
      if ('difficulty' in set) { sets.push('difficulty=?'); vals.push(Math.max(0, Math.min(3, int(set.difficulty) || 0))); }
      if ('status' in set && ['active', 'draft'].includes(set.status)) { sets.push('status=?'); vals.push(set.status); }
      if ('source' in set) { sets.push('source=?'); vals.push(txt(set.source, 120).trim() || null); }
      if (!ids.length || !sets.length) return J({ error: 'لا يوجد ما يُحدَّث' }, 400);
      const st = []; for (let i = 0; i < ids.length; i += 90) { const part = ids.slice(i, i + 90); st.push(DB.prepare('UPDATE qbank SET ' + sets.join(',') + ',updated_at=? WHERE id IN (' + part.map(() => '?').join(',') + ')').bind(...vals, iso, ...part)); }
      await DB.batch(st.concat(audit(A, 'bank_bulk', 'qbank', null, ids.length + ' سؤال: ' + Object.keys(set).join('، '))));
      return J({ ok: 1, n: ids.length });
    }
    if (p === 'admin/bank/sethash' && m === 'POST') {
      if (!can('bank.edit') && !can('bank.import')) return deny();
      const b = await body(), list = (Array.isArray(b.items) ? b.items : []).filter(x => x && int(x.id) > 0 && /^[0-9a-f]{16}$/.test(x.hash || '')).slice(0, 500);
      if (list.length) await DB.batch(list.map(x => DB.prepare('UPDATE qbank SET hash=? WHERE id=?').bind(x.hash, int(x.id))));
      return J({ ok: 1, n: list.length });
    }
    if (p === 'admin/bank/delete' && m === 'POST') {
      if (!can('bank.delete')) return deny();
      const b = await body(), ids = (Array.isArray(b.ids) ? b.ids : []).map(int).filter(x => x > 0).slice(0, 2000);
      const st = []; for (let i = 0; i < ids.length; i += 90) { const part = ids.slice(i, i + 90); st.push(DB.prepare('DELETE FROM qbank WHERE id IN (' + part.map(() => '?').join(',') + ')').bind(...part)); }
      if (st.length) await DB.batch(st.concat(audit(A, 'bank_delete', 'qbank', null, ids.length + ' سؤال')));
      return J({ ok: 1, n: ids.length });
    }
    // نقل أسئلة الصفحات الحالية للبنك (مرة واحدة، والتكرار يُتجاهل) مع تصنيفات المهارات
    if (p === 'admin/bank/legacy' && m === 'POST') {
      if (!isSuper) return deny('من صلاحيات الإدارة العامة');
      const b = await body(), slug = String(b.course || ''); if (!SKILL_BANKS[slug]) return J({ error: 'البنك غير معروف' }, 400);
      const items = await bankItems(env, request, DB, slug), sub = SKILL_BANKS[slug];
      const tags = Object.fromEntries((await all('SELECT qkey,skill_id FROM question_skills WHERE course=?', slug)).map(r => [r.qkey, r.skill_id]));
      const lafzi = slug === 'aksam lafzi', st = [], from = int(b.from) || 0, part = items.slice(from, from + 400);
      for (const it of part) {
        const opts = lafzi ? it.o : ['أ', 'ب', 'ج', 'د'];
        const src = COURSE[slug].title + (it.sec ? ' – ' + it.sec : '');
        st.push(DB.prepare('INSERT INTO qbank (subject,skill_id,difficulty,source,stem,passage,image_id,image_url,options,correct,multi,explanation,status,hash,ext_ref,created_by,created_at,updated_at) VALUES (?,?,0,?,?,?,NULL,?,?,?,0,NULL,?,?,?,?,?,?) ON CONFLICT(ext_ref) DO NOTHING')
          .bind(sub, tags[it.key] || null, src, lafzi ? it.s : null, lafzi ? (it.p || null) : null, lafzi ? null : it.img, JSON.stringify(opts), JSON.stringify(it.c >= 0 ? [it.c] : []), it.c >= 0 ? 'active' : 'draft', lafzi ? await textHash(it.s, it.o) : null, slug + ':' + it.key, A.name, iso, iso));
      }
      let added = 0; if (st.length) for (const r of await DB.batch(st)) added += r.meta && r.meta.changes ? 1 : 0;
      return J({ ok: 1, total: items.length, done: Math.min(items.length, from + part.length), added });
    }
    return J({ error: 'not found' }, 404);
  }

  // ---------- تصنيف الأسئلة حسب المهارات ----------
  if (p.startsWith('admin/skills')) {
    await ensureSkillsSchema(DB); await ensureStaffSchema(DB);
    const banksFor = async () => { const out = []; for (const slug of Object.keys(SKILL_BANKS)) { const R2 = await courseRights(slug); if (R2) out.push({ slug, title: COURSE[slug].title, subject: SKILL_BANKS[slug], canTag: !!R2.edit }); } return out; };
    if (p === 'admin/skills' && m === 'GET') {
      const banks = await banksFor(); if (!banks.length && !isSuper) return deny('لا توجد بنوك أسئلة مسندة لك');
      const skills = await all('SELECT s.id,s.subject,s.name,s.sort,COUNT(q.qkey) n FROM skills s LEFT JOIN question_skills q ON q.skill_id=s.id GROUP BY s.id ORDER BY s.subject,s.sort,s.id');
      const per = await all('SELECT course,COUNT(*) n FROM question_skills GROUP BY course');
      return J({ subjects: SUBJECTS, skills, banks, tagged: Object.fromEntries(per.map(r => [r.course, r.n])), manage: isSuper });
    }
    if (p === 'admin/skills/bank' && m === 'GET') {
      const slug = new URL(request.url).searchParams.get('course'), R2 = SKILL_BANKS[slug] && await courseRights(slug);
      if (!R2) return deny('هذا البنك غير مسند لك');
      const items = await bankItems(env, request, DB, slug);
      const tags = Object.fromEntries((await all('SELECT qkey,skill_id FROM question_skills WHERE course=?', slug)).map(r => [r.qkey, r.skill_id]));
      return J({ course: slug, subject: SKILL_BANKS[slug], canTag: !!R2.edit, items, tags });
    }
    if (p === 'admin/skills/tag' && m === 'POST') {
      const b = await body(), slug = String(b.course || ''), R2 = SKILL_BANKS[slug] && await courseRights(slug);
      if (!R2 || !R2.edit) return deny('ليس لديك صلاحية تصنيف أسئلة هذا البنك');
      const keys = (Array.isArray(b.keys) ? b.keys : [b.key]).map(k => txt(k, 40)).filter(Boolean).slice(0, 500);
      if (!keys.length) return J({ error: 'لا توجد أسئلة' }, 400);
      const sid = b.skill_id == null || b.skill_id === '' ? null : int(b.skill_id);
      if (sid !== null) { const sk = await one('SELECT subject FROM skills WHERE id=?', sid); if (!sk || sk.subject !== SKILL_BANKS[slug]) return J({ error: 'المهارة لا تخص هذه المادة' }, 400); }
      await DB.batch(keys.map(k => sid === null ? DB.prepare('DELETE FROM question_skills WHERE course=? AND qkey=?').bind(slug, k) : DB.prepare('INSERT INTO question_skills (course,qkey,skill_id,by_name,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(course,qkey) DO UPDATE SET skill_id=excluded.skill_id,by_name=excluded.by_name,updated_at=excluded.updated_at').bind(slug, k, sid, A.name, iso)));
      return J({ ok: 1 });
    }
    if (p === 'admin/skills/save' && m === 'POST') {
      if (!isSuper) return deny('إدارة قائمة المهارات من صلاحيات الإدارة العامة');
      const b = await body(), name = txt(b.name, 80).trim(), sub = String(b.subject || '');
      if (!name) return J({ error: 'اكتب اسم المهارة' }, 400);
      if (b.id) { await DB.batch([DB.prepare('UPDATE skills SET name=? WHERE id=?').bind(name, int(b.id)), audit(A, 'skill_rename', 'skill', int(b.id), name)]); return J({ ok: 1 }); }
      if (!SUBJECTS[sub]) return J({ error: 'اختر المادة' }, 400);
      const mx = await one('SELECT COALESCE(MAX(sort),0) m FROM skills WHERE subject=?', sub);
      const r = await DB.prepare('INSERT INTO skills (subject,name,sort,created_at) VALUES (?,?,?,?)').bind(sub, name, mx.m + 1, iso).run();
      await audit(A, 'skill_add', 'skill', r.meta && r.meta.last_row_id, SUBJECTS[sub] + ': ' + name).run();
      return J({ ok: 1 });
    }
    if (p === 'admin/skills/delete' && m === 'POST') {
      if (!isSuper) return deny('إدارة قائمة المهارات من صلاحيات الإدارة العامة');
      const b = await body(), id = int(b.id), sk = await one('SELECT name FROM skills WHERE id=?', id);
      if (!sk) return J({ error: 'غير موجودة' }, 404);
      await DB.batch([DB.prepare('DELETE FROM question_skills WHERE skill_id=?').bind(id), DB.prepare('DELETE FROM skills WHERE id=?').bind(id), audit(A, 'skill_delete', 'skill', id, sk.name)]);
      return J({ ok: 1 });
    }
    if (p === 'admin/skills/move' && m === 'POST') {
      if (!isSuper) return deny();
      const b = await body(), ids = (Array.isArray(b.ids) ? b.ids : []).map(int).filter(x => x > 0).slice(0, 300);
      await DB.batch(ids.map((id, i) => DB.prepare('UPDATE skills SET sort=? WHERE id=?').bind(i + 1, id)));
      return J({ ok: 1 });
    }
    return J({ error: 'not found' }, 404);
  }

  // ---------- النسخ والتراجع (الإدارة العامة فقط) ----------
  // يحتاج متغيرات البيئة: CF_API_TOKEN (صلاحية Cloudflare Pages: Edit) و CF_ACCOUNT_ID، و CF_PAGES_PROJECT (افتراضي bawaba-quant-quiz)
  if (p.startsWith('admin/versions')) {
    if (!isSuper) return deny('النسخ والتراجع من صلاحيات الإدارة العامة فقط');
    const proj = env.CF_PAGES_PROJECT || 'bawaba-quant-quiz';
    const configured = !!(env.CF_API_TOKEN && env.CF_ACCOUNT_ID);
    const goodRow = await one("SELECT value FROM settings WHERE key='good_versions'");
    let good = {}; try { good = JSON.parse(goodRow && goodRow.value || '{}') || {}; } catch (e) { good = {}; }
    // تنظيف المفتاح من مسافات أو أسطر زائدة قد تدخل مع النسخ واللصق
    const CFT = String(env.CF_API_TOKEN || '').trim(), CFA = String(env.CF_ACCOUNT_ID || '').trim();
    const cf = async (path, method = 'GET') => {
      const r = await fetch('https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(CFA) + '/pages/projects/' + encodeURIComponent(proj) + path, { method, headers: { authorization: 'Bearer ' + CFT } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(((d.errors || [])[0] || {}).message || ('Cloudflare ' + r.status));
      return d.result;
    };
    const shape = x => { const md = (x.deployment_trigger && x.deployment_trigger.metadata) || {}; return { id: x.id, short: x.short_id, created: x.created_on, msg: txt(md.commit_message, 160), hash: txt(md.commit_hash, 12), branch: md.branch || '', status: (x.latest_stage && x.latest_stage.status) || '', url: x.url, good: good[x.id] || null }; };
    if (p === 'admin/versions' && m === 'GET') {
      if (!configured) return J({ configured: false, project: proj, good });
      try {
        const [info, list] = await Promise.all([cf(''), cf('/deployments?env=production&per_page=25')]);
        return J({ configured: true, project: proj, current: info && info.canonical_deployment ? info.canonical_deployment.id : null, list: (list || []).map(shape) });
      } catch (e) {
        // تشخيص واضح: هل المفتاح نفسه سليم؟ وهل له صلاحية على هذا الحساب؟
        let why = '';
        try {
          const vr = async u => { const r = await fetch('https://api.cloudflare.com/client/v4' + u, { headers: { authorization: 'Bearer ' + CFT } }); const d = await r.json().catch(() => ({})); return d && d.success && d.result ? d.result.status : ''; };
          const st = (await vr('/user/tokens/verify')) || (await vr('/accounts/' + encodeURIComponent(CFA) + '/tokens/verify'));
          if (!st) why = 'المفتاح CF_API_TOKEN غير صحيح (غالبًا اتنسخ ناقص أو اتمسح). اعمل Roll للمفتاح وانسخه كاملًا وحطه تاني، ثم Retry deployment.';
          else if (st !== 'active') why = 'المفتاح موجود لكن حالته: ' + st + '. فعّله أو اعمل مفتاحًا جديدًا.';
          else why = 'المفتاح سليم لكن ليس له صلاحية «Cloudflare Pages: Edit» على الحساب ' + CFA + '. عدّل صلاحيات المفتاح وتأكد أن Account Resources فيها هذا الحساب، أو أن CF_ACCOUNT_ID صحيح.';
        } catch (e2) { }
        return J({ configured: true, project: proj, error: 'تعذّر الاتصال بـ Cloudflare: ' + e.message + (why ? ' — ' + why : ''), list: [] });
      }
    }
    if (p === 'admin/versions/mark' && m === 'POST') {
      const b = await body(), id = txt(b.id, 64); if (!/^[0-9a-f-]{8,64}$/i.test(id)) return J({ error: 'نسخة غير صحيحة' }, 400);
      if (b.good) good[id] = { note: txt(b.note, 120), at: iso, by: A.name, short: txt(b.short, 16), msg: txt(b.msg, 160) }; else delete good[id];
      await DB.batch([DB.prepare("INSERT INTO settings (key,value) VALUES ('good_versions',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(good)), audit(A, b.good ? 'version_good' : 'version_unmark', 'version', null, (b.short || id) + (b.note ? ' — ' + txt(b.note, 100) : ''))]);
      return J({ ok: 1, good });
    }
    if (p === 'admin/versions/rollback' && m === 'POST') {
      if (!configured) return J({ error: 'اربط حساب Cloudflare أولًا' }, 400);
      const b = await body(), id = txt(b.id, 64); if (!/^[0-9a-f-]{8,64}$/i.test(id)) return J({ error: 'نسخة غير صحيحة' }, 400);
      try { const r = await cf('/deployments/' + encodeURIComponent(id) + '/rollback', 'POST'); await audit(A, 'version_rollback', 'version', null, (r && r.short_id) || id).run(); return J({ ok: 1, id: r && r.id }); }
      catch (e) { return J({ error: 'فشل التراجع: ' + e.message }, 502); }
    }
    return J({ error: 'not found' }, 404);
  }

  if (p === 'admin/audit' && m === 'GET') {
    if (!can('audit.view')) return deny();
    return J({ audit: await all('SELECT * FROM audit_log ORDER BY id DESC LIMIT 300') });
  }

  // ---------- البيانات المجمعة (تُرسل فقط الأقسام المسموح بها) ----------
  if (p === 'admin/data') {
    const out = { actor: { type: A.type, id: A.id, name: A.name, username: A.username, role: A.role, roleLabel: (ROLES[A.role] || {}).label || A.role, perms: A.perms }, catalog: PERM_GROUPS, roles: Object.fromEntries(Object.entries(ROLES).map(([k, v]) => [k, { label: v.label, perms: v.perms }])), needs: PERM_NEEDS };
    const jobs = {};
    if (can('students.view')) {
      jobs.students = ensureMoodleSchema(DB).then(() => all(`SELECT s.id,s.name,s.code,s.status,s.kind,s.max_devices,s.expires_at,s.created_at,s.last_seen,s.duration_minutes,s.pause_used,s.pause_until,
        (SELECT COUNT(*) FROM devices d WHERE d.student_id=s.id) devices,
        (SELECT COUNT(*) FROM events e WHERE e.student_id=s.id AND e.kind='attempt') attempts,
        (SELECT ROUND(AVG(score)) FROM events e WHERE e.student_id=s.id AND e.kind='attempt') avg,
        (SELECT COALESCE(SUM(seconds),0) FROM usage u WHERE u.student_id=s.id) secs,
        (SELECT username FROM moodle_links ml WHERE ml.student_id=s.id) moodle
        FROM students s ORDER BY s.name`));
    }
    if (can('reports.view')) {
      jobs.pages = all(`SELECT student_id,page,SUM(kind='open') opens,SUM(kind='attempt') attempts,MAX(score) best,MAX(created_at) last FROM events GROUP BY student_id,page`);
      jobs.feed = all(`SELECT s.name,e.page,e.kind,e.sub,e.score,e.created_at FROM events e JOIN students s ON s.id=e.student_id ORDER BY e.id DESC LIMIT 25`);
      jobs.pageList = all('SELECT DISTINCT page FROM events');
    }
    if (can('dashboard.view')) {
      const activeSince = new Date(now - 15 * 60000).toISOString();
      jobs.dash = Promise.all([
        one('SELECT COUNT(*) n FROM trials WHERE last_at>?', now - 15 * 60000),
        one("SELECT COUNT(*) n FROM staff_users WHERE role='teacher' AND status='active' AND last_seen>?", activeSince),
        one("SELECT COUNT(*) n FROM staff_users WHERE status='active' AND last_seen>?", activeSince),
        one("SELECT COUNT(*) n FROM students WHERE status='active' AND last_seen>? AND (expires_at IS NULL OR expires_at>?)", activeSince, iso),
        one("SELECT COUNT(*) n FROM students WHERE status='active' AND (expires_at IS NULL OR expires_at>?)", iso),
        one("SELECT COUNT(*) n FROM staff_users WHERE role='teacher' AND status='active'"),
        one('SELECT COUNT(*) n FROM trials'),
        all("SELECT page,SUM(kind='open') opens,SUM(kind='attempt') attempts,COUNT(DISTINCT student_id) students,MAX(created_at) last FROM events GROUP BY page ORDER BY opens DESC LIMIT 12"),
        all("SELECT page,COUNT(*) attempts,COUNT(DISTINCT student_id) students,ROUND(AVG(score)) average,MAX(score) best FROM events WHERE kind='attempt' GROUP BY page ORDER BY attempts DESC LIMIT 12"),
        all("SELECT substr(created_at,1,10) day,COUNT(*) events,COUNT(DISTINCT student_id) students FROM events WHERE created_at>? GROUP BY substr(created_at,1,10) ORDER BY day DESC LIMIT 14", new Date(now - 14 * 86400000).toISOString()),
        all("SELECT s.id,s.name,s.last_seen,COALESCE(SUM(u.seconds),0) seconds,COUNT(DISTINCT u.page) pages FROM students s LEFT JOIN usage u ON u.student_id=s.id GROUP BY s.id ORDER BY seconds DESC LIMIT 10"),
        one("SELECT COUNT(*) n FROM students WHERE status='active' AND expires_at IS NOT NULL AND expires_at>? AND expires_at<?", iso, new Date(now + 7 * 864e5).toISOString()),
        one('SELECT COUNT(*) n FROM guest_leads WHERE created_at>?', new Date(now - 7 * 864e5).toISOString())
      ]).then(r => ({ window_minutes: 15, active: { guests: r[0].n, teachers: r[1].n, staff: r[2].n, students: r[3].n }, totals: { students: r[4].n, teachers: r[5].n, guests: r[6].n, expiringSoon: r[11].n, newLeads: r[12].n }, topPages: r[7], scoreByPage: r[8], activityByDay: r[9], timeByStudent: r[10] }));
    }
    if (can('groups.view')) {
      jobs.groups = all('SELECT g.id,g.name,g.description,g.status,g.created_at,COUNT(gm.student_id) members FROM student_groups g LEFT JOIN group_members gm ON gm.group_id=g.id GROUP BY g.id ORDER BY g.id DESC');
      jobs.groupMembers = all('SELECT gm.group_id,gm.student_id,s.name FROM group_members gm JOIN students s ON s.id=gm.student_id ORDER BY s.name');
    }
    if (can('leads.view')) {
      jobs.leads = all('SELECT id,name,phone,source,interest,status,created_at,last_contacted_at FROM guest_leads ORDER BY id DESC LIMIT 500');
      jobs.leadCount = one('SELECT COUNT(*) n FROM guest_leads');
      jobs.visitors = one('SELECT COUNT(*) n FROM trials');
    }
    if (can('settings.guard')) {
      jobs.bans = all('SELECT ip,until FROM ip_bans WHERE until>? ORDER BY until DESC', iso);
      jobs.flagged = one('SELECT COUNT(*) n FROM trials WHERE strikes>0');
    }
    if (isSuper) jobs.staff = staffList();
    jobs.cEdits = all('SELECT course,COUNT(*) n,MAX(updated_at) last FROM exam_patch GROUP BY course');
    jobs.cReports = ensureMoodleSchema(DB).then(() => all("SELECT course,COUNT(*) n FROM question_reports WHERE status='open' GROUP BY course"));
    jobs.cStaff = isSuper ? all('SELECT cs.course,cs.staff_id,cs.can_edit,cs.can_add,cs.can_delete,u.name,u.username,u.role,u.status FROM course_staff cs JOIN staff_users u ON u.id=cs.staff_id ORDER BY u.name') : (A.type === 'staff' ? all('SELECT course,staff_id,can_edit,can_add,can_delete FROM course_staff WHERE staff_id=?', A.id) : Promise.resolve([]));
    const keys = Object.keys(jobs), vals = await Promise.all(keys.map(k => jobs[k])), R = Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
    if (R.students) out.students = can('students.codes') ? R.students : R.students.map(s => ({ ...s, code: s.code.slice(0, 2) + '******' }));
    if (R.pages) { out.pages = R.pages; out.feed = R.feed; out.pageList = R.pageList.map(r => r.page); }
    if (R.dash) out.dashboard = R.dash;
    if (R.groups) { out.groups = R.groups; out.groupMembers = R.groupMembers; }
    if (R.leads) { out.leads = R.leads; out.leadStats = { leads: R.leadCount.n, visitors: R.visitors.n }; }
    if (R.bans) { out.bans = R.bans; out.flagged = R.flagged.n; }
    if (R.staff) out.staff = R.staff;
    {
      const ed = Object.fromEntries(R.cEdits.map(r => [r.course, r])), rep = Object.fromEntries(R.cReports.map(r => [r.course, r.n])), mine = {};
      if (A.type === 'staff') R.cStaff.filter(r => r.staff_id === A.id).forEach(r => mine[r.course] = r);
      out.courses = COURSES.map(c => {
        const r = isSuper ? { can_edit: 1, can_add: 1, can_delete: 1 } : mine[c.slug];
        return { slug: c.slug, title: c.title, model: c.model, link: c.link, url: '/' + c.file.replace(/^\//, '').replace(/\.html$/, ''), edits: ed[c.slug] ? ed[c.slug].n : 0, reports: rep[c.slug] || 0, last: ed[c.slug] ? ed[c.slug].last : null, rights: r ? { edit: !!r.can_edit, add: !!r.can_add, delete: !!r.can_delete } : null, staff: isSuper ? R.cStaff.filter(x => x.course === c.slug) : undefined };
      }).filter(c => c.rights);
    }
    const S = {};
    for (const r of await all('SELECT key,value FROM settings')) S[r.key] = r.value;
    const settings = {};
    if (can('settings.access')) { settings.require_login = S.require_login === '1'; settings.trial_minutes = +S.trial_minutes || 0; settings.moodle_enabled = S.moodle_enabled !== '0'; settings.moodle_url = S.moodle_url || MOODLE_URL; settings.moodle_courses = S.moodle_courses || ''; settings.hidden_courses = hiddenOf(S.hidden_courses); settings.free_mode = S.free_mode !== '0'; settings.google_client_id = S.google_client_id || GOOGLE_CLIENT_ID; settings.google_ready = !!env.MOODLE_TOKEN; settings.free_count = +S.free_count || 10; settings.vis = VIS; }
    if (can('settings.guard')) settings.trial_guard = S.trial_guard !== '0';
    if (can('settings.contact') || can('leads.manage') || can('students.message')) settings.contact = S.contact || '';
    if (can('settings.contact') || can('leads.manage')) settings.lead_message = S.lead_message || DEFAULT_LEAD_MSG;
    if (can('settings.plans')) out.plans = plansOf(S.plans);
    out.settings = settings;
    return J(out);
  }

  if (p === 'admin/preview') {
    const h = new Headers({ location: '/' });
    for (const n of ['bw_code', 'bw_trial', 'bw_dev']) h.append('set-cookie', `${n}=; Path=/; Max-Age=0`);
    return new Response(null, { status: 302, headers: h });
  }
  if (m !== 'POST') return J({ error: 'not found' }, 404);
  const b = await body();

  // ---------- المجموعات ----------
  if (p === 'admin/groups/add') {
    if (!can('groups.manage')) return deny();
    const name = String(b.name || '').trim().slice(0, 80), description = String(b.description || '').trim().slice(0, 240);
    if (name.length < 2) return J({ error: 'اكتب اسم المجموعة' }, 400);
    try {
      const r = await DB.prepare('INSERT INTO student_groups (name,description,created_at) VALUES (?,?,?)').bind(name, description, iso).run();
      await audit(A, 'create', 'group', r.meta.last_row_id, name).run();
      return J({ ok: 1, id: r.meta.last_row_id });
    } catch (e) { return J({ error: 'اسم المجموعة مستخدم بالفعل' }, 409); }
  }
  if (p === 'admin/groups/update') {
    if (!can('groups.manage')) return deny();
    const id = +b.id, g = await one('SELECT * FROM student_groups WHERE id=?', id);
    if (!g) return J({ error: 'المجموعة غير موجودة' }, 404);
    const name = String(b.name || g.name).trim().slice(0, 80), description = String(b.description === undefined ? (g.description || '') : b.description).trim().slice(0, 240), status = b.status === undefined ? g.status : (b.status === 'blocked' ? 'blocked' : 'active');
    if (name.length < 2) return J({ error: 'بيانات المجموعة غير صحيحة' }, 400);
    try { await DB.batch([DB.prepare('UPDATE student_groups SET name=?,description=?,status=? WHERE id=?').bind(name, description, status, id), audit(A, 'update', 'group', id, name)]); }
    catch (e) { return J({ error: 'اسم المجموعة مستخدم بالفعل' }, 409); }
    return J({ ok: 1 });
  }
  if (p === 'admin/groups/delete') {
    if (!can('groups.delete')) return deny('ليس لديك صلاحية لحذف المجموعات');
    const id = +b.id, g = await one('SELECT name FROM student_groups WHERE id=?', id);
    await DB.batch([DB.prepare('DELETE FROM group_members WHERE group_id=?').bind(id), DB.prepare('DELETE FROM group_pages WHERE group_id=?').bind(id), DB.prepare('DELETE FROM student_groups WHERE id=?').bind(id), audit(A, 'delete', 'group', id, g ? g.name : '')]);
    return J({ ok: 1 });
  }
  if (p === 'admin/groups/member') {
    if (!can('groups.manage')) return deny();
    const gid = +b.group_id, ids = (Array.isArray(b.student_ids) ? b.student_ids : [b.student_id]).map(x => +x).filter(Boolean).slice(0, 500);
    if (!gid || !ids.length) return J({ error: 'اختر المجموعة والطالب' }, 400);
    const st = ids.map(sid => b.action === 'remove' ? DB.prepare('DELETE FROM group_members WHERE group_id=? AND student_id=?').bind(gid, sid) : DB.prepare('INSERT OR IGNORE INTO group_members (group_id,student_id,created_at) VALUES (?,?,?)').bind(gid, sid, iso));
    st.push(audit(A, b.action === 'remove' ? 'member_remove' : 'member_add', 'group', gid, ids.length + ' طالب'));
    await DB.batch(st);
    return J({ ok: 1 });
  }
  if (p === 'admin/groups/page') {
    if (!can('groups.manage')) return deny();
    const gid = +b.group_id, page = String(b.page || '').replace(/(\.html)+$/i, '').slice(0, 120);
    if (!gid || !page) return J({ error: 'بيانات المحتوى غير صحيحة' }, 400);
    if (b.action === 'remove') await DB.prepare('DELETE FROM group_pages WHERE group_id=? AND page=?').bind(gid, page).run();
    else await DB.prepare('INSERT OR IGNORE INTO group_pages (group_id,page,created_at) VALUES (?,?,?)').bind(gid, page, iso).run();
    return J({ ok: 1 });
  }

  // ---------- المهتمون ----------
  if (p === 'admin/leads/update') {
    if (!can('leads.manage')) return deny();
    const id = +b.id, status = LEAD_STATUS.includes(b.status) ? b.status : 'contacted';
    await DB.batch([DB.prepare("UPDATE guest_leads SET status=?,last_contacted_at=CASE WHEN ?<>'new' THEN ? ELSE last_contacted_at END WHERE id=?").bind(status, status, iso, id), audit(A, 'update', 'lead', id, status)]);
    return J({ ok: 1 });
  }
  if (p === 'admin/leads/delete') {
    if (!can('leads.delete')) return deny();
    const ids = (Array.isArray(b.ids) ? b.ids : [b.id]).map(x => +x).filter(Boolean).slice(0, 500);
    await DB.batch(ids.map(id => DB.prepare('DELETE FROM guest_leads WHERE id=?').bind(id)).concat(audit(A, 'delete', 'lead', ids.length === 1 ? ids[0] : null, ids.length + ' مهتم')));
    return J({ ok: 1 });
  }

  // ---------- الإعدادات ----------
  if (p === 'admin/mode') {
    if (!can('settings.access')) return deny();
    const mode = b.mode, tm = +b.trial_minutes;
    if (!['open', 'code', 'trial'].includes(mode) || (mode === 'trial' && !TRIALS.includes(tm))) return J({ error: 'قيمة غير مسموحة' }, 400);
    await DB.batch([putSetting('require_login', mode === 'open' ? '0' : '1'), putSetting('trial_minutes', mode === 'trial' ? String(tm) : '0'), audit(A, 'setting', 'settings', null, 'نمط الدخول: ' + mode + (mode === 'trial' ? ' ' + tm + 'د' : ''))]);
    return J({ ok: 1 });
  }
  if (p === 'admin/setting') {
    let v;
    if (b.key === 'trial_guard') { if (!can('settings.guard')) return deny(); v = b.value ? '1' : '0'; }
    else if (b.key === 'contact') { if (!can('settings.contact')) return deny(); v = phone(b.value); }
    else if (b.key === 'moodle_enabled') { if (!can('settings.access')) return deny(); v = b.value ? '1' : '0'; }
    else if (b.key === 'moodle_courses') { if (!can('settings.access')) return deny(); v = String(b.value || '').split(/[^0-9]+/).filter(Boolean).slice(0, 50).join(','); }
    else if (b.key === 'moodle_url') { if (!can('settings.access')) return deny(); v = String(b.value || '').trim().replace(/\/+$/, ''); if (!/^https:\/\/[^\s]+$/.test(v)) return J({ error: 'اكتب رابط منصة الدورات يبدأ بـ https://' }, 400); }
    else if (b.key === 'google_client_id') { if (!can('settings.access')) return deny(); v = String(b.value || '').trim(); if (v && !/^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(v)) return J({ error: 'Client ID غير صحيح؛ لازم ينتهي بـ .apps.googleusercontent.com' }, 400); }
    else if (b.key === 'free_mode') { if (!can('settings.access')) return deny(); v = b.value ? '1' : '0'; }
    else if (b.key === 'free_count') { if (!can('settings.access')) return deny(); v = String(Math.max(1, Math.min(50, int(b.value) || 10))); }
    else if (b.key === 'hidden_courses') { if (!can('settings.access')) return deny(); v = JSON.stringify(hiddenOf(JSON.stringify(Array.isArray(b.value) ? b.value : []))); }
    else if (b.key === 'lead_message') { if (!can('settings.contact')) return deny(); v = String(b.value || '').slice(0, 3000); }
    else return J({ error: 'not found' }, 404);
    await DB.batch([putSetting(b.key, v), audit(A, 'setting', 'settings', null, b.key)]);
    return J({ ok: 1, value: v });
  }
  if (p === 'admin/plans') {
    if (!can('settings.plans')) return deny();
    const a = (Array.isArray(b.plans) ? b.plans : []).slice(0, 6).map(x => ({ name: String(x.name || '').trim().slice(0, 40), days: Math.max(1, Math.min(3650, parseInt(x.days) || 30)), price: Math.max(0, Math.min(99999, +x.price || 0)) })).filter(x => x.name);
    await DB.batch([putSetting('plans', JSON.stringify(a)), audit(A, 'setting', 'settings', null, 'الباقات: ' + a.length)]);
    return J({ ok: 1 });
  }
  if (p === 'admin/unban') { if (!can('settings.guard')) return deny(); await DB.batch([DB.prepare('DELETE FROM ip_bans WHERE ip=?').bind(String(b.ip || '')), audit(A, 'unban', 'settings', null, String(b.ip || ''))]); return J({ ok: 1 }); }
  if (p === 'admin/guardreset') { if (!can('settings.guard')) return deny(); await DB.batch([DB.prepare('DELETE FROM trials'), DB.prepare('DELETE FROM ip_bans'), audit(A, 'reset', 'settings', null, 'تصفير الحماية')]); return J({ ok: 1 }); }

  // ---------- الطلاب والأكواد ----------
  if (p === 'admin/add') {
    if (!can('students.create')) return deny();
    const kind = b.kind === 'group' ? 'group' : 'single';
    let md = parseInt(b.max_devices); if (isNaN(md) || md < 0) md = kind === 'group' ? 30 : 2;
    const days = Math.max(0, parseInt(b.days) || 0), exp = days ? new Date(now + days * 864e5).toISOString() : null, out = [];
    const names = String(b.names || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 500), gid = +b.group_id || 0;
    for (const n of names) {
      let c = newCode(), r = null;
      for (let i = 0; i < 4 && !r; i++) { try { r = await DB.prepare('INSERT INTO students (name,code,created_at,kind,max_devices,expires_at,duration_minutes) VALUES (?,?,?,?,?,?,?)').bind(n.slice(0, 80), c, iso, kind, md, exp, days ? days * 1440 : null).run(); } catch (e) { c = newCode(); } }
      if (!r) continue;
      if (gid && can('groups.manage')) await DB.prepare('INSERT OR IGNORE INTO group_members (group_id,student_id,created_at) VALUES (?,?,?)').bind(gid, r.meta.last_row_id, iso).run();
      out.push({ name: n, code: c });
    }
    await audit(A, 'create', 'student', null, out.length + ' كود ' + (kind === 'group' ? 'جماعي' : 'فردي')).run();
    return J({ ok: 1, added: can('students.codes') ? out : out.map(x => ({ name: x.name, code: x.code.slice(0, 2) + '******' })) });
  }
  const sid = +b.id;
  const student = sid ? await one('SELECT * FROM students WHERE id=?', sid) : null;
  if (['admin/status', 'admin/update', 'admin/resetdev', 'admin/delete'].includes(p) && !student) return J({ error: 'الطالب غير موجود' }, 404);
  if (p === 'admin/status') {
    if (!can('students.block')) return deny();
    const st = b.status === 'blocked' ? 'blocked' : 'active';
    await DB.batch([DB.prepare('UPDATE students SET status=? WHERE id=?').bind(st, sid), audit(A, st === 'blocked' ? 'block' : 'unblock', 'student', sid, student.name)]);
    return J({ ok: 1 });
  }
  if (p === 'admin/update') {
    if (!can('students.edit')) return deny();
    const s = student, notes = [];
    if (b.name !== undefined) { const nn = String(b.name).trim().slice(0, 80); if (nn.length < 1) return J({ error: 'اكتب الاسم' }, 400); await DB.prepare('UPDATE students SET name=? WHERE id=?').bind(nn, s.id).run(); notes.push('الاسم: ' + nn); }
    if (b.max_devices !== undefined) { const v = Math.max(0, parseInt(b.max_devices) || 0); await DB.prepare('UPDATE students SET max_devices=? WHERE id=?').bind(v, s.id).run(); notes.push('حد الأجهزة: ' + v); }
    if (b.add_days) {
      const add = Math.max(1, Math.min(3650, +b.add_days || 0)), base = s.expires_at && s.expires_at > iso ? new Date(s.expires_at).getTime() : now;
      await DB.prepare('UPDATE students SET expires_at=?,duration_minutes=? WHERE id=?').bind(new Date(base + add * 864e5).toISOString(), (s.duration_minutes || 0) + add * 1440, s.id).run();
      notes.push('تمديد ' + add + ' يوم');
    }
    if (b.no_expiry) { await DB.prepare('UPDATE students SET expires_at=NULL,duration_minutes=NULL,pause_until=NULL,paused_at=NULL WHERE id=?').bind(s.id).run(); notes.push('صلاحية دائمة'); }
    if (b.end_pause) { await endPause(s); notes.push('إنهاء الاستراحة'); }
    await audit(A, 'update', 'student', s.id, s.name + ' — ' + notes.join('، ')).run();
    return J({ ok: 1 });
  }
  if (p === 'admin/resetdev') {
    if (!can('students.edit')) return deny();
    await DB.batch([DB.prepare('DELETE FROM devices WHERE student_id=?').bind(sid), audit(A, 'resetdev', 'student', sid, student.name)]);
    return J({ ok: 1 });
  }
  if (p === 'admin/delete') {
    if (!can('students.delete')) return deny();
    await ensureProgressSchema(DB); await ensureMoodleSchema(DB);
    await DB.batch(['events', 'usage', 'devices', 'group_members', 'student_progress', 'moodle_links'].map(t => DB.prepare(`DELETE FROM ${t} WHERE student_id=?`).bind(sid)).concat(DB.prepare('DELETE FROM students WHERE id=?').bind(sid), audit(A, 'delete', 'student', sid, student.name)));
    return J({ ok: 1 });
  }
  return J({ error: 'not found' }, 404);
}
