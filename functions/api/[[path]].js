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
const phone = v => { let d = String(v || '').replace(/\D/g, ''); if (d.startsWith('00')) d = d.slice(2); if (d.startsWith('0') && d.length === 10) d = '966' + d.slice(1); return d.slice(0, 20); };
const pauseLeft = s => Math.max(0, Math.floor((s.duration_minutes || 0) * 0.10) - (s.pause_used || 0));
const fmtMin = m => m >= 1440 ? Math.floor(m / 1440) + ' يوم' + (m % 1440 >= 60 ? ' و' + Math.floor(m % 1440 / 60) + ' ساعة' : '') : Math.floor(m / 60) + ' ساعة';
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const passwordHash = async (password, salt = crypto.randomUUID()) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
  return `v1$${salt}$${b64(bits)}`;
};
const passwordMatches = async (password, stored) => {
  const [version, salt, expected] = String(stored || '').split('$');
  if (version !== 'v1' || !salt || !expected) return false;
  const actual = await passwordHash(password, salt);
  return actual === stored;
};
const ensureStaffSchema = DB => DB.batch([
  DB.prepare("CREATE TABLE IF NOT EXISTS staff_users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'supervisor', status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL, last_seen TEXT)"),
  DB.prepare("CREATE TABLE IF NOT EXISTS staff_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id INTEGER NOT NULL, token_hash TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, expires_at TEXT NOT NULL)"),
  DB.prepare("CREATE INDEX IF NOT EXISTS staff_sessions_token ON staff_sessions(token_hash)"),
  DB.prepare("CREATE INDEX IF NOT EXISTS staff_sessions_expiry ON staff_sessions(expires_at)"),
  DB.prepare("CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, actor_type TEXT NOT NULL, actor_id INTEGER, actor_name TEXT, action TEXT NOT NULL, target_type TEXT, target_id INTEGER, details TEXT, created_at TEXT NOT NULL)"),
  DB.prepare("CREATE INDEX IF NOT EXISTS audit_log_created ON audit_log(created_at)")
]);


export async function onRequest({ request, env, params }) {
  const DB = env.DB, p = (params.path || []).join('/'), m = request.method;
  if (!DB) return J({ error: 'قاعدة البيانات غير مربوطة بعد' }, 500);
  const now = Date.now(), iso = new Date(now).toISOString(), day = iso.slice(0, 10);
  const ip = request.headers.get('cf-connecting-ip') || 'x';
  const body = async () => { try { return await request.json(); } catch (e) { return {}; } };
  const setting = async k => { const r = await DB.prepare('SELECT value FROM settings WHERE key=?').bind(k).first(); return r ? r.value : ''; };
  const tooMany = async key => (await DB.prepare('SELECT COUNT(*) n FROM login_fails WHERE ip=? AND at>?').bind(key, now - 900000).first()).n >= 10;
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

  if (p === 'public') return J({ contact: await setting('contact'), plans: plansOf(await setting('plans')) });

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
  if (p === 'logout') return J({ ok: 1 }, 200, { 'set-cookie': 'bw_code=; Path=/; Max-Age=0' });

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

  if (!p.startsWith('admin/')) return J({ error: 'not found' }, 404);
  await ensureStaffSchema(DB);
  const staffToken = ck(request, 'bw_staff');
  const actorOf = async () => {
    if (staffToken) {
      const th = await tok({ ADMIN_PASSWORD: 'staff|' + staffToken });
      const row = await DB.prepare(`SELECT u.id,u.name,u.username,u.role,u.status,s.expires_at FROM staff_sessions s JOIN staff_users u ON u.id=s.staff_id WHERE s.token_hash=?`).bind(th).first();
      if (row && row.status === 'active' && row.expires_at > iso) {
        await DB.prepare('UPDATE staff_users SET last_seen=? WHERE id=?').bind(iso, row.id).run();
        return { type: 'staff', id: row.id, name: row.name, username: row.username, role: row.role };
      }
    }
    if (env.ADMIN_PASSWORD && ck(request, 'bw_admin') === await tok(env)) return { type: 'legacy', id: 0, name: 'المدير العام', username: 'admin', role: 'super_admin' };
    return null;
  };
  const auth = async roles => {
    const a = await actorOf();
    if (!a) return { error: J({ error: 'auth' }, 401) };
    if (roles && !roles.includes(a.role)) return { error: J({ error: 'ليس لديك صلاحية لهذه العملية' }, 403) };
    return { actor: a };
  };
  const audit = (a, action, targetType = null, targetId = null, details = '') => DB.prepare('INSERT INTO audit_log (actor_type,actor_id,actor_name,action,target_type,target_id,details,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(a.type, a.id || null, a.name, action, targetType, targetId, details, iso);

  if (p === 'admin/login' && m === 'POST') {
    if (await tooMany('a|' + ip)) return J({ error: 'محاولات كثيرة. حاول بعد ربع ساعة.' }, 429);
    const b = await body(), username = String(b.username || '').trim().toLowerCase(), password = String(b.password || '');
    if (username) {
      const u = await DB.prepare('SELECT * FROM staff_users WHERE username=?').bind(username).first();
      if (!u || u.status !== 'active' || !(await passwordMatches(password, u.password_hash))) { await addFail('a|' + ip); return J({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, 401); }
      const raw = crypto.randomUUID() + crypto.randomUUID(), th = await tok({ ADMIN_PASSWORD: 'staff|' + raw });
      await DB.batch([DB.prepare('INSERT INTO staff_sessions (staff_id,token_hash,created_at,expires_at) VALUES (?,?,?,?)').bind(u.id, th, iso, new Date(now + 2592000000).toISOString()), DB.prepare('UPDATE staff_users SET last_seen=? WHERE id=?').bind(iso, u.id)]);
      return J({ ok: 1, actor: { name: u.name, username: u.username, role: u.role } }, 200, { 'set-cookie': `bw_staff=${encodeURIComponent(raw)}; ${STAFF_COOKIE}` });
    }
    if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) { await addFail('a|' + ip); return J({ error: 'كلمة المرور غير صحيحة' }, 401); }
    return J({ ok: 1, actor: { name: 'المدير العام', username: 'admin', role: 'super_admin' } }, 200, { 'set-cookie': `bw_admin=${await tok(env)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Strict` });
  }
  if (p === 'admin/logout') return J({ ok: 1 }, 200, { 'set-cookie': 'bw_staff=; Path=/; Max-Age=0', 'set-cookie-2': 'bw_admin=; Path=/; Max-Age=0' });
  const current = await auth();
  if (current.error) return current.error;
  const A = current.actor;

  if (p === 'admin/staff' && m === 'GET') {
    if (A.role !== 'super_admin') return J({ error: 'ليس لديك صلاحية لهذه العملية' }, 403);
    const staff = (await DB.prepare('SELECT id,name,username,role,status,created_at,last_seen FROM staff_users ORDER BY id DESC').all()).results;
    return J({ staff, actor: A });
  }
  if (p === 'admin/staff/add' && m === 'POST') {
    if (A.role !== 'super_admin') return J({ error: 'ليس لديك صلاحية لهذه العملية' }, 403);
    const b = await body(), name = String(b.name || '').trim().slice(0, 80), username = String(b.username || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40), password = String(b.password || ''), role = ['content_manager','supervisor'].includes(b.role) ? b.role : 'supervisor';
    if (name.length < 2 || username.length < 3 || password.length < 8) return J({ error: 'أدخل اسمًا واسم مستخدم وكلمة مرور لا تقل عن ٨ أحرف' }, 400);
    try {
      const r = await DB.prepare('INSERT INTO staff_users (name,username,password_hash,role,status,created_at) VALUES (?,?,?,?,?,?)').bind(name, username, await passwordHash(password), role, 'active', iso).run();
      await DB.prepare('INSERT INTO audit_log (actor_type,actor_id,actor_name,action,target_type,target_id,details,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(A.type,A.id,A.name,'create','staff',r.meta.last_row_id,username,iso).run();
      return J({ ok: 1, id: r.meta.last_row_id });
    } catch (e) { return J({ error: 'اسم المستخدم مستخدم بالفعل' }, 409); }
  }
  if (p === 'admin/staff/update' && m === 'POST') {
    if (A.role !== 'super_admin') return J({ error: 'ليس لديك صلاحية لهذه العملية' }, 403);
    const b = await body(), id = +b.id, u = await DB.prepare('SELECT * FROM staff_users WHERE id=?').bind(id).first();
    if (!u) return J({ error: 'الحساب غير موجود' }, 404);
    const role = ['super_admin','content_manager','supervisor'].includes(b.role) ? b.role : u.role, status = b.status === 'blocked' ? 'blocked' : 'active', name = String(b.name || u.name).trim().slice(0,80);
    if (id === A.id && status === 'blocked') return J({ error: 'لا يمكنك إيقاف حسابك الحالي' }, 400);
    if (b.password) await DB.prepare('UPDATE staff_users SET name=?,role=?,status=?,password_hash=? WHERE id=?').bind(name,role,status,await passwordHash(String(b.password)),id).run();
    else await DB.prepare('UPDATE staff_users SET name=?,role=?,status=? WHERE id=?').bind(name,role,status,id).run();
    await DB.prepare('INSERT INTO audit_log (actor_type,actor_id,actor_name,action,target_type,target_id,details,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(A.type,A.id,A.name,'update','staff',id,role,iso).run();
    return J({ ok: 1 });
  }
  if (p === 'admin/staff/delete' && m === 'POST') {
    if (A.role !== 'super_admin') return J({ error: 'ليس لديك صلاحية لهذه العملية' }, 403);
    const id = +((await body()).id);
    if (!id || id === A.id) return J({ error: 'لا يمكن حذف الحساب الحالي' }, 400);
    await DB.batch([DB.prepare('DELETE FROM staff_sessions WHERE staff_id=?').bind(id),DB.prepare('DELETE FROM staff_users WHERE id=?').bind(id),audit(A,'delete','staff',id)]);
    return J({ ok: 1 });
  }
  if (p === 'admin/audit' && m === 'GET') {
    if (A.role !== 'super_admin') return J({ error: 'ليس لديك صلاحية لهذه العملية' }, 403);
    return J({ audit: (await DB.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 100').all()).results });
  }

  if (p === 'admin/data') {
    const students = (await DB.prepare(`SELECT s.id,s.name,s.code,s.status,s.kind,s.max_devices,s.expires_at,s.last_seen,s.duration_minutes,s.pause_used,s.pause_until,
      (SELECT COUNT(*) FROM devices d WHERE d.student_id=s.id) devices,
      (SELECT COUNT(*) FROM events e WHERE e.student_id=s.id AND e.kind='attempt') attempts,
      (SELECT ROUND(AVG(score)) FROM events e WHERE e.student_id=s.id AND e.kind='attempt') avg,
      (SELECT COALESCE(SUM(seconds),0) FROM usage u WHERE u.student_id=s.id) secs
      FROM students s ORDER BY s.name`).all()).results;
    const pages = (await DB.prepare(`SELECT student_id,page,SUM(kind='open') opens,SUM(kind='attempt') attempts,MAX(score) best,MAX(created_at) last
      FROM events GROUP BY student_id,page`).all()).results;
    const feed = (await DB.prepare(`SELECT s.name,e.page,e.kind,e.sub,e.score,e.created_at FROM events e JOIN students s ON s.id=e.student_id ORDER BY e.id DESC LIMIT 15`).all()).results;
    const bans = (await DB.prepare('SELECT ip,until FROM ip_bans WHERE until>? ORDER BY until DESC').bind(iso).all()).results;
    const flagged = (await DB.prepare('SELECT COUNT(*) n FROM trials WHERE strikes>0').first()).n;
    const staff = A.role === 'super_admin' ? (await DB.prepare('SELECT id,name,username,role,status,created_at,last_seen FROM staff_users ORDER BY id DESC').all()).results : [];
    return J({ actor: A, staff, students, pages, feed, bans, flagged, plans: plansOf(await setting('plans')), settings: { require_login: await setting('require_login') === '1', trial_minutes: +(await setting('trial_minutes')) || 0, contact: await setting('contact'), trial_guard: await setting('trial_guard') !== '0' } });
  }
  if (p === 'admin/preview') {
    const h = new Headers({ location: '/' });
    for (const n of ['bw_code', 'bw_trial', 'bw_dev']) h.append('set-cookie', `${n}=; Path=/; Max-Age=0`);
    return new Response(null, { status: 302, headers: h });
  }
  const b = await body();
  if (A.role !== 'super_admin') return J({ error: 'هذه العملية متاحة للمدير العام فقط' }, 403);
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
      await DB.prepare('INSERT INTO students (name,code,created_at,kind,max_devices,expires_at,duration_minutes) VALUES (?,?,?,?,?,?,?)').bind(n.slice(0, 80), c, iso, kind, md, exp, days ? days * 1440 : null).run();
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
      const add = +b.add_days, base = s.expires_at && s.expires_at > iso ? new Date(s.expires_at).getTime() : now;
      await DB.prepare('UPDATE students SET expires_at=?,duration_minutes=? WHERE id=?').bind(new Date(base + add * 864e5).toISOString(), (s.duration_minutes || 0) + add * 1440, s.id).run();
    }
    if (b.no_expiry) await DB.prepare('UPDATE students SET expires_at=NULL,duration_minutes=NULL,pause_until=NULL,paused_at=NULL WHERE id=?').bind(s.id).run();
    if (b.end_pause) await endPause(s);
    return J({ ok: 1 });
  }
  if (p === 'admin/resetdev') { await DB.prepare('DELETE FROM devices WHERE student_id=?').bind(+b.id).run(); return J({ ok: 1 }); }
  if (p === 'admin/delete') {
    await DB.batch(['events', 'usage', 'devices'].map(t => DB.prepare(`DELETE FROM ${t} WHERE student_id=?`).bind(+b.id)).concat(DB.prepare('DELETE FROM students WHERE id=?').bind(+b.id)));
    return J({ ok: 1 });
  }
  if (p === 'admin/setting') {
    let v;
    if (b.key === 'trial_guard') v = b.value ? '1' : '0';
    else if (b.key === 'contact') v = phone(b.value);
    else return J({ error: 'not found' }, 404);
    await DB.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(b.key, v).run();
    return J({ ok: 1, value: v });
  }
  if (p === 'admin/plans') {
    const a = (Array.isArray(b.plans) ? b.plans : []).slice(0, 6).map(x => ({ name: String(x.name || '').trim().slice(0, 40), days: Math.max(1, Math.min(3650, parseInt(x.days) || 30)), price: Math.max(0, Math.min(99999, +x.price || 0)) })).filter(x => x.name);
    await DB.prepare("INSERT INTO settings (key,value) VALUES ('plans',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(a)).run();
    return J({ ok: 1 });
  }
  if (p === 'admin/unban') { await DB.prepare('DELETE FROM ip_bans WHERE ip=?').bind(String(b.ip || '')).run(); return J({ ok: 1 }); }
  if (p === 'admin/guardreset') { await DB.batch([DB.prepare('DELETE FROM trials'), DB.prepare('DELETE FROM ip_bans')]); return J({ ok: 1 }); }
  return J({ error: 'not found' }, 404);
}
