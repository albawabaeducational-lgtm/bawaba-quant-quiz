// يعمل على صفحات الاختبارات فقط: يفحص الدخول والتجربة المجانية ويضيف سكريبت التتبّع تلقائيًا.
// إن لم تكن قاعدة البيانات مربوطة بعد، لا يفعل شيئًا (الموقع يظل يعمل كما هو).
const cookie = (req, n) => { const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; };
export async function onRequest({ request, env, next }) {
  const url = new URL(request.url), p = url.pathname;
  const isPage = request.method === 'GET' && (p === '/' || !/\.[a-z0-9]+$/i.test(p) || /\.html$/i.test(p));
  if (!env.DB || !isPage || /^\/(login|admin|api\/)/.test(p)) return next();
  const now = Date.now(), iso = new Date(now).toISOString();
  let st = null, S = {};
  try {
    for (const r of (await env.DB.prepare('SELECT key,value FROM settings').all()).results) S[r.key] = r.value;
    const code = cookie(request, 'bw_code');
    if (code) st = await env.DB.prepare('SELECT id,status,expires_at FROM students WHERE code=?').bind(code).first();
  } catch (e) { return next(); }
  const valid = !!st && st.status === 'active' && (!st.expires_at || st.expires_at > iso);
  const addScript = (res, html) => new HTMLRewriter().on('body', { element(e) { e.append(html, { html: true }); } }).transform(res);
  const isHtml = r => (r.headers.get('content-type') || '').includes('text/html');
  const contact = String(S.contact || '').replace(/\D/g, '');
  const ui = o => `<script>window.__bw=${JSON.stringify({ contact, ...o })}</script><script src="/bw-ui.js"></script>`;

  if (S.require_login === '1' && !valid) {
    const tm = +S.trial_minutes || 0, ts = +cookie(request, 'bw_trial') || 0;
    if (!st && tm > 0 && (!ts || now - ts < tm * 60000)) {
      let res = await next();
      if (!isHtml(res)) return res;
      const start = ts || now;
      if (!ts) { res = new Response(res.body, res); res.headers.append('set-cookie', `bw_trial=${start}; Path=/; Max-Age=31536000; Secure; SameSite=Lax`); }
      return addScript(res, ui({ trialStart: start, trialEnd: start + tm * 60000 }));
    }
    const to = new URL('/login', url);
    to.searchParams.set('next', p);
    to.searchParams.set('why', st ? (st.status !== 'active' ? 'blocked' : 'expired') : (ts && tm > 0 ? 'trial_ended' : 'need'));
    return Response.redirect(to.toString(), 302);
  }
  const res = await next();
  if (!isHtml(res)) return res;
  return addScript(res, valid ? ui({}) + '<script src="/bw-tracker.js"></script>' : ui({}));
}
