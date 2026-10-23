const J = (o, s = 200, h = {}) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...h } });
const ck = (req, n) => { const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; };
const norm = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const tok = async env => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bw|' + env.ADMIN_PASSWORD)))].map(x => x.toString(16).padStart(2, '0')).join('');
const newCode = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (const x of crypto.getRandomValues(new Uint8Array(8))) s += a[x % a.length]; return s; };
const COOKIE = 'Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax';
const TRIALS = [0, 120, 720, 1440, 2880, 10080, 14400, 43200];
const phone = v => { let d = String(v || '').replace(/\D/g, ''); if (d.startsWith('00')) d = d.slice(2); if (d.startsWith('0') && d.length === 10) d = '966' + d.slice(1); return d.slice(0, 20); };

export async function onRequest({ request, env, params }) {
  const DB = env.DB, p = (params.path || []).join('/'), m = request.method;
  if (!DB) return J({ error: 'قاعدة البيانات غير مربوطة بعد' }, 500);
  const now = Date.now(), iso = new Date(now).toISOString(), day = iso.slice(0, 10);
  const body = async () => { try { return await request.json(); } catch (e) { return {}; } };
  const setting = async k => { const r = await DB.prepare('SELECT value FROM settings WHERE key=?').bind(k).first(); return r ? r.value : ''; };

  if (p === 'public') return J({ contact: await setting('contact') });

  if (p === 'login' && m === 'POST') {
    const ip = request.headers.get('cf-connecting-ip') || 'x';
    const f = await DB.prepare('SELECT COUNT(*) n FROM login_fails WHERE ip=? AND at>?').bind(ip, now - 900000).first();
    if (f.n >= 10) return J({ error: 'محاولات خاطئة كثيرة. حاول بعد ربع ساعة.' }, 429);
    const c = norm((await body()).code);
    const s = c && await DB.prepare('SELECT * FROM students WHERE code=?').bind(c).first();
    if (!s) {
      await DB.batch([DB.prepare('INSERT INTO login_fails (ip,at) VALUES (?,?)').bind(ip, now), DB.prepare('DELETE FROM login_fails WHERE at<?').bind(now - 86400000)]);
      return J({ error: 'الكود غير صحيح' }, 401);
    }
    if (s.status !== 'active') return J({ error: 'تم إيقاف هذا الكود. تواصل مع المنصة.' }, 403);
    if (s.expires_at && s.expires_at < iso) return J({ error: 'انتهت صلاحية هذا الكود. تواصل مع المنصة للتجديد.' }, 403);
    let dev = ck(request, 'bw_dev'); if (!/^[0-9a-f-]{36}$/.test(dev)) dev = crypto.randomUUID();
    const has = await DB.prepare('SELECT 1 x FROM devices WHERE student_id=? AND device=?').bind(s.id, dev).first();
    if (has) await DB.prepare('UPDATE devices SET last_seen=? WHERE student_id=? AND device=?').bind(iso, s.id, dev).run();
    else {
      const n = (await DB.prepare('SELECT COUNT(*) n FROM devices WHERE student_id=?').bind(s.id).first()).n;
      if (s.max_devices > 0 && n >= s.max_devices) return J({ error: `هذا الكود وصل للحد الأقصى من الأجهزة (${s.max_devices}). تواصل مع المنصة.` }, 403);
      await DB.prepare('INSERT INTO devices (student_id,device,first_seen,last_seen) VALUES (?,?,?,?)').bind(s.id, dev, iso, iso).run();
    }
    const h = new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' });
    h.append('set-cookie', `bw_code=${c}; ${COOKIE}`); h.append('set-cookie', `bw_dev=${dev}; ${COOKIE}`);
    return new Response(JSON.stringify({ ok: 1, name: s.name }), { headers: h });
  }
  if (p === 'logout') return J({ ok: 1 }, 200, { 'set-cookie': 'bw_code=; Path=/; Max-Age=0' });

  if (p === 'track' && m === 'POST') {
    const s = await DB.prepare('SELECT id,status,expires_at FROM students WHERE code=?').bind(norm(ck(request, 'bw_code'))).first();
    if (!s || s.status !== 'active' || (s.expires_at && s.expires_at < iso)) return J({ ok: 0 });
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
    const students = (await DB.prepare(`SELECT s.id,s.name,s.code,s.status,s.kind,s.max_devices,s.expires_at,s.last_seen,
      (SELECT COUNT(*) FROM devices d WHERE d.student_id=s.id) devices,
      (SELECT COUNT(*) FROM events e WHERE e.student_id=s.id AND e.kind='attempt') attempts,
      (SELECT ROUND(AVG(score)) FROM events e WHERE e.student_id=s.id AND e.kind='attempt') avg,
      (SELECT COALESCE(SUM(seconds),0) FROM usage u WHERE u.student_id=s.id) secs
      FROM students s ORDER BY s.name`).all()).results;
    const pages = (await DB.prepare(`SELECT student_id,page,SUM(kind='open') opens,SUM(kind='attempt') attempts,MAX(score) best,MAX(created_at) last
      FROM events GROUP BY student_id,page`).all()).results;
    const feed = (await DB.prepare(`SELECT s.name,e.page,e.kind,e.sub,e.score,e.created_at FROM events e JOIN students s ON s.id=e.student_id ORDER BY e.id DESC LIMIT 15`).all()).results;
    return J({ students, pages, feed, settings: { require_login: await setting('require_login') === '1', trial_minutes: +(await setting('trial_minutes')) || 0, contact: await setting('contact') } });
  }
  if (p === 'admin/preview') {
    const h = new Headers({ location: '/' });
    for (const n of ['bw_code', 'bw_trial', 'bw_dev']) h.append('set-cookie', `${n}=; Path=/; Max-Age=0`);
    return new Response(null, { status: 302, headers: h });
  }
  const b = await body();
  if (p === 'admin/mode') {
    const mode = b.mode, tm = +b.trial_minutes;
    if (!['open', 'code', 'trial'].includes(mode) || (mode === 'trial' && !TRIALS.includes(tm))) return J({ error: 'قيمة غير مسموحة' }, 400);
    const put = (k, v) => DB.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k, v);
    await DB.batch([put('require_login', mode === 'open' ? '0' : '1'), put('trial_minutes', mode === 'trial' ? String(tm) : '0')]);
    return J({ ok: 1 });
  }
  if (p === 'admin/add') {
    const kind = b.kind === 'group' ? 'group' : 'single';
    let md = parseInt(b.max_devices); if (isNaN(md) || md < 0) md = kind === 'group' ? 30 : 2;
    const days = Math.max(0, parseInt(b.days) || 0), exp = days ? new Date(now + days * 864e5).toISOString() : null, out = [];
    for (const n of String(b.names || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 500)) {
      const c = newCode();
      await DB.prepare('INSERT INTO students (name,code,created_at,kind,max_devices,expires_at) VALUES (?,?,?,?,?,?)').bind(n.slice(0, 80), c, iso, kind, md, exp).run();
      out.push({ name: n, code: c });
    }
    return J({ ok: 1, added: out });
  }
  if (p === 'admin/status') { await DB.prepare('UPDATE students SET status=? WHERE id=?').bind(b.status === 'blocked' ? 'blocked' : 'active', +b.id).run(); return J({ ok: 1 }); }
  if (p === 'admin/update') {
    const s = await DB.prepare('SELECT * FROM students WHERE id=?').bind(+b.id).first();
    if (!s) return J({ error: 'غير موجود' }, 404);
    if (b.max_devices !== undefined) await DB.prepare('UPDATE students SET max_devices=? WHERE id=?').bind(Math.max(0, parseInt(b.max_devices) || 0), s.id).run();
    if (b.add_days) {
      const base = s.expires_at && s.expires_at > iso ? new Date(s.expires_at).getTime() : now;
      await DB.prepare('UPDATE students SET expires_at=? WHERE id=?').bind(new Date(base + (+b.add_days) * 864e5).toISOString(), s.id).run();
    }
    if (b.no_expiry) await DB.prepare('UPDATE students SET expires_at=NULL WHERE id=?').bind(s.id).run();
    return J({ ok: 1 });
  }
  if (p === 'admin/resetdev') { await DB.prepare('DELETE FROM devices WHERE student_id=?').bind(+b.id).run(); return J({ ok: 1 }); }
  if (p === 'admin/delete') {
    await DB.batch(['events', 'usage', 'devices'].map(t => DB.prepare(`DELETE FROM ${t} WHERE student_id=?`).bind(+b.id)).concat(DB.prepare('DELETE FROM students WHERE id=?').bind(+b.id)));
    return J({ ok: 1 });
  }
  if (p === 'admin/setting') {
    let v;
    if (b.key === 'require_login') v = b.value ? '1' : '0';
    else if (b.key === 'trial_minutes') { v = +b.value; if (!TRIALS.includes(v)) return J({ error: 'قيمة غير مسموحة' }, 400); v = String(v); }
    else if (b.key === 'contact') v = phone(b.value);
    else return J({ error: 'not found' }, 404);
    await DB.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(b.key, v).run();
    return J({ ok: 1, value: v });
  }
  return J({ error: 'not found' }, 404);
}
