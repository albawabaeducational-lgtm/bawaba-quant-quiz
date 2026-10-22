const J = (o, s = 200, h = {}) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...h } });
const ck = (req, n) => { const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; };
const norm = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const tok = async env => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bw|' + env.ADMIN_PASSWORD)))].map(x => x.toString(16).padStart(2, '0')).join('');
const newCode = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (const x of crypto.getRandomValues(new Uint8Array(8))) s += a[x % a.length]; return s; };
const COOKIE = 'Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax';

export async function onRequest({ request, env, params }) {
  const DB = env.DB, p = (params.path || []).join('/'), m = request.method;
  if (!DB) return J({ error: 'قاعدة البيانات غير مربوطة بعد' }, 500);
  const iso = new Date().toISOString(), day = iso.slice(0, 10);
  const body = async () => { try { return await request.json(); } catch (e) { return {}; } };

  if (p === 'login' && m === 'POST') {
    const c = norm((await body()).code);
    const s = c && await DB.prepare('SELECT id,name,status FROM students WHERE code=?').bind(c).first();
    if (!s) return J({ error: 'الكود غير صحيح' }, 401);
    if (s.status !== 'active') return J({ error: 'تم إيقاف هذا الحساب. تواصل مع المشرف.' }, 403);
    return J({ ok: 1, name: s.name }, 200, { 'set-cookie': `bw_code=${c}; ${COOKIE}` });
  }
  if (p === 'logout') return J({ ok: 1 }, 200, { 'set-cookie': 'bw_code=; Path=/; Max-Age=0' });

  if (p === 'track' && m === 'POST') {
    const s = await DB.prepare('SELECT id,status FROM students WHERE code=?').bind(norm(ck(request, 'bw_code'))).first();
    if (!s || s.status !== 'active') return J({ ok: 0 });
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

  if (!p.startsWith('admin/')) return J({ error: 'not found' }, 404);
  if (!env.ADMIN_PASSWORD) return J({ error: 'لم يتم تعيين ADMIN_PASSWORD في Cloudflare بعد' }, 500);
  if (p === 'admin/login' && m === 'POST') {
    if ((await body()).password !== env.ADMIN_PASSWORD) return J({ error: 'كلمة المرور غير صحيحة' }, 401);
    return J({ ok: 1 }, 200, { 'set-cookie': `bw_admin=${await tok(env)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Strict` });
  }
  if (ck(request, 'bw_admin') !== await tok(env)) return J({ error: 'auth' }, 401);

  if (p === 'admin/data') {
    const students = (await DB.prepare(`SELECT s.id,s.name,s.code,s.status,s.last_seen,
      (SELECT COUNT(*) FROM events e WHERE e.student_id=s.id AND e.kind='attempt') attempts,
      (SELECT ROUND(AVG(score)) FROM events e WHERE e.student_id=s.id AND e.kind='attempt') avg,
      (SELECT COALESCE(SUM(seconds),0) FROM usage u WHERE u.student_id=s.id) secs
      FROM students s ORDER BY s.name`).all()).results;
    const pages = (await DB.prepare(`SELECT student_id,page,SUM(kind='open') opens,SUM(kind='attempt') attempts,MAX(score) best,MAX(created_at) last
      FROM events GROUP BY student_id,page`).all()).results;
    const st = await DB.prepare("SELECT value FROM settings WHERE key='require_login'").first();
    return J({ students, pages, require_login: st ? st.value === '1' : false });
  }
  const b = await body();
  if (p === 'admin/add') {
    const out = [];
    for (const n of String(b.names || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 500)) {
      const c = newCode();
      await DB.prepare('INSERT INTO students (name,code,created_at) VALUES (?,?,?)').bind(n.slice(0, 80), c, iso).run();
      out.push({ name: n, code: c });
    }
    return J({ ok: 1, added: out });
  }
  if (p === 'admin/status') { await DB.prepare('UPDATE students SET status=? WHERE id=?').bind(b.status === 'blocked' ? 'blocked' : 'active', +b.id).run(); return J({ ok: 1 }); }
  if (p === 'admin/delete') {
    await DB.batch([DB.prepare('DELETE FROM events WHERE student_id=?').bind(+b.id), DB.prepare('DELETE FROM usage WHERE student_id=?').bind(+b.id), DB.prepare('DELETE FROM students WHERE id=?').bind(+b.id)]);
    return J({ ok: 1 });
  }
  if (p === 'admin/require') { await DB.prepare("INSERT INTO settings (key,value) VALUES ('require_login',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(b.on ? '1' : '0').run(); return J({ ok: 1 }); }
  return J({ error: 'not found' }, 404);
}
