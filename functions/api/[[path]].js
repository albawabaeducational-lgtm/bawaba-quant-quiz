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
  { key: 'audit', title: 'الرقابة', items: [
    ['audit.view', 'عرض سجل العمليات']] }
];
const ALL_PERMS = PERM_GROUPS.flatMap(g => g.items.map(x => x[0]));
// أي صلاحية فرعية تتطلب صلاحية العرض الخاصة بقسمها
const PERM_NEEDS = {
  'students.codes': ['students.view'], 'students.create': ['students.view'], 'students.edit': ['students.view'], 'students.block': ['students.view'], 'students.delete': ['students.view'], 'students.message': ['students.view', 'students.codes'],
  'reports.view': ['students.view'], 'reports.export': ['students.view'], 'groups.manage': ['groups.view', 'students.view'], 'groups.delete': ['groups.view'], 'leads.manage': ['leads.view'], 'leads.delete': ['leads.view']
};
const ROLES = {
  super_admin: { label: 'الإدارة العامة', perms: ALL_PERMS },
  supervisor: { label: 'مشرف', perms: ['dashboard.view', 'reports.view', 'reports.export', 'students.view', 'students.codes', 'students.create', 'students.edit', 'students.block', 'students.message', 'groups.view', 'groups.manage', 'leads.view', 'leads.manage'] },
  teacher: { label: 'معلم', perms: [] }, // المعلم يعمل داخل المقررات المسندة له فقط (تحرير الأسئلة + تقارير المقرر)
  content_manager: { label: 'مدير المحتوى', perms: ['dashboard.view', 'reports.view', 'settings.access', 'settings.plans'] }
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
  { slug: 'tasis lafzi', title: 'تأسيس اللفظي', file: '/tasis lafzi.html.html', model: 'raw' }
];
const COURSE = Object.fromEntries(COURSES.map(c => [c.slug, c]));
const KINDS = { bank: ['q', 's', 'p', 'o'], raw: ['r'], key: ['k'], linked: [] };
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
  if (course.model === 'raw') {
    const a = html.indexOf('const RAW = '), b = html.indexOf('\n', a);
    return { n: JSON.parse(html.slice(a + 12, b).trim().replace(/;$/, '')).length };
  }
  const i = html.indexOf('KEY='), m = i >= 0 ? /"([^"]*)"/.exec(html.slice(i, i + 2000)) : null;
  return { n: m ? [...m[1]].length : 0 };
};

let schemaReady = false, leadsReady = false;
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
  // إنهاء الاستراحة: يُرجَّع الوقت غير المستخدم من الاستراحة إلى رصيدها ويُخصم من تاريخ الانتهاء
  const endPause = async s => {
    if ((s.pause_until || 0) > now && s.expires_at) {
      const unused = Math.max(0, Math.floor((s.pause_until - now) / 60000));
      await DB.prepare('UPDATE students SET pause_until=NULL,paused_at=NULL,expires_at=?,pause_used=MAX(0,pause_used-?) WHERE id=?')
        .bind(new Date(new Date(s.expires_at).getTime() - unused * 60000).toISOString(), unused, s.id).run();
    } else if (s.pause_until) await DB.prepare('UPDATE students SET pause_until=NULL,paused_at=NULL WHERE id=?').bind(s.id).run();
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
  if (p === 'public') return J({ contact: await setting('contact'), plans: plansOf(await setting('plans')), courses: (await setting('lead_message')) || DEFAULT_LEAD_MSG });

  if (p === 'login' && m === 'POST') {
    if (await tooMany(ip)) return J({ error: 'محاولات خاطئة كثيرة. حاول بعد ربع ساعة.' }, 429);
    const c = norm((await body()).code), s = await byCode(c);
    if (!s) { await addFail(ip); return J({ error: 'الكود غير صحيح' }, 401); }
    if (s.status !== 'active') return J({ error: 'تم إيقاف هذا الكود. تواصل مع المنصة.' }, 403);
    if (s.expires_at && s.expires_at < iso) return J({ error: 'انتهت صلاحية هذا الكود. تواصل مع المنصة للتجديد.' }, 403);
    if ((s.pause_until || 0) > now) return J({ error: 'حسابك في فترة استراحة حاليًا.', paused: true, until: s.pause_until }, 403);
    let dev = ck(request, 'bw_dev'); if (!/^[0-9a-f-]{36}$/.test(dev)) dev = crypto.randomUUID();
    const has = await DB.prepare('SELECT 1 x FROM devices WHERE student_id=? AND device=?').bind(s.id, dev).first();
    if (has) await DB.prepare('UPDATE devices SET last_seen=? WHERE student_id=? AND device=?').bind(iso, s.id, dev).run();
    else {
      const n = (await DB.prepare('SELECT COUNT(*) n FROM devices WHERE student_id=?').bind(s.id).first()).n;
      if (s.max_devices > 0 && n >= s.max_devices) return J({ error: `هذا الكود وصل للحد الأقصى من الأجهزة (${s.max_devices}). تواصل مع المنصة.` }, 403);
      await DB.prepare('INSERT INTO devices (student_id,device,first_seen,last_seen) VALUES (?,?,?,?)').bind(s.id, dev, iso, iso).run();
    }
    return new Response(JSON.stringify({ ok: 1, name: s.name }), { headers: loginHeaders(c, dev) });
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

  // بيانات أسئلة «أقسام الكمي» و«أقسام اللفظي» يستخدمها المحاكي المحوسب مباشرة،
  // فأي قسم أو سؤال يُضاف في ملف الأقسام يظهر في المحاكي تلقائيًا بدون رفع أي ملف آخر.
  if (p === 'exam/data' && m === 'GET') {
    const c = COURSE[new URL(request.url).searchParams.get('c')];
    if (!c || c.model !== 'bank') return J({ error: 'not found' }, 404);
    const res = await fetchAsset(env, request, c.file);
    if (!res) return J({ error: 'not found' }, 404);
    const raw = res.headers.get('etag') || res.headers.get('last-modified') || '';
    const tag = raw ? '"d-' + (await tok({ ADMIN_PASSWORD: 'data|' + c.slug + '|' + raw })).slice(0, 24) + '"' : '';
    const hdr = { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate' };
    if (tag) hdr.etag = tag;
    if (tag && request.headers.get('if-none-match') === tag) { try { await res.body.cancel(); } catch (e) { } return new Response(null, { status: 304, headers: hdr }); }
    const html = await res.text(), a = html.indexOf('<script id="db" type="application/json">'), z = a < 0 ? -1 : html.indexOf('</script>', a);
    if (a < 0 || z < 0) return J({ error: 'not found' }, 404);
    return new Response('window.__BWD=window.__BWD||{};window.__BWD[' + JSON.stringify(c.slug) + ']=' + html.slice(a + 40, z) + ';', { headers: hdr });
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
    if (row && etag && row.etag === etag) { try { await res.body.cancel(); } catch (e) { } return JSON.parse(row.data); }
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
    return J({ course: { slug: c.slug, title: c.title }, summary: { ...sum, secs: secs.secs }, students, subs, days, feed });
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
      return true;
    };
    const exists = (kind, key) => { const r = rows[kind + '|' + key]; if (r) return !r.deleted; return inBase(kind, key); };
    const st = [], count = { edit: 0, add: 0, delete: 0 }, NAMES = { edit: 'التعديل', add: 'الإضافة', delete: 'الحذف' };
    try {
      for (const o of ops) {
        const kind = String(o.kind || ''), key = txt(o.key, 40);
        if (!KINDS[c.model].includes(kind) || !key) return J({ error: 'عملية غير صالحة' }, 400);
        let act = (o.data === null || o.act === 'delete') ? 'delete' : o.act === 'add' ? 'add' : 'edit';
        if (['o', 'qh', 'k'].includes(kind) && act !== 'edit') act = 'edit';
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
  if (p === 'admin/audit' && m === 'GET') {
    if (!can('audit.view')) return deny();
    return J({ audit: await all('SELECT * FROM audit_log ORDER BY id DESC LIMIT 300') });
  }

  // ---------- البيانات المجمعة (تُرسل فقط الأقسام المسموح بها) ----------
  if (p === 'admin/data') {
    const out = { actor: { type: A.type, id: A.id, name: A.name, username: A.username, role: A.role, roleLabel: (ROLES[A.role] || {}).label || A.role, perms: A.perms }, catalog: PERM_GROUPS, roles: Object.fromEntries(Object.entries(ROLES).map(([k, v]) => [k, { label: v.label, perms: v.perms }])), needs: PERM_NEEDS };
    const jobs = {};
    if (can('students.view')) {
      jobs.students = all(`SELECT s.id,s.name,s.code,s.status,s.kind,s.max_devices,s.expires_at,s.created_at,s.last_seen,s.duration_minutes,s.pause_used,s.pause_until,
        (SELECT COUNT(*) FROM devices d WHERE d.student_id=s.id) devices,
        (SELECT COUNT(*) FROM events e WHERE e.student_id=s.id AND e.kind='attempt') attempts,
        (SELECT ROUND(AVG(score)) FROM events e WHERE e.student_id=s.id AND e.kind='attempt') avg,
        (SELECT COALESCE(SUM(seconds),0) FROM usage u WHERE u.student_id=s.id) secs
        FROM students s ORDER BY s.name`);
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
      const ed = Object.fromEntries(R.cEdits.map(r => [r.course, r])), mine = {};
      if (A.type === 'staff') R.cStaff.filter(r => r.staff_id === A.id).forEach(r => mine[r.course] = r);
      out.courses = COURSES.map(c => {
        const r = isSuper ? { can_edit: 1, can_add: 1, can_delete: 1 } : mine[c.slug];
        return { slug: c.slug, title: c.title, model: c.model, link: c.link, url: '/' + c.file.replace(/^\//, '').replace(/\.html$/, ''), edits: ed[c.slug] ? ed[c.slug].n : 0, last: ed[c.slug] ? ed[c.slug].last : null, rights: r ? { edit: !!r.can_edit, add: !!r.can_add, delete: !!r.can_delete } : null, staff: isSuper ? R.cStaff.filter(x => x.course === c.slug) : undefined };
      }).filter(c => c.rights);
    }
    const S = {};
    for (const r of await all('SELECT key,value FROM settings')) S[r.key] = r.value;
    const settings = {};
    if (can('settings.access')) { settings.require_login = S.require_login === '1'; settings.trial_minutes = +S.trial_minutes || 0; }
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
    await DB.batch(['events', 'usage', 'devices', 'group_members'].map(t => DB.prepare(`DELETE FROM ${t} WHERE student_id=?`).bind(sid)).concat(DB.prepare('DELETE FROM students WHERE id=?').bind(sid), audit(A, 'delete', 'student', sid, student.name)));
    return J({ ok: 1 });
  }
  return J({ error: 'not found' }, 404);
}
