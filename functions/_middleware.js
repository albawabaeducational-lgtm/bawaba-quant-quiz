// يعمل على صفحات الاختبارات فقط: يفحص الدخول والتجربة المجانية وحماية تكرار التجربة، ويضيف سكريبتات الواجهة والتتبّع،
// ويطبّق تعديلات المعلمين على الأسئلة (من قاعدة البيانات)، ويضيف «وضع التحرير» لمن له صلاحية على المقرر.
// إن لم تكن قاعدة البيانات مربوطة بعد، لا يفعل شيئًا (الموقع يظل يعمل كما هو).
const cookie = (req, n) => { const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; };
const sha = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].slice(0, 12).map(x => x.toString(16).padStart(2, '0')).join('');
const shaFull = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(x => x.toString(16).padStart(2, '0')).join('');
const INAPP = /WhatsApp|FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|Telegram|MicroMessenger|; wv\)/i;
const DAY30 = 30 * 864e5;
// نفس القائمة موجودة في functions/api/[[path]].js — أي مقرر جديد يُضاف في الملفين.
const COURSES = {
  'aksam kamy': { title: 'أقسام الكمي', model: 'bank', img: true, hints: true, url: '/aksam kamy' },
  'aksam lafzi': { title: 'أقسام اللفظي', model: 'bank', url: '/aksam lafzi' },
  // المحاكي المحوسب يُبنى تلقائيًا من أقسام الكمي واللفظي (أي قسم جديد فيهما يظهر فيه مباشرة)
  'muhaky mohawsab': { title: 'المحاكي المحوسب', model: 'linked', link: ['aksam lafzi', 'aksam kamy'] },
  'muhaky warky1': { title: 'المحاكي الورقي – النموذج الأول', model: 'key' },
  'muhaky warky2': { title: 'المحاكي الورقي – النموذج الثاني', model: 'key' },
  'tasis lafzi': { title: 'تأسيس اللفظي', model: 'raw' },
  // بنك صور ثابت: يعدّل المعلم الإجابة والإرشاد وصورة السؤال، أو يخفي السؤال
  'aktar kamy': { title: 'الأسئلة الأكثر تكرارًا – كمي', model: 'static', img: true, hints: true, url: '/aktar kamy' }
};
// صفحات ليست مقررات لكنها تقرأ أسئلة المقررات (مع تعديلات المعلمين): اختبار تحديد المستوى
const VIRTUAL = { placement: ['aksam lafzi', 'aksam kamy'] };
// النسخة المجانية: تُحذف من الصفحة نفسها أسئلة الأجزاء المقفولة (لا تصل للمتصفح أصلًا).
// نفس الدالة موجودة في functions/api/[[path]].js
const DB_TAG = '<script id="db" type="application/json">';
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
// تأسيس اللفظي: RAW مصفوفة في كود الصفحة؛ تُقص لأول n اختبارات (بنفس طريقة تقسيم الصفحة: ~٢٥ سؤالًا للاختبار)
function freeRaw(html, n) {
  const a = html.indexOf('const RAW = '), z = a < 0 ? -1 : html.indexOf(']];', a);
  if (a < 0 || z < 0) return { html, tests: 0 };
  const R = JSON.parse(html.slice(a + 12, z + 2)), N = Math.round(R.length / 25);
  let keep = 0; for (let i = 0; i < N && i < n; i++) keep += Math.floor(R.length / N) + (i < R.length % N ? 1 : 0);
  return { html: html.slice(0, a + 12) + JSON.stringify(R.slice(0, keep)).replace(/</g, '\\u003c') + html.slice(z + 2), tests: N };
}
async function freePage(html, slug, n, etag) {
  const key = etag && typeof caches !== 'undefined' ? new Request('https://bw-free.cache/' + encodeURIComponent(slug) + '/' + n + '/' + encodeURIComponent(etag)) : null;
  if (key) { try { const c = await caches.default.match(key); if (c) return JSON.parse(await c.text()); } catch (e) { } }
  let out = { html, tests: 0 };
  if (slug === 'tasis lafzi') out = freeRaw(html, n);
  else {
    const a = html.indexOf(DB_TAG), z = a < 0 ? -1 : html.indexOf('</script>', a);
    if (a >= 0 && z >= 0) out.html = html.slice(0, a + DB_TAG.length) + freeDb(html.slice(a + DB_TAG.length, z), n, slug === 'aktar kamy' ? 'aktar' : 'bank') + html.slice(z);
  }
  // نخزن فقط الجزء المتغير (البيانات) بدلًا من الصفحة كلها؟ الصفحة نفسها ثابتة لكل نسخة، فتخزينها كاملة أبسط
  if (key) { try { await caches.default.put(key, new Response(JSON.stringify(out), { headers: { 'cache-control': 'public, max-age=604800' } })); } catch (e) { } }
  return out;
}
const safeJson = o => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

// حماية التجربة: نفس الجهاز/الشبكة يعيد التجربة بمسح المتصفح => يرجع له وقته الأصلي (لا يربح شيئًا)،
// وتحذير أول، ثم تحذير ثانٍ + منع التجربة (كود فقط)، ثم حظر الشبكة من التجربة ٣٠ يومًا. صاحب الكود الصحيح لا يتأثر أبدًا.
async function guard(env, request, now, iso) {
  const ip = request.headers.get('cf-connecting-ip') || '', ua = request.headers.get('user-agent') || '';
  if (ip && await env.DB.prepare('SELECT 1 x FROM ip_bans WHERE ip=? AND until>?').bind(ip, iso).first()) return { deny: 'banned' };
  const fp = await sha(ip + '|' + ua);
  const g = await env.DB.prepare('SELECT * FROM trials WHERE fp=?').bind(fp).first();
  if (!g) { await env.DB.prepare('INSERT INTO trials (fp,ip,ua,started_at,strikes,last_at) VALUES (?,?,?,?,0,?)').bind(fp, ip, ua.slice(0, 200), now, now).run(); return { start: now, warn: 0 }; }
  let strikes = g.strikes;
  if (!INAPP.test(ua) && now - (g.last_at || 0) > 30 * 60000) {
    strikes++;
    if (strikes >= 3) {
      await env.DB.batch([
        env.DB.prepare('INSERT OR REPLACE INTO ip_bans (ip,until,at) VALUES (?,?,?)').bind(ip, new Date(now + DAY30).toISOString(), iso),
        env.DB.prepare('UPDATE trials SET strikes=?,last_at=? WHERE fp=?').bind(strikes, now, fp)]);
      return { deny: 'banned' };
    }
    await env.DB.prepare('UPDATE trials SET strikes=?,last_at=? WHERE fp=?').bind(strikes, now, fp).run();
  }
  if (strikes >= 2) return { deny: 'warn2' };
  return { start: g.started_at, warn: strikes };
}

// حساب العامل (معلم/مشرف/إدارة) من كوكي لوحة التحكم
async function staffOf(env, request, iso) {
  const raw = cookie(request, 'bw_staff');
  if (raw) {
    try {
      const u = await env.DB.prepare('SELECT u.id,u.name,u.role,u.status,s.expires_at FROM staff_sessions s JOIN staff_users u ON u.id=s.staff_id WHERE s.token_hash=?').bind(await shaFull('bw|staff|' + raw)).first();
      if (u && u.status === 'active' && u.expires_at > iso) return { id: u.id, name: u.name, super: u.role === 'super_admin' };
    } catch (e) { }
  }
  const adm = cookie(request, 'bw_admin');
  if (adm && env.ADMIN_PASSWORD && adm === await shaFull('bw|' + env.ADMIN_PASSWORD)) return { id: 0, name: 'المدير العام', super: true };
  return null;
}

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url), p = url.pathname;
  // روابط قصيرة وسهلة للمشاركة (الروابط القديمة تظل تعمل كما هي)
  const SHORT = { '/kamy': '/aksam%20kamy.html', '/lafzi': '/aksam%20lafzi.html', '/mock': '/muhaky%20mohawsab.html', '/mohawsab': '/muhaky%20mohawsab.html', '/tasis': '/tasis%20lafzi.html.html', '/paper': '/waraqi.html', '/aktar': '/aktar%20kamy.html', '/level': '/placement.html' };
  const sp = SHORT[p.replace(/\/+$/, '').toLowerCase()];
  if (sp) return new Response(null, { status: 302, headers: { location: sp + url.search + url.hash } });
  const isPage = request.method === 'GET' && (p === '/' || !/\.[a-z0-9]+$/i.test(p) || /\.html$/i.test(p));
  if (!env.DB || !isPage || /^\/(login|admin|api\/)/.test(p)) return next();
  const now = Date.now(), iso = new Date(now).toISOString();
  let slug = ''; try { slug = decodeURIComponent(p).replace(/^\//, '').replace(/(\.html)+$/i, ''); } catch (e) { }
  const course = COURSES[slug] ? slug : '';
  let st = null, S = {}, staff = null, patches = [];
  try {
    for (const r of (await env.DB.prepare('SELECT key,value FROM settings').all()).results) S[r.key] = r.value;
    const code = cookie(request, 'bw_code');
    if (code) st = await env.DB.prepare('SELECT id,status,expires_at,kind,created_at,duration_minutes,pause_used,pause_until FROM students WHERE code=?').bind(code).first();
    if (cookie(request, 'bw_staff') || cookie(request, 'bw_admin')) staff = await staffOf(env, request, iso);
  } catch (e) { return next(); }
  const links = course ? (COURSES[course].link || []) : (VIRTUAL[slug] || []), linked = {};
  if (course || links.length) {
    try {
      const want = (course ? [course] : []).concat(links), rows = (await env.DB.prepare('SELECT course,kind,key,data,deleted FROM exam_patch WHERE course IN (' + want.map(() => '?').join(',') + ') ORDER BY created_at,rowid').bind(...want).all()).results;
      for (const r of rows) { const x = [r.kind, r.key, r.deleted ? null : JSON.parse(r.data)]; if (r.course === course) patches.push(x); else (linked[r.course] = linked[r.course] || []).push(x); }
    } catch (e) { patches = []; }
  }
  let head = (course || links.length) ? `<script>window.__BWX=${safeJson({ c: course || slug, p: patches, linked })}</script><script src="/bw-content.js"></script>` + links.map(l => `<script src="/api/exam/data?c=${encodeURIComponent(l)}"></script>`).join('') : '';
  // الأكثر تكرارًا (بنك صور ثابت): تصحيحات مفاتيح الإجابات المعتمدة من «مراجعة الإجابات» في لوحة التحكم
  if (slug === 'aktar kamy') {
    try { const P = { ak: {}, ah: {}, ai: {}, ax: {} }; for (const r of ((await env.DB.prepare("SELECT kind,key,data FROM exam_patch WHERE course='aktar kamy' AND kind IN ('ak','ah','ai','ax') AND deleted=0").all()).results || [])) P[r.kind][r.key] = JSON.parse(r.data); for (const k of Object.keys(P)) if (Object.keys(P[k]).length) head += `<script>window.__BW${k.toUpperCase()}=${safeJson(P[k])}</script>`; } catch (e) { }
  }
  const paused = !!st && (st.pause_until || 0) > now;
  const valid = !!st && st.status === 'active' && (!st.expires_at || st.expires_at > iso) && !paused;
  // الطالب المسجّل: يُسترجع تقدمه المحفوظ على الخادم قبل أن تقرأه الصفحة (يعمل على أي جهاز)
  // bw-in: الطالب مسجّل الدخول (بالكود أو بمنصة الدورات) — تختفي عنه الباقات والاشتراك والتجربة
  if (valid) head += '<script>document.documentElement.classList.add("bw-in")</script><script src="/api/progress/restore.js"></script>';
  const contact = String(S.contact || '').replace(/\D/g, '');
  const ui = o => `<script>window.__bw=${JSON.stringify({ contact, ...o })}</script><script src="/bw-ui.js"></script>`;
  const isHtml = r => (r.headers.get('content-type') || '').includes('text/html');
  // يقدّم الصفحة مع الإضافات. الـETag يتضمن بصمة الإضافات، فالمتصفح يعيد استخدام نسخته المحفوظة (304)
  // فقط إذا لم تتغير الصفحة ولا تعديلات الأسئلة ولا حالة المستخدم — فلا يرى أحد نسخة قديمة من الأسئلة.
  const serve = async (bodyHtml, setCookie, transform) => {
    const sig = await sha(head + '|' + (bodyHtml || ''));
    const h = new Headers(request.headers), inm = h.get('if-none-match') || '';
    h.delete('if-none-match'); h.delete('if-modified-since');
    const mm = inm.match(/^(W\/)?"(.*)-bw([0-9a-f]+)"$/);
    if (mm && mm[3] === sig) h.set('if-none-match', (mm[1] || '') + '"' + mm[2] + '"');
    let res = await next(new Request(request, { headers: h }));
    const tag = et => et ? et.replace(/"$/, '-bw' + sig + '"') : '';
    if (res.status === 304) { const r = new Response(null, { status: 304, headers: res.headers }); if (res.headers.get('etag')) r.headers.set('etag', tag(res.headers.get('etag'))); return r; }
    if (!isHtml(res)) return res;
    // النسخة المجانية: تعديل الصفحة نفسها قبل إرسالها (حذف أسئلة الأجزاء المقفولة)
    if (transform) { const body = await transform(await res.text(), res.headers.get('etag') || ''); res = new Response(body, res); }
    let rw = new HTMLRewriter();
    if (head) rw = rw.on('head', { element(e) { e.prepend(head, { html: true }); } });
    if (bodyHtml) rw = rw.on('body', { element(e) { e.append(bodyHtml, { html: true }); } });
    const out = new Response(rw.transform(res).body, res);
    out.headers.delete('content-length');
    if (res.headers.get('etag')) out.headers.set('etag', tag(res.headers.get('etag')));
    out.headers.set('cache-control', 'no-cache');
    if (setCookie) out.headers.append('set-cookie', setCookie);
    return out;
  };
  const go = (why, extra, setCookie) => {
    const to = new URL('/login', url);
    to.searchParams.set('next', p); to.searchParams.set('why', why);
    if (extra) to.searchParams.set('until', extra);
    const h = new Headers({ location: to.toString() });
    if (setCookie) h.append('set-cookie', setCookie);
    return new Response(null, { status: 302, headers: h });
  };

  // اختبار مخفي عن الطلاب من لوحة التحكم: يرجع الطالب للرئيسية (العاملون يرونه دائمًا)
  if (!staff) {
    let hid = []; try { hid = JSON.parse(S.hidden_courses || '[]'); } catch (e) { }
    const vk = /^muhaky warky[12]$|^waraqi$/.test(slug) ? 'waraqi' : slug;
    if (Array.isArray(hid) && vk && hid.includes(vk)) return new Response(null, { status: 302, headers: { location: '/?unavailable=1' } });
  }

  // العاملون في المنصة يدخلون كل الصفحات بدون كود، ويظهر لهم «وضع التحرير» في المقررات المسندة لهم
  if (staff) {
    // المعلم يرى شريط «وضع المعلم» في كل مقرر؛ أدوات التحرير تظهر فقط في المقررات المسندة له
    if (!course) return serve('');
    const mine = {};
    if (staff.super) [course].concat(links).forEach(c => mine[c] = { edit: true, add: true, delete: true });
    else { try { for (const r of (await env.DB.prepare('SELECT course,can_edit,can_add,can_delete FROM course_staff WHERE staff_id=?').bind(staff.id).all()).results) mine[r.course] = { edit: !!r.can_edit, add: !!r.can_add, delete: !!r.can_delete }; } catch (e) { } }
    const C = COURSES[course];
    const ed = `<script>window.__BWE=${safeJson({ course, title: C.title, model: C.model, img: !!C.img, hints: !!C.hints, rights: mine[course] || null, name: staff.name, super: staff.super, links: links.map(l => ({ slug: l, title: COURSES[l].title, url: COURSES[l].url, rights: mine[l] || null })) })}</script><script src="/bw-editor.js"></script>`;
    return serve(ed);
  }

  if (S.require_login === '1' && !valid) {
    // الصفحة الرئيسية وصفحات التعريف (تحديد المستوى، تقدمي، قائمة الورقي…) مفتوحة دائمًا لأنها واجهة المنصة ودعايتها.
    // القفل على صفحات الاختبارات فقط.
    const GATED = !!(course || slug === 'aktar kamy' || slug === 'skills');
    const freeOn = S.free_mode !== '0', fN = Math.max(1, Math.min(50, +S.free_count || 10)), tm = +S.trial_minutes || 0;
    // النسخة المجانية المحدودة: أول N من كل اختبار مفتوحة، والباقي يظهر بقفل ويطلب التسجيل
    const free = (why, setCookie) => {
      if (slug === 'muhaky warky2') return new Response(null, { status: 302, headers: { location: '/waraqi.html?locked=1' } });
      // لو فشل التجهيز لا نرسل الصفحة كاملة: نرسل صفحة بدون بيانات أفضل من كشف كل الأسئلة
      const tf = slug === 'muhaky warky1' ? null : async (html, etag) => { try { const o = await freePage(html, slug, fN, etag); return o.tests ? o.html.replace('</head>', '<script>window.__BWFT=' + o.tests + '</script></head>') : o.html; } catch (e) { return '<!doctype html><meta charset="utf-8"><p style="font-family:sans-serif;text-align:center;margin:40px">تعذّر تحميل الصفحة. <a href="/">الرئيسية</a></p>'; } };
      head += `<script>window.__BWF=${safeJson({ n: fN, why, c: slug, wa: contact })}</script><script src="/bw-free.js"></script>`;
      return serve(ui({}), setCookie, tf);
    };
    if (!GATED) {
      const ts0 = +cookie(request, 'bw_trial') || 0, inTrial = !st && tm > 0 && ts0 && now - ts0 < tm * 60000;
      if (freeOn && !inTrial) head += `<script>window.__BWF=${safeJson({ n: fN, why: '', c: slug, wa: contact })}</script><script src="/bw-free.js"></script>`;
      return serve(ui({}));
    }
    if (st && (st.status !== 'active' || paused)) return go(st.status !== 'active' ? 'blocked' : 'paused', paused ? st.pause_until : '');
    if (st) return freeOn ? free('expired') : go('expired');
    if (tm <= 0) return freeOn ? free('need') : go('need');
    let ts = +cookie(request, 'bw_trial') || 0, warn = 0, fresh = false;
    if (!ts) {
      fresh = true;
      if (S.trial_guard === '0') ts = now;
      else {
        try { const r = await guard(env, request, now, iso); if (r.deny) return freeOn ? free('trial_ended') : go(r.deny); ts = r.start; warn = r.warn; } catch (e) { ts = now; }
      }
    }
    const ck = `bw_trial=${ts}; Path=/; Max-Age=31536000; Secure; SameSite=Lax`;
    if (now - ts >= tm * 60000) return freeOn ? free('trial_ended', fresh ? ck : '') : go('trial_ended', '', fresh ? ck : '');
    return serve(ui({ trialStart: ts, trialEnd: ts + tm * 60000, warn }), fresh ? ck : '');
  }
  if (!valid) return serve(ui({}));
  const o = {};
  if (st.expires_at) {
    const end = new Date(st.expires_at).getTime(), total = (st.duration_minutes || 0) > 0 ? ((st.duration_minutes + (st.pause_used || 0)) * 60000) : (end - new Date(st.created_at || now).getTime());
    o.subEnd = end; o.subStart = end - Math.max(total, 60000);
    const left = Math.floor((st.duration_minutes || 0) * 0.10) - (st.pause_used || 0);
    if (st.kind === 'single' && (st.duration_minutes || 0) > 0 && left >= 60) o.pauseMax = left;
  }
  return serve(ui(o) + '<script src="/bw-tracker.js"></script><script src="/bw-sync.js"></script>');
}
