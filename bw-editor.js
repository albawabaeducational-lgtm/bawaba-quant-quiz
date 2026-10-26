// وضع التحرير: يظهر فقط للمعلمين والإدارة الذين لهم صلاحية على هذا المقرر (يضيفه الخادم للصفحة).
// كل حفظ يُرسل للخادم الذي يتحقق من الصلاحية مرة أخرى، ويُسجَّل باسم المعلم في سجل العمليات.
(function () {
  'use strict';
  var C = window.__BWE; if (!C) return;
  var R = C.rights || {}, L = ['أ', 'ب', 'ج', 'د'];
  var KN = { ak: 'إجابة سؤال', ah: 'إرشاد سؤال', ai: 'صورة سؤال', ax: 'إخفاء سؤال', q: 'سؤال', s: 'قسم', p: 'قطعة', o: 'ترتيب قسم', qq: 'إجابة سؤال كمي', qh: 'إرشاد سؤال كمي', r: 'سؤال', k: 'إجابة سؤال' };
  var TYN = (typeof window.TYN !== 'undefined' && window.TYN) || (function () { try { return eval('typeof TYN!=="undefined"?TYN:null'); } catch (e) { return null; } })() || ['التناظر اللفظي', 'إكمال الجمل', 'الخطأ السياقي', 'استيعاب المقروء', 'المفردة الشاذة'];
  function g(name) { try { return eval('typeof ' + name + '!=="undefined"?' + name + ':undefined'); } catch (e) { return undefined; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function short(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; }
  function ago(t) { if (!t) return ''; var m = Math.round((Date.now() - new Date(t)) / 60000); return m < 1 ? 'الآن' : m < 60 ? 'قبل ' + m + ' د' : m < 1440 ? 'قبل ' + Math.round(m / 60) + ' س' : 'قبل ' + Math.round(m / 1440) + ' يوم'; }

  // ---------- البيانات ----------
  var M = C.model, B = window.__bwBase || {}, X = window.__BWX || { p: [] };
  var E = { view: 'home', sec: null, f: '', page: 0, tab: 'v', changed: false, qqSec: null };
  var D = null, RAWK = null, KEYS = null;
  var patched = {}; (X.p || []).forEach(function (r) { patched[r[0] + '|' + r[1]] = r[2] === null ? 'del' : 1; });
  function load() {
    if (M === 'bank') { var db = g('DB'); D = db ? clone(db) : null; }
    else if (M === 'raw') { var r = g('RAW'); D = r ? clone(r) : null; RAWK = (window.__bwRawKeys || (D || []).map(function (_, i) { return String(i); })).slice(); }
    else if (M === 'static') { var mt = window.__bwMT; D = mt ? clone(mt) : null; }
    else if (M === 'key') { var k = g('KEY'); D = k ? Array.from(k) : null; KEYS = Array.from(B.key || k || ''); }
  }
  var baseQ = {}; (B.q || []).forEach(function (id) { baseQ[id] = 1; });
  var baseS = {}; (B.s || []).forEach(function (id) { baseS[id] = 1; });
  function inBase(kind, key) {
    if (kind === 'q') return !!baseQ[+key];
    if (kind === 's') return !!baseS[+key];
    if (kind === 'r') return /^\d+$/.test(key) && +key < (B.n || 0);
    return true;
  }

  // ---------- الواجهة العامة ----------
  var fabCss = 'body.testing #bwe-fab,body.testing #bwe-bar{display:none}#bwe-bar{direction:rtl;font-family:Cairo,Tahoma,Arial,sans-serif;background:linear-gradient(90deg,#0f2a44,#165a8a);color:#fff;padding:9px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:13.5px;line-height:1.6;position:relative;z-index:60;box-shadow:0 3px 10px #0002}#bwe-bar b{font-size:14.5px}#bwe-bar .sp{flex:1}#bwe-bar a,#bwe-bar button{font:700 13px Cairo,Tahoma,Arial,sans-serif;border:0;border-radius:99px;padding:6px 14px;text-decoration:none;cursor:pointer;background:#ffffff1f;color:#fff;white-space:nowrap}#bwe-bar .pri{background:#f0b429;color:#102a43}#bwe-bar .ck{background:#ffffff1a;border-radius:99px;padding:1px 9px;font-size:11.5px;margin-inline-start:3px}#bwe-bar.warn{background:linear-gradient(90deg,#6b4a00,#a87600)}#bwe-fab{position:fixed;left:16px;bottom:16px;z-index:2147483100;background:linear-gradient(135deg,#12345a,#1769aa);color:#fff;border:0;border-radius:99px;padding:12px 18px;font:800 14px Cairo,Tahoma,Arial,sans-serif;box-shadow:0 8px 24px #12345a55;cursor:pointer;direction:rtl}#bwe-fab:hover{filter:brightness(1.1)}';
  var css = ':host{position:fixed;inset:0;z-index:2147483200;background:#eef4f9;direction:rtl;font-family:Cairo,Tahoma,Arial,sans-serif;color:#172b4d;overflow:auto;font-size:14px;line-height:1.6}*{box-sizing:border-box}'
    + '.hd{position:sticky;top:0;z-index:5;background:#102a43;color:#fff;padding:10px 16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;box-shadow:0 4px 14px #0003}.hd b{font-size:16px}.hd .sp{flex:1}.chip{display:inline-block;border-radius:99px;padding:1px 9px;font-size:11.5px;font-weight:700;background:#ffffff1f;margin-inline-start:4px}.chip.on{background:#1fb47b}.chip.off{background:#ffffff14;color:#9fb6c8;text-decoration:line-through}'
    + '.wrap{max-width:1100px;margin:auto;padding:16px}.card{background:#fff;border:1px solid #dfeaf2;border-radius:16px;padding:16px;margin-bottom:14px;box-shadow:0 6px 18px #173a5a0a}h2{margin:0 0 10px;font-size:17px;color:#12345a}h3{margin:0 0 8px;font-size:15px;color:#12345a}'
    + 'button{font:700 13px Cairo,Tahoma,Arial,sans-serif;border:0;border-radius:10px;padding:8px 13px;cursor:pointer;background:#12345a;color:#fff}button:disabled{opacity:.45;cursor:not-allowed}button.g{background:#e3ebf3;color:#12345a}button.r{background:#c0392b}button.o{background:#1e8a4c}button.sm{padding:5px 10px;font-size:12px}.hd button{background:#ffffff1a}.hd button.hot{background:#f0b429;color:#102a43}'
    + 'input,select,textarea{font:inherit;padding:9px 11px;border:1px solid #cbdce8;border-radius:10px;width:100%;background:#fff;color:inherit}textarea{min-height:80px;resize:vertical}input[type=radio],input[type=checkbox]{width:auto}label.f{display:block;font-size:12.5px;font-weight:700;color:#5b6b7b;margin:10px 0 4px}'
    + '.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.m{color:#6b7c93;font-size:12.5px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px}'
    + '.sec{border:1px solid #dfeaf2;background:#f8fbfd;border-radius:12px;padding:10px;text-align:right;color:#172b4d;font-weight:600}.sec:hover{border-color:#1769aa}.sec b{color:#1769aa;margin-left:6px}.sec small{display:block;color:#6b7c93;font-size:11.5px}'
    + '.q{border:1px solid #e3ecf3;border-radius:12px;padding:12px;margin:8px 0;background:#fff}.q.mod{border-color:#f0b429;background:#fffdf5}.q.new{border-color:#1fb47b;background:#f5fdf9}.q img.th{max-height:120px;max-width:100%;border:1px solid #e3ecf3;border-radius:8px;background:#fff;display:block;margin:6px 0}'
    + '.ops{list-style:none;padding:0;margin:6px 0;display:grid;gap:4px}.ops li{padding:4px 9px;border-radius:8px;background:#f5f8fb}.ops li.ok{background:#dff3e6;color:#1e7a45;font-weight:700}'
    + '.b{display:inline-block;padding:1px 9px;border-radius:99px;font-size:11px;font-weight:800}.b.mod{background:#fff1cc;color:#8a6200}.b.new{background:#dff3e6;color:#1e8a4c}.b.t{background:#e1f0fb;color:#1769aa}'
    + '.ans{display:flex;gap:8px;flex-wrap:wrap}.ans label{display:flex;align-items:center;gap:6px;border:1.5px solid #dfeaf2;border-radius:10px;padding:8px 12px;cursor:pointer;font-weight:800}.ans label.on{border-color:#1e8a4c;background:#dff3e6;color:#1e7a45}'
    + '.opt{display:flex;gap:8px;align-items:center;margin:6px 0}.opt input[type=text]{flex:1}.opt.on input[type=text]{border-color:#1e8a4c;background:#f2fbf6}'
    + '.kg{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px}.kc{border:1px solid #dfeaf2;border-radius:10px;padding:6px;text-align:center;background:#fff}.kc.ch{border-color:#f0b429;background:#fffbea}.kc b{display:block;font-size:12px;color:#6b7c93}.kc select{padding:4px;text-align:center;font-weight:800}'
    + '.imgbox{border:2px dashed #cbdce8;border-radius:12px;padding:10px;text-align:center;background:#f8fbfd}.imgbox img{max-width:100%;max-height:340px;display:block;margin:0 auto 8px}'
    + '.toast{position:fixed;bottom:16px;left:16px;z-index:9;background:#12345a;color:#fff;padding:10px 16px;border-radius:12px;font-weight:700;box-shadow:0 8px 22px #0004}.toast.err{background:#c0392b}.toast.ok{background:#1e8a4c}'
    + '.note{background:#fff8e1;border:1px solid #f3dd9c;border-radius:12px;padding:10px 12px;margin-bottom:12px;color:#7a5800;font-size:13px}.pg{display:flex;gap:6px;justify-content:center;margin-top:10px}'
    + '@media(max-width:600px){.wrap{padding:10px}.hd b{font-size:14px}#bwe-fab{padding:10px 14px;font-size:13px}}';
  var st = document.createElement('style'); st.textContent = fabCss; document.head.appendChild(st);
  // شريط «وضع المعلم» أعلى الصفحة: يوضح للمعلم أنه داخل بحسابه وما المسموح له في هذا المقرر
  var anyLink = (C.links || []).some(function (l) { return l.rights; });
  var canWork = M === 'linked' ? anyLink : !!C.rights;
  var bar = document.createElement('div'); bar.id = 'bwe-bar';
  var RL = function (r) { return r ? ['edit', 'add', 'delete'].filter(function (k) { return r[k]; }).map(function (k) { return '<span class="ck">' + { edit: 'تعديل', add: 'إضافة', delete: 'حذف' }[k] + '</span>'; }).join('') : ''; };
  if (!canWork) { bar.className = 'warn'; bar.innerHTML = '<b>👨‍🏫 ' + esc(C.name) + '</b><span>هذا المقرر غير مسند لحسابك، لذلك تراه مثل الطالب. اطلب من الإدارة إسناده لك من «فريق العمل».</span><span class="sp"></span><a href="/admin">لوحة التحكم</a>'; }
  else if (M === 'linked') bar.innerHTML = '<b>👨‍🏫 وضع المعلم · ' + esc(C.title) + '</b><span>يُبنى تلقائيًا من أقسام الكمي واللفظي — عدّل الأسئلة من مقررها:</span><span class="sp"></span>' + (C.links || []).filter(function (l) { return l.rights; }).map(function (l) { return '<a class="pri" href="' + esc(l.url) + '?edit=1">✏ ' + esc(l.title) + '</a>'; }).join('') + '<a href="/admin#courses:' + encodeURIComponent(C.course) + '">📊 تقارير المقرر</a><a href="/admin">لوحة التحكم</a>';
  else bar.innerHTML = '<b>👨‍🏫 وضع المعلم · ' + esc(C.title) + '</b><span>أهلًا ' + esc(C.name) + ' — صلاحياتك هنا:' + RL(C.rights) + '</span><span class="sp"></span><button class="pri" type="button" id="bwe-open">✏ تحرير الأسئلة</button><a href="/admin#courses:' + encodeURIComponent(C.course) + '">📊 تقارير المقرر</a><a href="/admin">لوحة التحكم</a>';
  document.body.insertBefore(bar, document.body.firstChild);
  if (!canWork || M === 'linked') return;
  bar.querySelector('#bwe-open').onclick = function () { open(); };
  var fab = document.createElement('button'); fab.id = 'bwe-fab'; fab.type = 'button'; fab.textContent = '✏ تحرير الأسئلة'; fab.onclick = open;
  document.body.appendChild(fab);
  var root = null, host = null; // الواجهة داخل Shadow DOM حتى لا تتأثر بتنسيقات صفحة الاختبار

  function toast(t, k) { if (!root) return; var e = document.createElement('div'); e.className = 'toast ' + (k || ''); e.textContent = t; root.appendChild(e); setTimeout(function () { e.remove(); }, 3000); }
  function open() {
    load();
    if (!D) { alert('تعذّر قراءة أسئلة هذه الصفحة.'); return; }
    if (!root) { host = document.createElement('div'); host.id = 'bwe'; document.body.appendChild(host); var sh = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host; var sst = document.createElement('style'); sst.textContent = css; sh.appendChild(sst); root = document.createElement('div'); sh.appendChild(root); root.addEventListener('click', onClick); root.addEventListener('change', onChange); root.addEventListener('input', onInput); }
    host.style.display = 'block'; document.documentElement.style.overflow = 'hidden'; fab.style.display = 'none';
    draw();
  }
  function close() {
    if (E.changed) { reload(); return; }
    host.style.display = 'none'; document.documentElement.style.overflow = ''; fab.style.display = '';
  }
  function reload() { var u = new URL(location.href); u.searchParams.set('edit', '1'); location.href = u.toString(); }
  window.bwEdit = open;

  async function api(path, body) {
    var r = await fetch('/api/admin/' + path, body === undefined ? { credentials: 'same-origin' } : { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    var d = await r.json().catch(function () { return {}; });
    if (r.status === 401) throw new Error('انتهت جلستك. سجّل الدخول من لوحة التحكم ثم أعد المحاولة.');
    if (!r.ok) throw new Error(d.error || 'حدث خطأ');
    return d;
  }
  async function save(ops, msg) {
    try { await api('exam/save', { course: C.course, ops: ops }); ops.forEach(function (o) { patched[o.kind + '|' + o.key] = o.data === null ? 'del' : 1; }); E.changed = true; toast(msg || 'تم الحفظ ✓', 'ok'); return true; }
    catch (e) { toast(e.message, 'err'); return false; }
  }
  function ask(msg) { return window.confirm(msg); }

  function header() {
    var ch = function (k, t) { return '<span class="chip ' + (R[k] ? 'on' : 'off') + '">' + t + '</span>'; };
    return '<div class="hd"><b>✏ وضع التحرير · ' + esc(C.title) + '</b><span>' + ch('edit', 'تعديل') + ch('add', 'إضافة') + ch('delete', 'حذف') + '</span><span class="sp"></span>'
      + '<button data-a="reps">⚑ بلاغات الطلاب</button><button data-a="hist">سجل التعديلات</button>' + (E.changed ? '<button class="hot" data-a="reload">↻ تطبيق التعديلات على الصفحة</button>' : '') + '<button data-a="close">✕ إغلاق</button></div>';
  }
  function draw() {
    var h = header() + '<div class="wrap">';
    if (E.changed) h += '<div class="note">تم حفظ تعديلاتك على الخادم وتظهر للطلاب عند فتحهم الصفحة. اضغط «تطبيق التعديلات على الصفحة» لتراها هنا أيضًا.</div>';
    if (E.view === 'hist') h += viewHist();
    else if (E.view === 'reps') h += viewReps();
    else if (M === 'bank') h += E.view === 'q' ? viewQ() : E.view === 'sec' ? viewSec() : viewHome();
    else if (M === 'raw') h += E.view === 'q' ? viewRawQ() : viewRaw();
    else if (M === 'static') h += E.view === 'q' ? viewStQ() : E.view === 'sec' ? viewStSec() : viewStHome();
    else h += viewKey();
    root.innerHTML = h + '</div>';
    if (E.view === 'q' && M === 'bank') prevQ();
  }

  // ---------- بنك الأسئلة ----------
  var secName = function (id) { var s = D.secs.filter(function (x) { return x.id === id; })[0]; return s ? s.name : ''; };
  var secQs = function (id) { return D.qs.filter(function (a) { return a[1] === id; }); };
  var qImg = function (a) { var m = /\/api\/exam\/img\/\d+/.exec(a[4] || ''); return m ? m[0] : 'img/' + a[0] + '.webp'; };
  function badge(kind, key) { var p = patched[kind + '|' + key]; if (!p || p === 'del') return ''; return inBase(kind, key) ? '<span class="b mod">معدّل</span>' : '<span class="b new">مضاف</span>'; }
  function viewHome() {
    var h = '';
    if (C.qq) h += '<div class="row" style="margin-bottom:12px"><button class="' + (E.tab === 'v' ? '' : 'g') + '" data-a="tab" data-v="v">الأسئلة اللفظية</button><button class="' + (E.tab === 'q' ? '' : 'g') + '" data-a="tab" data-v="q">الأسئلة الكمية (الإجابات والإرشادات)</button></div>';
    if (C.qq && E.tab === 'q') return h + viewQQ();
    var f = E.f.trim();
    h += '<div class="card"><div class="row"><input id="bwe-f" placeholder="🔎 ابحث في نص الأسئلة والاختيارات (حرفان على الأقل)…" value="' + esc(E.f) + '" style="flex:1;min-width:200px">' + (R.add ? '<button data-a="addsec">＋ قسم جديد</button>' : '') + '</div>';
    if (f.length >= 2) {
      var res = D.qs.filter(function (a) { return String(a[4]).indexOf(f) >= 0 || (a[5] || []).some(function (o) { return String(o).indexOf(f) >= 0; }) || (a[3] >= 0 && D.ps && String(D.ps[a[3]] || '').indexOf(f) >= 0) || String(a[0]) === f; }).slice(0, 40);
      h += '<h3 style="margin-top:12px">نتائج البحث (' + res.length + (res.length === 40 ? '+' : '') + ')</h3>' + (res.map(function (a) { return qRow(a, true); }).join('') || '<p class="m">لا توجد نتائج.</p>');
    }
    h += '</div><div class="card"><h2>الأقسام (' + D.secs.length + ') · ' + D.qs.length + ' سؤال</h2><div class="grid">' + D.secs.slice().sort(function (a, b) { return a.id - b.id; }).map(function (s) {
      var mod = secQs(s.id).some(function (a) { return patched['q|' + a[0]]; }) || patched['s|' + s.id];
      return '<button class="sec" data-sec="' + s.id + '"><b>' + s.id + '</b>' + esc(short(s.name, 40)) + (mod ? ' <span class="b mod">✎</span>' : '') + '<small>' + secQs(s.id).length + ' سؤال</small></button>';
    }).join('') + '</div></div>';
    return h;
  }
  function qRow(a, withSec) {
    var p = patched['q|' + a[0]], cls = p ? (inBase('q', a[0]) ? ' mod' : ' new') : '', body;
    if (C.img) body = '<img class="th" loading="lazy" src="' + esc(qImg(a)) + '" alt=""><div>✓ الإجابة الصحيحة: <b>' + L[a[6]] + '</b>' + (a[7] ? ' · 💡 له إرشاد' : '') + '</div>';
    else body = (a[3] >= 0 && D.ps ? '<div class="m">📄 قطعة: ' + esc(short(D.ps[a[3]], 90)) + '</div>' : '') + '<div style="font-weight:700;margin:4px 0">' + esc(short(a[4], 220)) + '</div><ul class="ops">' + (a[5] || []).map(function (o, i) { return '<li class="' + (i === a[6] ? 'ok' : '') + '">' + L[i] + ') ' + esc(o) + '</li>'; }).join('') + '</ul>';
    var inSec = secQs(a[1]), k = inSec.indexOf(a);
    return '<div class="q' + cls + '"><div class="row"><b>سؤال ' + (withSec ? '#' + a[0] : (k + 1)) + '</b>' + (C.img ? '' : '<span class="b t">' + esc(TYN[a[2]] || '') + '</span>') + badge('q', a[0]) + (withSec ? '<span class="m">القسم ' + a[1] + ': ' + esc(short(secName(a[1]), 40)) + '</span>' : '') + '<span class="m">رقم ' + a[0] + '</span></div>' + body
      + '<div class="row" style="margin-top:6px">' + (R.edit ? '<button class="sm" data-a="editq" data-id="' + a[0] + '">✏ تعديل</button>' : '')
      + (R.edit && !withSec ? '<button class="g sm" data-a="up" data-id="' + a[0] + '"' + (k ? '' : ' disabled') + '>↑</button><button class="g sm" data-a="dn" data-id="' + a[0] + '"' + (k < inSec.length - 1 ? '' : ' disabled') + '>↓</button>' : '')
      + (R.add ? '<button class="g sm" data-a="dupq" data-id="' + a[0] + '">نسخ كسؤال جديد</button>' : '')
      + (R.delete ? '<button class="r sm" data-a="delq" data-id="' + a[0] + '">حذف</button>' : '')
      + (p && (inBase('q', a[0]) ? R.edit : R.delete) ? '<button class="g sm" data-a="revert" data-k="q" data-id="' + a[0] + '">↶ رجوع للأصل</button>' : '') + '</div></div>';
  }
  function viewSec() {
    var s = D.secs.filter(function (x) { return x.id === E.sec; })[0]; if (!s) { E.view = 'home'; return viewHome(); }
    var qs = secQs(s.id);
    return '<div class="row" style="margin-bottom:10px"><button class="g" data-a="home">→ كل الأقسام</button><span class="sp" style="flex:1"></span>' + (R.delete ? '<button class="r sm" data-a="delsec">حذف القسم' + (qs.length ? ' وأسئلته' : '') + '</button>' : '') + '</div>'
      + '<div class="card"><h2>القسم ' + s.id + badge('s', s.id) + '</h2>' + (R.edit ? '<div class="row"><input id="bwe-sn" value="' + esc(s.name) + '" style="flex:1"><button data-a="savesec">حفظ اسم القسم</button></div>' : '<p>' + esc(s.name) + '</p>') + '</div>'
      + '<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">الأسئلة (' + qs.length + ')</h2>' + (R.add ? '<button data-a="addq">＋ سؤال جديد</button>' : '') + '</div>' + (qs.map(function (a) { return qRow(a, false); }).join('') || '<p class="m" style="text-align:center;padding:16px">لا توجد أسئلة في هذا القسم.</p>') + '</div>';
  }
  function nextId() { var m = 0; D.qs.forEach(function (a) { if (a[0] > m) m = a[0]; }); (B.q || []).forEach(function (id) { if (id > m) m = id; }); Object.keys(patched).forEach(function (k) { if (k.indexOf('q|') === 0 && +k.slice(2) > m) m = +k.slice(2); }); return m + 1; }
  function startQ(id, isNew, dup) {
    var src = D.qs.filter(function (x) { return x[0] === id; })[0];
    var a = src ? clone(src) : (C.img ? [0, E.sec, 0, -1, '', L.slice(), 0] : [0, E.sec, 0, -1, '', ['', '', '', ''], 0]);
    if (isNew || dup) a[0] = nextId();
    if (dup && C.img) a[4] = '';
    while (!C.img && a[5].length < 4) a[5].push('');
    E.q = { a: a, isNew: !!(isNew || dup), ptext: a[3] >= 0 && D.ps ? D.ps[a[3]] : '', pmode: a[3] >= 0 ? String(a[3]) : 'none', img: C.img ? (src && !dup ? qImg(a) : '') : '' };
    E.view = 'q'; draw(); host.scrollTop = 0;
  }
  function viewQ() {
    var q = E.q, a = q.a, h = '<div class="row" style="margin-bottom:10px"><button class="g" data-a="backsec">→ رجوع</button><h2 style="margin:0">' + (q.isNew ? 'سؤال جديد' : 'تعديل السؤال رقم ' + a[0]) + '</h2></div><div class="card">';
    h += '<label class="f">القسم</label><select id="bwe-s">' + D.secs.slice().sort(function (x, y) { return x.id - y.id; }).map(function (s) { return '<option value="' + s.id + '"' + (s.id === a[1] ? ' selected' : '') + '>' + s.id + ': ' + esc(short(s.name, 50)) + '</option>'; }).join('') + '</select>';
    if (C.img) {
      h += '<label class="f">صورة السؤال ' + (q.isNew ? '(مطلوبة)' : '') + '</label><div class="imgbox">' + (q.img ? '<img id="bwe-im" src="' + esc(q.img) + '" alt="">' : '<p class="m" id="bwe-noimg">لم تُرفع صورة بعد.</p>') + '<input type="file" id="bwe-file" accept="image/*" style="display:none"><button class="g" data-a="pick">📷 ' + (q.img ? 'استبدال الصورة' : 'رفع صورة السؤال') + '</button><div class="m" style="margin-top:6px">يمكنك أيضًا لصق صورة (Ctrl+V) مباشرة. الصورة تُضغط تلقائيًا قبل الرفع.</div></div>';
      h += '<label class="f">الإجابة الصحيحة</label><div class="ans">' + L.map(function (l, i) { return '<label class="' + (i === a[6] ? 'on' : '') + '"><input type="radio" name="bwe-c" value="' + i + '"' + (i === a[6] ? ' checked' : '') + '>' + l + '</label>'; }).join('') + '</div>';
    } else {
      h += '<div class="row" style="align-items:flex-start"><div style="flex:1;min-width:200px"><label class="f">نوع السؤال</label><select id="bwe-t">' + TYN.map(function (t, i) { return '<option value="' + i + '"' + (i === a[2] ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></div>';
      var used = {}; secQs(a[1]).forEach(function (x) { if (x[3] >= 0) used[x[3]] = 1; }); if (a[3] >= 0) used[a[3]] = 1;
      h += '<div style="flex:2;min-width:220px"><label class="f">القطعة (لاستيعاب المقروء)</label><select id="bwe-pm"><option value="none">بدون قطعة</option>' + Object.keys(used).map(function (i) { return '<option value="' + i + '"' + (q.pmode === i ? ' selected' : '') + '>قطعة رقم ' + i + ': ' + esc(short(D.ps[i], 50)) + '</option>'; }).join('') + (R.add ? '<option value="new"' + (q.pmode === 'new' ? ' selected' : '') + '>＋ قطعة جديدة</option>' : '') + '</select></div></div>';
      if (q.pmode !== 'none') h += '<label class="f">نص القطعة' + (q.pmode !== 'new' ? ' <span class="m">(التعديل هنا يغيّر القطعة لكل الأسئلة المرتبطة بها)</span>' : '') + '</label><textarea id="bwe-p" style="min-height:140px"' + (q.pmode !== 'new' && !R.edit ? ' readonly' : '') + '>' + esc(q.ptext) + '</textarea>';
      h += '<label class="f">نص السؤال</label><textarea id="bwe-q">' + esc(a[4]) + '</textarea><label class="f">الاختيارات — اختر الدائرة بجانب الإجابة الصحيحة</label>';
      h += a[5].map(function (o, i) { return '<div class="opt' + (i === a[6] ? ' on' : '') + '"><input type="radio" name="bwe-c" value="' + i + '"' + (i === a[6] ? ' checked' : '') + ' title="الإجابة الصحيحة"><b>' + L[i] + '</b><input type="text" data-o="' + i + '" value="' + esc(o) + '"></div>'; }).join('');
    }
    if (C.hints) h += '<label class="f">💡 إرشاد للطالب (اختياري)</label><textarea id="bwe-h" style="min-height:60px" placeholder="تلميح يوجّه الطالب وليس الحل">' + esc(a[7] || '') + '</textarea>';
    h += '<div class="row" style="margin-top:14px"><button data-a="saveq">💾 حفظ السؤال</button><button class="g" data-a="backsec">إلغاء</button></div></div>';
    if (C.img) h += '<div class="card"><h3>معاينة كما يراها الطالب</h3><div id="bwe-prev"></div></div>';
    return h;
  }
  function syncQ() {
    var q = E.q, a = q.a, $ = function (id) { return root.querySelector('#' + id); };
    if ($('bwe-s')) a[1] = +$('bwe-s').value;
    var c = root.querySelector('input[name=bwe-c]:checked'); if (c) a[6] = +c.value;
    if ($('bwe-t')) a[2] = +$('bwe-t').value;
    if ($('bwe-q')) a[4] = $('bwe-q').value;
    root.querySelectorAll('[data-o]').forEach(function (i) { a[5][+i.dataset.o] = i.value; });
    if ($('bwe-pm')) q.pmode = $('bwe-pm').value;
    if ($('bwe-p')) q.ptext = $('bwe-p').value;
    if ($('bwe-h')) a[7] = $('bwe-h').value;
  }
  function prevQ() {
    var p = root.querySelector('#bwe-prev'); if (!p) return; var a = E.q.a;
    p.innerHTML = (E.q.img ? '<img src="' + esc(E.q.img) + '" alt="" style="max-width:100%;display:block;margin:auto">' : '<p class="m">ارفع صورة السؤال لتظهر هنا.</p>') + '<div class="ans" style="margin-top:10px;justify-content:center">' + L.map(function (l, i) { return '<label class="' + (i === a[6] ? 'on' : '') + '">' + l + '</label>'; }).join('') + '</div>';
  }
  async function saveQ() {
    syncQ(); var q = E.q, a = q.a, ops = [];
    if (C.img) {
      if (!q.img) { toast('ارفع صورة السؤال أولًا', 'err'); return; }
      a[4] = /^\/api\//.test(q.img) ? '<p><img src="' + q.img + '" alt="صورة السؤال"></p>' : '<p><img src="img/' + a[0] + '.webp" alt="صورة السؤال"></p>'; a[5] = L.slice(); a[2] = 0; a[3] = -1;
    } else {
      if (!String(a[4]).trim()) { toast('اكتب نص السؤال', 'err'); return; }
      while (a[5].length && !String(a[5][a[5].length - 1]).trim() && a[5].length > 2 && a[6] < a[5].length - 1) a[5].pop();
      if (a[5].some(function (o) { return !String(o).trim(); })) { toast('اكتب كل الاختيارات', 'err'); return; }
      if (q.pmode === 'none') a[3] = -1;
      else if (q.pmode === 'new') { if (!q.ptext.trim()) { toast('اكتب نص القطعة', 'err'); return; } a[3] = (D.ps || []).length; ops.push({ kind: 'p', key: String(a[3]), act: 'add', data: q.ptext }); }
      else { a[3] = +q.pmode; if (R.edit && q.ptext !== D.ps[a[3]]) ops.push({ kind: 'p', key: String(a[3]), act: 'edit', data: q.ptext }); }
    }
    a[7] = String(a[7] || '').trim(); if (!a[7]) a.length = 7;
    ops.push({ kind: 'q', key: String(a[0]), act: q.isNew ? 'add' : 'edit', data: a });
    if (!(await save(ops, 'تم حفظ السؤال ✓'))) return;
    ops.forEach(function (o) { if (o.kind === 'p') { D.ps = D.ps || []; D.ps[+o.key] = o.data; } });
    var i = D.qs.findIndex(function (x) { return x[0] === a[0]; });
    if (i >= 0) D.qs[i] = a; else { var last = -1; D.qs.forEach(function (x, k) { if (x[1] === a[1]) last = k; }); if (last < 0) D.qs.push(a); else D.qs.splice(last + 1, 0, a); }
    E.sec = a[1]; E.view = 'sec'; draw();
  }
  async function upload(file) {
    if (!file || !/^image\//.test(file.type)) { toast('اختر ملف صورة', 'err'); return; }
    toast('جارٍ رفع الصورة…');
    try {
      var data = await new Promise(function (res, rej) { var im = new Image(); im.onload = function () { var s = Math.min(1, 1400 / im.naturalWidth), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s); var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); var d = c.toDataURL('image/webp', 0.85); if (d.indexOf('data:image/webp') !== 0) d = c.toDataURL('image/jpeg', 0.85); res(d); }; im.onerror = rej; im.src = URL.createObjectURL(file); });
      var r = await api('exam/upload', { course: C.course, data: data });
      if (M === 'static') { var cc = root.querySelector('input[name=bwe-c]:checked'); if (cc) E.q.c = +cc.value; var hh = root.querySelector('#bwe-h'); if (hh) E.q.h = hh.value; } else syncQ();
      E.q.img = r.src; draw(); toast('تم رفع الصورة ✓ لا تنسَ حفظ السؤال', 'ok');
    } catch (e) { toast(e.message || 'تعذّر رفع الصورة', 'err'); }
  }
  function viewQQ() {
    var qq = D.qq || [], QH = D.qh || {}, secs = []; qq.forEach(function (a) { if (secs.indexOf(a[1]) < 0) secs.push(a[1]); }); secs.sort(function (x, y) { return x - y; });
    if (E.qqSec === null || secs.indexOf(E.qqSec) < 0) E.qqSec = secs[0];
    return '<div class="card"><div class="row"><label class="f" style="margin:0">القسم الكمي</label><select id="bwe-qqs" style="max-width:220px">' + secs.map(function (s) { return '<option value="' + s + '"' + (s === E.qqSec ? ' selected' : '') + '>كمي: القسم ' + s + '</option>'; }).join('') + '</select><span class="m">هذه الأسئلة صور من «أقسام الكمي»؛ يمكن هنا تعديل الإجابة الصحيحة والإرشاد فقط.</span></div></div>'
      + qq.filter(function (a) { return a[1] === E.qqSec; }).map(function (a) {
        var p = patched['qq|' + a[0]] || patched['qh|' + a[0]];
        return '<div class="q' + (p ? ' mod' : '') + '" data-qq="' + a[0] + '"><div class="row"><b>صورة رقم ' + a[0] + '</b>' + (p ? '<span class="b mod">معدّل</span>' : '') + '</div><img class="th" style="max-height:220px" loading="lazy" src="img/' + a[0] + '.webp" alt=""><div class="ans">' + L.map(function (l, i) { return '<label class="' + (i === a[2] ? 'on' : '') + '"><input type="radio" name="qq' + a[0] + '" value="' + i + '"' + (i === a[2] ? ' checked' : '') + (R.edit ? '' : ' disabled') + '>' + l + '</label>'; }).join('') + '</div>'
          + '<label class="f">💡 إرشاد</label><input data-qh="' + a[0] + '" value="' + esc(QH[a[0]] || '') + '"' + (R.edit ? '' : ' readonly') + '>' + (R.edit ? '<div class="row" style="margin-top:8px"><button class="sm" data-a="saveqq" data-id="' + a[0] + '">حفظ</button>' + (p ? '<button class="g sm" data-a="revertqq" data-id="' + a[0] + '">↶ رجوع للأصل</button>' : '') + '</div>' : '') + '</div>';
      }).join('');
  }

  // ---------- بنك صور ثابت (الأكثر تكرارًا): الإجابة والإرشاد وصورة السؤال وإخفاؤه ----------
  var SAI = clone(window.__BWAI || {}), SAX = clone(window.__BWAX || {});
  var stImg = function (id) { return SAI[id] || 'mt/' + String(id).padStart(4, '0') + '.webp'; };
  var stMod = function (id) { return ['ak', 'ah', 'ai', 'ax'].some(function (k) { return patched[k + '|' + id] === 1; }); };
  var stModel = function (id) { var m = (D.models || []).filter(function (x) { return x.id === id; })[0]; return m ? m.name : 'نموذج ' + id; };
  function stRow(a, withModel) {
    var id = a[0], hid = !!SAX[id];
    return '<div class="q' + (hid ? '' : stMod(id) ? ' mod' : '') + '"' + (hid ? ' style="opacity:.6"' : '') + '><div class="row"><b>سؤال رقم ' + id + '</b>' + (hid ? '<span class="b mod">مخفي عن الطلاب</span>' : stMod(id) ? '<span class="b mod">معدّل</span>' : '') + (withModel ? '<span class="m">' + esc(stModel(a[1])) + '</span>' : '') + '</div>'
      + '<img class="th" loading="lazy" src="' + esc(stImg(id)) + '" alt=""><div>✓ الإجابة الصحيحة: <b>' + L[a[2]] + '</b>' + (a[3] ? ' · 💡 ' + esc(short(a[3], 90)) : ' · <span class="m">بدون إرشاد</span>') + '</div>'
      + '<div class="row" style="margin-top:6px">' + (R.edit ? '<button class="sm" data-a="stedit" data-id="' + id + '">✏ تعديل</button>' : '') + (stMod(id) && R.edit ? '<button class="g sm" data-a="strev" data-id="' + id + '">↶ رجوع للأصل</button>' : '') + '</div></div>';
  }
  function viewStHome() {
    var f = E.f.trim(), h = '<div class="card"><div class="row"><input id="bwe-f" placeholder="🔎 اكتب رقم السؤال أو كلمة من الإرشاد…" value="' + esc(E.f) + '" style="flex:1;min-width:200px"></div><p class="m" style="margin:8px 0 0">أسئلة هذا المقرر صور؛ يمكنك تعديل الإجابة الصحيحة والإرشاد، واستبدال صورة السؤال بصورة مصححة، أو إخفاء السؤال عن الطلاب.</p>';
    if (f) {
      var res = D.qs.filter(function (a) { return String(a[0]) === f.replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }) || (f.length >= 2 && String(a[3] || '').indexOf(f) >= 0); }).slice(0, 30);
      h += '<h3 style="margin-top:12px">نتائج البحث (' + res.length + ')</h3>' + (res.map(function (a) { return stRow(a, true); }).join('') || '<p class="m">لا توجد نتائج.</p>');
    }
    h += '</div><div class="card"><h2>النماذج (' + (D.models || []).length + ') · ' + D.qs.length + ' سؤال</h2><div class="grid">' + (D.models || []).map(function (m) {
      var qs = D.qs.filter(function (a) { return a[1] === m.id; }), mod = qs.some(function (a) { return stMod(a[0]); });
      return '<button class="sec" data-sec="' + m.id + '">' + esc(m.name) + (mod ? ' <span class="b mod">✎</span>' : '') + '<small>' + qs.length + ' سؤال</small></button>';
    }).join('') + '</div></div>';
    return h;
  }
  function viewStSec() {
    var qs = D.qs.filter(function (a) { return a[1] === E.sec; });
    return '<div class="row" style="margin-bottom:10px"><button class="g" data-a="home">→ كل النماذج</button><h2 style="margin:0">' + esc(stModel(E.sec)) + ' (' + qs.length + ' سؤال)</h2></div><div class="card">' + qs.map(function (a) { return stRow(a, false); }).join('') + '</div>';
  }
  function startSt(id) {
    var a = D.qs.filter(function (x) { return x[0] === id; })[0]; if (!a) return toast('السؤال غير موجود', 'err');
    E.sec = a[1]; E.q = { id: id, c: a[2], h: a[3] || '', img: stImg(id), hid: !!SAX[id] }; E.view = 'q'; draw(); host.scrollTop = 0;
  }
  function viewStQ() {
    var q = E.q, h = '<div class="row" style="margin-bottom:10px"><button class="g" data-a="backsec">→ رجوع</button><h2 style="margin:0">تعديل السؤال رقم ' + q.id + '</h2><span class="m">' + esc(stModel(E.sec)) + '</span></div><div class="card">';
    if (q.hid) h += '<div class="note">هذا السؤال مخفي عن الطلاب الآن.</div>';
    h += '<label class="f">صورة السؤال</label><div class="imgbox"><img id="bwe-im" src="' + esc(q.img) + '" alt=""><input type="file" id="bwe-file" accept="image/*" style="display:none"><button class="g" data-a="pick">📷 استبدال الصورة بصورة مصححة</button><div class="m" style="margin-top:6px">صوّر السؤال بعد تصحيحه (أو عدّله في أي برنامج صور) ثم ارفعه هنا، أو الصق الصورة (Ctrl+V). الصورة تُضغط تلقائيًا.</div></div>';
    h += '<label class="f">الإجابة الصحيحة</label><div class="ans">' + L.map(function (l, i) { return '<label class="' + (i === q.c ? 'on' : '') + '"><input type="radio" name="bwe-c" value="' + i + '"' + (i === q.c ? ' checked' : '') + '>' + l + '</label>'; }).join('') + '</div>';
    h += '<label class="f">💡 إرشاد للطالب (سطر واحد يوجّهه دون أن يعطيه الحل)</label><textarea id="bwe-h" style="min-height:60px" maxlength="400">' + esc(q.h) + '</textarea>';
    h += '<div class="row" style="margin-top:14px"><button data-a="stsave">💾 حفظ السؤال</button><button class="g" data-a="backsec">إلغاء</button><span style="flex:1"></span>'
      + (q.hid ? '<button class="o" data-a="stshow">👁 إظهار السؤال للطلاب</button>' : R.delete ? '<button class="r" data-a="sthide">🚫 إخفاء السؤال عن الطلاب</button>' : '') + '</div></div>';
    return h;
  }
  async function saveSt() {
    var q = E.q, a = D.qs.filter(function (x) { return x[0] === q.id; })[0], c = root.querySelector('input[name=bwe-c]:checked'), ops = [];
    q.c = c ? +c.value : q.c; q.h = root.querySelector('#bwe-h').value.replace(/\s+/g, ' ').trim();
    if (q.c !== a[2]) ops.push({ kind: 'ak', key: String(q.id), act: 'edit', data: q.c });
    if (q.h !== (a[3] || '')) ops.push({ kind: 'ah', key: String(q.id), act: 'edit', data: q.h });
    if (q.img !== stImg(q.id)) ops.push({ kind: 'ai', key: String(q.id), act: 'edit', data: q.img });
    if (!ops.length) return toast('لا توجد تغييرات');
    if (!(await save(ops, 'تم حفظ السؤال ✓'))) return;
    a[2] = q.c; a[3] = q.h; if (/^\/api\//.test(q.img)) SAI[q.id] = q.img;
    E.view = 'sec'; draw();
  }

  // ---------- أسئلة نصية (تأسيس) ----------
  var PER = 25;
  function viewRaw() {
    var f = E.f.trim(), list = D.map(function (q, i) { return { q: q, i: i, k: RAWK[i] }; }).filter(function (x) { return !f || x.q.slice(0, 5).some(function (t) { return String(t).indexOf(f) >= 0; }); });
    var pages = Math.max(1, Math.ceil(list.length / PER)); if (E.page >= pages) E.page = pages - 1;
    var h = '<div class="card"><div class="row"><input id="bwe-f" placeholder="🔎 ابحث في الأسئلة والاختيارات…" value="' + esc(E.f) + '" style="flex:1;min-width:200px">' + (R.add ? '<button data-a="addr">＋ سؤال جديد</button>' : '') + '</div><p class="m" style="margin:8px 0 0">' + list.length + ' سؤال · الاختبارات تتكون تلقائيًا من كل ٢٥ سؤالًا بالترتيب.</p></div>';
    h += list.slice(E.page * PER, E.page * PER + PER).map(function (x) {
      var p = patched['r|' + x.k];
      return '<div class="q' + (p ? (inBase('r', x.k) ? ' mod' : ' new') : '') + '"><div class="row"><b>سؤال ' + (x.i + 1) + '</b><span class="m">(اختبار ' + (Math.floor(x.i / 25) + 1) + ')</span>' + badge('r', x.k) + '</div><div style="font-weight:700;margin:4px 0">' + esc(x.q[0]) + '</div><ul class="ops">' + [1, 2, 3, 4].map(function (j) { return '<li class="' + (j - 1 === x.q[5] ? 'ok' : '') + '">' + L[j - 1] + ') ' + esc(x.q[j]) + '</li>'; }).join('') + '</ul><div class="row">'
        + (R.edit ? '<button class="sm" data-a="editr" data-id="' + x.i + '">✏ تعديل</button>' : '') + (R.delete ? '<button class="r sm" data-a="delr" data-id="' + x.i + '">حذف</button>' : '') + (p && (inBase('r', x.k) ? R.edit : R.delete) ? '<button class="g sm" data-a="revert" data-k="r" data-id="' + esc(x.k) + '">↶ رجوع للأصل</button>' : '') + '</div></div>';
    }).join('');
    if (pages > 1) { h += '<div class="pg"><button class="g sm" data-a="pg" data-v="' + (E.page - 1) + '"' + (E.page ? '' : ' disabled') + '>السابق</button><span class="m">صفحة ' + (E.page + 1) + ' من ' + pages + '</span><button class="g sm" data-a="pg" data-v="' + (E.page + 1) + '"' + (E.page < pages - 1 ? '' : ' disabled') + '>التالي</button></div>'; }
    return h;
  }
  function viewRawQ() {
    var q = E.q.a;
    return '<div class="row" style="margin-bottom:10px"><button class="g" data-a="home">→ رجوع</button><h2 style="margin:0">' + (E.q.isNew ? 'سؤال جديد' : 'تعديل السؤال ' + (E.q.i + 1)) + '</h2></div><div class="card"><label class="f">نص السؤال</label><textarea id="bwe-q">' + esc(q[0]) + '</textarea><label class="f">الاختيارات — اختر الدائرة بجانب الإجابة الصحيحة</label>'
      + [1, 2, 3, 4].map(function (j) { return '<div class="opt' + (j - 1 === q[5] ? ' on' : '') + '"><input type="radio" name="bwe-c" value="' + (j - 1) + '"' + (j - 1 === q[5] ? ' checked' : '') + '><b>' + L[j - 1] + '</b><input type="text" data-o="' + j + '" value="' + esc(q[j]) + '"></div>'; }).join('')
      + '<div class="row" style="margin-top:14px"><button data-a="saver">💾 حفظ السؤال</button><button class="g" data-a="home">إلغاء</button></div></div>';
  }
  async function saveRaw() {
    var q = E.q.a; q[0] = root.querySelector('#bwe-q').value.trim(); root.querySelectorAll('[data-o]').forEach(function (i) { q[+i.dataset.o] = i.value.trim(); });
    var c = root.querySelector('input[name=bwe-c]:checked'); q[5] = c ? +c.value : q[5];
    if (!q[0] || q.slice(1, 5).some(function (x) { return !x; })) { toast('اكتب السؤال والاختيارات الأربعة', 'err'); return; }
    var k = E.q.isNew ? 'n' + Date.now().toString(36) : RAWK[E.q.i];
    if (!(await save([{ kind: 'r', key: k, act: E.q.isNew ? 'add' : 'edit', data: q }], 'تم حفظ السؤال ✓'))) return;
    if (E.q.isNew) { D.push(q); RAWK.push(k); E.page = Math.floor((D.length - 1) / PER); } else D[E.q.i] = q;
    E.view = 'home'; draw();
  }

  // ---------- مفتاح الإجابات (الاختبار الورقي) ----------
  function viewKey() {
    var per = 24, n = D.length, h = '<div class="card"><h2>مفتاح الإجابات (' + n + ' سؤالًا)</h2><p class="m" style="margin:0">أسئلة هذا الاختبار صور ممسوحة من الورقة، لذلك يمكن تعديل الإجابة الصحيحة لكل سؤال. الخانات المظللة تختلف عن الأصل.</p></div>';
    for (var s = 0; s * per < n; s++) {
      h += '<div class="card"><h3>القسم ' + (s + 1) + '</h3><div class="kg">';
      for (var i = s * per; i < Math.min(n, s * per + per); i++) h += '<div class="kc' + (D[i] !== KEYS[i] ? ' ch' : '') + '" title="الأصل: ' + esc(KEYS[i] || '') + '"><b>سؤال ' + (i + 1) + '</b><select data-k="' + i + '"' + (R.edit ? '' : ' disabled') + '>' + L.map(function (l) { return '<option' + (l === D[i] ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select></div>';
      h += '</div></div>';
    }
    return h + (R.edit ? '<div class="card row"><button data-a="savekey">💾 حفظ التغييرات</button><span class="m">تُحفظ فقط الأسئلة التي غيّرت إجابتها.</span></div>' : '');
  }
  var KEY0 = null;

  // ---------- بلاغات الطلاب ----------
  var REPS = null, RN = { answer: 'الإجابة الصحيحة خطأ', text: 'خطأ في نص السؤال أو الاختيارات', image: 'الصورة غير واضحة', other: 'مشكلة أخرى' };
  function viewReps() {
    if (!REPS) { api('exam/reports?course=' + encodeURIComponent(C.course)).then(function (r) { REPS = r.reports; draw(); }).catch(function (e) { toast(e.message, 'err'); }); return '<div class="card"><p class="m">جارٍ التحميل…</p></div>'; }
    return '<div class="row" style="margin-bottom:10px"><button class="g" data-a="home">→ رجوع</button><h2 style="margin:0">بلاغات الطلاب على هذا المقرر (' + REPS.length + ')</h2></div><div class="card">' + (REPS.length ? REPS.map(function (r) {
      var lbl = M === 'raw' ? (RAWK.indexOf(r.qkey) >= 0 ? 'سؤال ' + (RAWK.indexOf(r.qkey) + 1) : '') : r.qkey ? 'سؤال رقم ' + r.qkey : 'بدون رقم سؤال';
      var canOpen = r.qkey && ((M === 'static' && D.qs.some(function (q) { return String(q[0]) === r.qkey; })) || (M === 'bank' && D.qs.some(function (q) { return String(q[0]) === r.qkey; })) || (M === 'raw' && RAWK.indexOf(r.qkey) >= 0));
      return '<div class="q"><div class="row"><span class="b mod">' + esc(RN[r.reason] || r.reason) + '</span><b>' + esc(lbl) + '</b><span class="m">' + esc(r.student || 'زائر') + ' · ' + ago(r.created_at) + '</span></div>' + (r.note ? '<p style="margin:6px 0">' + esc(r.note) + '</p>' : '') + '<div class="row">' + (canOpen && R.edit ? '<button class="sm" data-a="repopen" data-id="' + esc(r.qkey) + '">✏ افتح السؤال</button>' : '') + '<button class="o sm" data-a="repclose" data-id="' + r.id + '">✓ تمت المراجعة</button></div></div>';
    }).join('') : '<p class="m">لا توجد بلاغات مفتوحة. 👍</p>') + '</div>';
  }

  // ---------- سجل التعديلات ----------
  var HIST = null;
  function viewHist() {
    if (!HIST) { api('exam/history?course=' + encodeURIComponent(C.course)).then(function (r) { HIST = r.history; draw(); }).catch(function (e) { toast(e.message, 'err'); }); return '<div class="card"><p class="m">جارٍ التحميل…</p></div>'; }
    return '<div class="row" style="margin-bottom:10px"><button class="g" data-a="home">→ رجوع</button><h2 style="margin:0">سجل التعديلات على هذا المقرر</h2></div><div class="card">' + (HIST.length ? HIST.map(function (r) {
      var added = !inBase(r.kind, r.key), canRev = ['q', 's', 'r', 'qq', 'qh', 'k', 'p', 'o', 'ak', 'ah', 'ai', 'ax'].indexOf(r.kind) >= 0 && (added ? R.delete : R.edit);
      return '<div class="row" style="padding:8px 0;border-bottom:1px solid #eef3f8"><span class="b ' + (r.deleted ? 'mod' : added ? 'new' : 't') + '">' + (r.deleted ? 'حذف' : added ? 'إضافة' : 'تعديل') + '</span><b>' + (KN[r.kind] || r.kind) + ' ' + esc(r.kind === 'r' && /^\d+$/.test(r.key) ? +r.key + 1 : r.key) + '</b><span class="m">· ' + esc(r.updated_by || '') + ' · ' + ago(r.updated_at) + '</span><span style="flex:1"></span>' + (canRev ? '<button class="g sm" data-a="revert" data-k="' + esc(r.kind) + '" data-id="' + esc(r.key) + '">↶ رجوع للأصل</button>' : '') + '</div>';
    }).join('') : '<p class="m">لا توجد تعديلات على هذا المقرر بعد.</p>') + '</div>';
  }
  async function revert(kind, key) {
    if (!ask('إلغاء التعديل والرجوع للنسخة الأصلية من الملف؟' + (inBase(kind, key) ? '' : '\n(هذا العنصر مضاف، لذلك سيُحذف)'))) return;
    try { await api('exam/revert', { course: C.course, kind: kind, key: key }); E.changed = true; toast('تم — سيتم تحديث الصفحة', 'ok'); setTimeout(reload, 700); } catch (e) { toast(e.message, 'err'); }
  }

  // ---------- الأحداث ----------
  async function onClick(e) {
    var t = e.target.closest('[data-a],[data-sec]'); if (!t || t.disabled) return;
    if (t.dataset.sec) { E.sec = +t.dataset.sec; E.view = 'sec'; draw(); host.scrollTop = 0; return; }
    var a = t.dataset.a, id = t.dataset.id;
    if (a === 'close') return close();
    if (a === 'reload') return reload();
    if (a === 'hist') { HIST = null; E.view = 'hist'; return draw(); }
    if (a === 'reps') { REPS = null; E.view = 'reps'; return draw(); }
    if (a === 'repclose') { try { await api('exam/report-close', { id: +id }); REPS = REPS.filter(function (r) { return r.id !== +id; }); toast('تم إغلاق البلاغ', 'ok'); draw(); } catch (err) { toast(err.message, 'err'); } return; }
    if (a === 'repopen') { if (M === 'static') return startSt(+id); if (M === 'bank') { var rq = D.qs.filter(function (q) { return String(q[0]) === id; })[0]; E.sec = rq[1]; return startQ(rq[0]); } if (M === 'raw') { var ri = RAWK.indexOf(id); E.q = { a: clone(D[ri]), isNew: false, i: ri }; E.view = 'q'; return draw(); } return; }
    if (a === 'home') { E.view = 'home'; return draw(); }
    if (a === 'tab') { E.tab = t.dataset.v; return draw(); }
    if (a === 'backsec') { E.view = E.sec ? 'sec' : 'home'; return draw(); }
    if (a === 'revert') return revert(t.dataset.k, id);
    if (a === 'pg') { E.page = +t.dataset.v; draw(); host.scrollTop = 0; return; }
    if (M === 'bank') {
      if (a === 'editq') { var x = D.qs.filter(function (q) { return q[0] === +id; })[0]; if (x) E.sec = x[1]; return startQ(+id); }
      if (a === 'dupq') { var y = D.qs.filter(function (q) { return q[0] === +id; })[0]; if (y) E.sec = y[1]; return startQ(+id, false, true); }
      if (a === 'addq') return startQ(null, true);
      if (a === 'saveq') return saveQ();
      if (a === 'pick') return root.querySelector('#bwe-file').click();
      if (a === 'delq') { if (!ask('حذف السؤال رقم ' + id + '؟ (يمكن استرجاعه من سجل التعديلات)')) return; if (await save([{ kind: 'q', key: id, act: 'delete', data: null }], 'تم حذف السؤال')) { D.qs = D.qs.filter(function (q) { return q[0] !== +id; }); draw(); } return; }
      if (a === 'up' || a === 'dn') {
        var qs = secQs(E.sec), k = qs.findIndex(function (q) { return q[0] === +id; }), o = qs[a === 'up' ? k - 1 : k + 1]; if (!o) return;
        var i1 = D.qs.indexOf(qs[k]), i2 = D.qs.indexOf(o), tmp = D.qs[i1]; D.qs[i1] = D.qs[i2]; D.qs[i2] = tmp;
        if (!(await save([{ kind: 'o', key: String(E.sec), act: 'edit', data: secQs(E.sec).map(function (q) { return q[0]; }) }], 'تم تغيير الترتيب'))) { D.qs[i2] = D.qs[i1]; D.qs[i1] = tmp; }
        return draw();
      }
      if (a === 'savesec') { var nm = root.querySelector('#bwe-sn').value.trim(); if (!nm) return toast('اكتب اسم القسم', 'err'); if (await save([{ kind: 's', key: String(E.sec), act: 'edit', data: { name: nm } }], 'تم حفظ اسم القسم')) { D.secs.filter(function (s) { return s.id === E.sec; })[0].name = nm; draw(); } return; }
      if (a === 'addsec') { var nm2 = prompt('اسم القسم الجديد'); if (!nm2 || !nm2.trim()) return; var nid = 0; D.secs.concat((B.s || []).map(function (i) { return { id: i }; })).forEach(function (s) { if (s.id > nid) nid = s.id; }); Object.keys(patched).forEach(function (k) { if (k.indexOf('s|') === 0 && +k.slice(2) > nid) nid = +k.slice(2); }); nid++; if (await save([{ kind: 's', key: String(nid), act: 'add', data: { name: nm2.trim() } }], 'تمت إضافة القسم ' + nid)) { D.secs.push({ id: nid, name: nm2.trim() }); E.sec = nid; E.view = 'sec'; draw(); } return; }
      if (a === 'delsec') { var list = secQs(E.sec); if (!ask('حذف القسم ' + E.sec + (list.length ? ' و' + list.length + ' سؤال بداخله' : '') + '؟')) return; var ops = list.map(function (q) { return { kind: 'q', key: String(q[0]), act: 'delete', data: null }; }); ops.push({ kind: 's', key: String(E.sec), act: 'delete', data: null }); if (await save(ops, 'تم حذف القسم')) { D.qs = D.qs.filter(function (q) { return q[1] !== E.sec; }); D.secs = D.secs.filter(function (s) { return s.id !== E.sec; }); E.view = 'home'; draw(); } return; }
      if (a === 'saveqq') {
        var box = root.querySelector('[data-qq="' + id + '"]'), qa = D.qq.filter(function (q) { return q[0] === +id; })[0], c = box.querySelector('input[type=radio]:checked'), hv = box.querySelector('[data-qh]').value.trim(), ops2 = [];
        if (c && +c.value !== qa[2]) ops2.push({ kind: 'qq', key: id, act: 'edit', data: [qa[0], qa[1], +c.value] });
        if (hv !== ((D.qh || {})[id] || '')) ops2.push({ kind: 'qh', key: id, act: 'edit', data: hv });
        if (!ops2.length) return toast('لا توجد تغييرات');
        if (await save(ops2)) { if (c) qa[2] = +c.value; D.qh = D.qh || {}; if (hv) D.qh[id] = hv; else delete D.qh[id]; draw(); } return;
      }
      if (a === 'revertqq') { try { if (patched['qq|' + id]) await api('exam/revert', { course: C.course, kind: 'qq', key: id }); if (patched['qh|' + id]) await api('exam/revert', { course: C.course, kind: 'qh', key: id }); E.changed = true; toast('تم — سيتم تحديث الصفحة', 'ok'); setTimeout(reload, 700); } catch (err) { toast(err.message, 'err'); } return; }
    }
    if (M === 'static') {
      if (a === 'stedit') return startSt(+id);
      if (a === 'stsave') return saveSt();
      if (a === 'pick') return root.querySelector('#bwe-file').click();
      if (a === 'strev') { if (!ask('إلغاء كل تعديلات السؤال رقم ' + id + ' والرجوع للأصل (الإجابة والإرشاد والصورة والإخفاء)؟')) return; try { for (var kk of ['ak', 'ah', 'ai', 'ax']) if (patched[kk + '|' + id] === 1) await api('exam/revert', { course: C.course, kind: kk, key: id }); E.changed = true; toast('تم — سيتم تحديث الصفحة', 'ok'); setTimeout(reload, 700); } catch (err) { toast(err.message, 'err'); } return; }
      if (a === 'sthide') { if (!ask('إخفاء السؤال رقم ' + E.q.id + ' عن الطلاب؟ يمكنك إظهاره مرة أخرى في أي وقت.')) return; if (await save([{ kind: 'ax', key: String(E.q.id), act: 'edit', data: 1 }], 'تم إخفاء السؤال')) { SAX[E.q.id] = 1; E.view = 'sec'; draw(); } return; }
      if (a === 'stshow') { try { await api('exam/revert', { course: C.course, kind: 'ax', key: String(E.q.id) }); delete SAX[E.q.id]; patched['ax|' + E.q.id] = 0; E.changed = true; toast('أصبح السؤال ظاهرًا للطلاب', 'ok'); E.view = 'sec'; draw(); } catch (err) { toast(err.message, 'err'); } return; }
    }
    if (M === 'raw') {
      if (a === 'addr') { E.q = { a: ['', '', '', '', '', 0], isNew: true }; E.view = 'q'; return draw(); }
      if (a === 'editr') { E.q = { a: clone(D[+id]), isNew: false, i: +id }; E.view = 'q'; draw(); host.scrollTop = 0; return; }
      if (a === 'saver') return saveRaw();
      if (a === 'delr') { if (!ask('حذف السؤال ' + (+id + 1) + '؟')) return; if (await save([{ kind: 'r', key: RAWK[+id], act: 'delete', data: null }], 'تم حذف السؤال')) { D.splice(+id, 1); RAWK.splice(+id, 1); draw(); } return; }
    }
    if (M === 'key' && a === 'savekey') {
      var cur = Array.from(g('KEY') || ''), ops3 = [];
      D.forEach(function (l, i) { if (l !== cur[i]) ops3.push({ kind: 'k', key: String(i + 1), act: 'edit', data: l }); });
      if (!ops3.length) return toast('لا توجد تغييرات');
      if (await save(ops3, 'تم حفظ ' + ops3.length + ' إجابة ✓')) setTimeout(reload, 800);
      return;
    }
  }
  function onChange(e) {
    var t = e.target;
    if (t.id === 'bwe-file') { upload(t.files[0]); t.value = ''; return; }
    if (t.id === 'bwe-qqs') { E.qqSec = +t.value; return draw(); }
    if (t.dataset && t.dataset.k !== undefined && M === 'key') { D[+t.dataset.k] = t.value; t.parentNode.classList.toggle('ch', t.value !== KEYS[+t.dataset.k]); return; }
    if (E.view === 'q' && M === 'static' && t.name === 'bwe-c') { root.querySelectorAll('.ans label').forEach(function (l) { l.classList.toggle('on', l.querySelector('input').checked); }); return; }
    if (E.view === 'q' && M === 'bank') {
      if (t.id === 'bwe-pm' || t.id === 'bwe-s') { syncQ(); if (t.id === 'bwe-pm') E.q.ptext = E.q.pmode === 'new' ? '' : E.q.pmode === 'none' ? '' : D.ps[+E.q.pmode]; draw(); return; }
      if (t.name === 'bwe-c') { syncQ(); root.querySelectorAll('.ans label,.opt').forEach(function (l) { var r = l.querySelector('input[name=bwe-c]'); if (r) l.classList.toggle('on', r.checked); }); prevQ(); }
    }
    if (t.name && /^qq\d+$/.test(t.name)) root.querySelectorAll('input[name=' + t.name + ']').forEach(function (r) { r.parentNode.classList.toggle('on', r.checked); });
    if (M === 'raw' && t.name === 'bwe-c') root.querySelectorAll('.opt').forEach(function (l) { l.classList.toggle('on', l.querySelector('input[name=bwe-c]').checked); });
  }
  function onInput(e) {
    if (e.target.id === 'bwe-f') { E.f = e.target.value; E.page = 0; var pos = e.target.selectionStart; draw(); var n = root.querySelector('#bwe-f'); n.focus(); n.setSelectionRange(pos, pos); }
  }
  document.addEventListener('paste', function (e) {
    if (!root || host.style.display === 'none' || E.view !== 'q' || !(C.img || M === 'static')) return;
    var it = [].slice.call((e.clipboardData || {}).items || []).filter(function (i) { return /^image\//.test(i.type); })[0];
    if (it) { e.preventDefault(); upload(it.getAsFile()); }
  });
  addEventListener('beforeunload', function (e) { if (root && host.style.display !== 'none' && E.view === 'q') { e.preventDefault(); e.returnValue = ''; } });
  if (/[?&](edit|admin)\b/.test(location.search)) {
    var u = new URL(location.href), oq = u.searchParams.get('q'); u.searchParams.delete('edit'); u.searchParams.delete('admin'); u.searchParams.delete('q'); history.replaceState(null, '', u.toString());
    // ?edit=1&q=رقم يفتح السؤال مباشرة (من تقارير المقرر: «الأسئلة الأكثر خطأ»)
    setTimeout(function () { open(); if (oq && D && M === 'static' && R.edit) startSt(+oq); if (oq && D && M === 'bank' && R.edit) { var rq = D.qs.filter(function (q) { return String(q[0]) === oq; })[0]; if (rq) { E.sec = rq[1]; startQ(rq[0]); } } }, 0);
  }
})();
