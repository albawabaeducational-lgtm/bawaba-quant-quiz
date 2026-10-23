// يعمل على صفحات الاختبارات فقط: يفحص الدخول والتجربة المجانية وحماية تكرار التجربة، ويضيف سكريبتات الواجهة والتتبّع.
// إن لم تكن قاعدة البيانات مربوطة بعد، لا يفعل شيئًا (الموقع يظل يعمل كما هو).
const cookie = (req, n) => { const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; };
const sha = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].slice(0, 12).map(x => x.toString(16).padStart(2, '0')).join('');
const INAPP = /WhatsApp|FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|Telegram|MicroMessenger|; wv\)/i;
const DAY30 = 30 * 864e5;

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

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url), p = url.pathname;
  const isPage = request.method === 'GET' && (p === '/' || !/\.[a-z0-9]+$/i.test(p) || /\.html$/i.test(p));
  if (!env.DB || !isPage || /^\/(login|admin|api\/)/.test(p)) return next();
  const now = Date.now(), iso = new Date(now).toISOString();
  let st = null, S = {};
  try {
    for (const r of (await env.DB.prepare('SELECT key,value FROM settings').all()).results) S[r.key] = r.value;
    const code = cookie(request, 'bw_code');
    if (code) st = await env.DB.prepare('SELECT id,status,expires_at,kind,created_at,duration_minutes,pause_used,pause_until FROM students WHERE code=?').bind(code).first();
  } catch (e) { return next(); }
  const paused = !!st && (st.pause_until || 0) > now;
  const valid = !!st && st.status === 'active' && (!st.expires_at || st.expires_at > iso) && !paused;
  const contact = String(S.contact || '').replace(/\D/g, '');
  const ui = o => `<script>window.__bw=${JSON.stringify({ contact, ...o })}</script><script src="/bw-ui.js"></script>`;
  const addScript = (res, html) => new HTMLRewriter().on('body', { element(e) { e.append(html, { html: true }); } }).transform(res);
  const isHtml = r => (r.headers.get('content-type') || '').includes('text/html');
  const go = (why, extra, setCookie) => {
    const to = new URL('/login', url);
    to.searchParams.set('next', p); to.searchParams.set('why', why);
    if (extra) to.searchParams.set('until', extra);
    const h = new Headers({ location: to.toString() });
    if (setCookie) h.append('set-cookie', setCookie);
    return new Response(null, { status: 302, headers: h });
  };

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
    let res = await next();
    if (!isHtml(res)) return res;
    if (fresh) { res = new Response(res.body, res); res.headers.append('set-cookie', ck); }
    return addScript(res, ui({ trialStart: ts, trialEnd: ts + tm * 60000, warn }));
  }
  const res = await next();
  if (!isHtml(res)) return res;
  if (!valid) return addScript(res, ui({}));
  const o = {};
  if (st.expires_at) {
    const end = new Date(st.expires_at).getTime(), total = (st.duration_minutes || 0) > 0 ? ((st.duration_minutes + (st.pause_used || 0)) * 60000) : (end - new Date(st.created_at || now).getTime());
    o.subEnd = end; o.subStart = end - Math.max(total, 60000);
    const left = Math.floor((st.duration_minutes || 0) * 0.10) - (st.pause_used || 0);
    if (st.kind === 'single' && (st.duration_minutes || 0) > 0 && left >= 60) o.pauseMax = left;
  }
  return addScript(res, ui(o) + '<script src="/bw-tracker.js"></script>');
}
