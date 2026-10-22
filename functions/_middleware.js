// يعمل على صفحات الاختبارات فقط: يفحص الدخول (إن كان مفعّلًا) ويضيف سكريبت التتبّع تلقائيًا.
// إن لم تكن قاعدة البيانات مربوطة بعد، لا يفعل شيئًا (الموقع يظل يعمل كما هو).
const cookie = (req, n) => { const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; };
export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const p = url.pathname;
  const isPage = request.method === 'GET' && (p === '/' || !/\.[a-z0-9]+$/i.test(p) || /\.html$/i.test(p));
  if (!env.DB || !isPage || /^\/(login|admin|api\/)/.test(p)) return next();
  let st = null, need = false;
  try {
    const r = await env.DB.prepare("SELECT value FROM settings WHERE key='require_login'").first();
    need = !!r && r.value === '1';
    const code = cookie(request, 'bw_code');
    if (code) st = await env.DB.prepare('SELECT id,status FROM students WHERE code=?').bind(code).first();
  } catch (e) { return next(); }
  if (need && (!st || st.status !== 'active')) {
    const to = new URL('/login', url);
    to.searchParams.set('next', p);
    if (st) to.searchParams.set('blocked', '1');
    return Response.redirect(to.toString(), 302);
  }
  const res = await next();
  if (!st || st.status !== 'active' || !(res.headers.get('content-type') || '').includes('text/html')) return res;
  return new HTMLRewriter().on('body', { element(e) { e.append('<script src="/bw-tracker.js"></script>', { html: true }); } }).transform(res);
}
