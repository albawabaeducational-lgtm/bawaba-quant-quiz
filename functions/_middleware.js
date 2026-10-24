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
  'aksam kamy': { title: 'أقسام الكمي', model: 'bank', img: true, hints: true },
  'aksam lafzi': { title: 'أقسام اللفظي', model: 'bank' },
  'muhaky mohawsab': { title: 'المحاكي المحوسب', model: 'bank', hints: true, qq: true },
  'muhaky warky1': { title: 'المحاكي الورقي – النموذج الأول', model: 'key' },
  'muhaky warky2': { title: 'المحاكي الورقي – النموذج الثاني', model: 'key' },
  'tasis lafzi': { title: 'تأسيس اللفظي', model: 'raw' }
};
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
  if (course) {
    try { patches = (await env.DB.prepare('SELECT kind,key,data,deleted FROM exam_patch WHERE course=? ORDER BY created_at,rowid').bind(course).all()).results.map(r => [r.kind, r.key, r.deleted ? null : JSON.parse(r.data)]); } catch (e) { patches = []; }
  }
  const head = course ? `<script>window.__BWX=${safeJson({ c: course, p: patches })}</script><script src="/bw-content.js"></script>` : '';
  const paused = !!st && (st.pause_until || 0) > now;
  const valid = !!st && st.status === 'active' && (!st.expires_at || st.expires_at > iso) && !paused;
  const contact = String(S.contact || '').replace(/\D/g, '');
  const ui = o => `<script>window.__bw=${JSON.stringify({ contact, ...o })}</script><script src="/bw-ui.js"></script>`;
  const isHtml = r => (r.headers.get('content-type') || '').includes('text/html');
  // يقدّم الصفحة مع الإضافات. الـETag يتضمن بصمة الإضافات، فالمتصفح يعيد استخدام نسخته المحفوظة (304)
  // فقط إذا لم تتغير الصفحة ولا تعديلات الأسئلة ولا حالة المستخدم — فلا يرى أحد نسخة قديمة من الأسئلة.
  const serve = async (bodyHtml, setCookie) => {
    const sig = await sha(head + '|' + (bodyHtml || ''));
    const h = new Headers(request.headers), inm = h.get('if-none-match') || '';
    h.delete('if-none-match'); h.delete('if-modified-since');
    const mm = inm.match(/^(W\/)?"(.*)-bw([0-9a-f]+)"$/);
    if (mm && mm[3] === sig) h.set('if-none-match', (mm[1] || '') + '"' + mm[2] + '"');
    const res = await next(new Request(request, { headers: h }));
    const tag = et => et ? et.replace(/"$/, '-bw' + sig + '"') : '';
    if (res.status === 304) { const r = new Response(null, { status: 304, headers: res.headers }); if (res.headers.get('etag')) r.headers.set('etag', tag(res.headers.get('etag'))); return r; }
    if (!isHtml(res)) return res;
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

  // العاملون في المنصة يدخلون كل الصفحات بدون كود، ويظهر لهم «وضع التحرير» في المقررات المسندة لهم
  if (staff) {
    let rights = null;
    if (course) {
      if (staff.super) rights = { edit: true, add: true, delete: true };
      else { try { const r = await env.DB.prepare('SELECT can_edit,can_add,can_delete FROM course_staff WHERE course=? AND staff_id=?').bind(course, staff.id).first(); if (r) rights = { edit: !!r.can_edit, add: !!r.can_add, delete: !!r.can_delete }; } catch (e) { } }
    }
    const ed = rights ? `<script>window.__BWE=${safeJson({ course, title: COURSES[course].title, model: COURSES[course].model, img: !!COURSES[course].img, hints: !!COURSES[course].hints, qq: !!COURSES[course].qq, rights, name: staff.name })}</script><script src="/bw-editor.js"></script>` : '';
    return serve(ed);
  }

  if (S.require_login === '1' && !valid) {
    if (st) return go(st.status !== 'active' ? 'blocked' : paused ? 'paused' : 'expired', paused ? st.pause_until : '');
    const tm = +S.trial_minutes || 0;
    if (tm <= 0) return go('need');
    let ts = +cookie(request, 'bw_trial') || 0, warn = 0, fresh = false;
    if (!ts) {
      fresh = true;
      if (S.trial_guard === '0') ts = now;
      else {
        try { const r = await guard(env, request, now, iso); if (r.deny) return go(r.deny); ts = r.start; warn = r.warn; } catch (e) { ts = now; }
      }
    }
    const ck = `bw_trial=${ts}; Path=/; Max-Age=31536000; Secure; SameSite=Lax`;
    if (now - ts >= tm * 60000) return go('trial_ended', '', fresh ? ck : '');
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
  return serve(ui(o) + '<script src="/bw-tracker.js"></script>');
}
