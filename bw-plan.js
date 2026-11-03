// «خطتي»: رحلة الطالب كلها في مكان واحد.
// البداية: الاختبار ← تحديد المستوى ← الأهداف لكل قسم ← قدرته اليومية وموعده (أو نقترح له موعدًا).
// كل يوم: مهام اليوم بعلامات ✓ تلقائية من نتائجه، وتعديل سريع، وإيقاف مؤقت، وقياس تقدم اختياري،
// وأيام محاكي ومراجعة اختيارية قبل الاختبار. الخطة تُحفظ في حساب الطالب (وعلى جهاز الزائر فقط).
(function () {
  'use strict';
  var app = document.getElementById('app'); if (!app) return;
  var KEY = 'bw-plan-v2', FLOW = 'bw-plan-flow', DAY = 864e5;
  var AR = function (n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function get(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function sget(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function sput(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function dk(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function parse(s) { var d = s ? new Date(s + 'T00:00:00') : null; return d && Number.isFinite(d.getTime()) ? d : null; }
  function today() { var t = new Date(); t.setHours(0, 0, 0, 0); return t; }
  function addDays(k, n) { var d = parse(k); d.setDate(d.getDate() + n); return dk(d); }
  function nice(k, wd) { var d = parse(k); return d ? d.toLocaleDateString('ar-SA', wd ? { weekday: 'long', day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long' }) : ''; }
  function days(n) { return n === 1 ? 'يوم' : n === 2 ? 'يومين' : AR(n) + (n <= 10 ? ' أيام' : ' يومًا'); }
  function qs(n) { return AR(n) + (n === 1 ? ' سؤال' : n <= 10 && n > 2 ? ' أسئلة' : ' سؤالًا'); }
  var WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var GOALN = { tasis: 'تأسيس', tajm: 'تجميعات', all: 'شاملة', none: '' }, SUBN = { q: 'الكمي', v: 'اللفظي' };
  var CAPS = [30, 50, 80, 120];
  var MOCK = { computer: '/muhaky%20mohawsab.html.html', paper: '/waraqi.html' };
  var ERRK = [['quant-quiz-errors-v1', '/aksam%20kamy.html#errors', 'q', 'أقسام الكمي'], ['bwa-errors-v1', '/ak_kamyadd.html#errors', 'q', 'الكمي الإضافي'], ['verbal-quiz-errors-v1', '/aksam%20lafzi.html#errors', 'v', 'أقسام اللفظي']];
  var CAT = null, ERR = '', PLAN = null, W = null, EDIT = null, OPEN = {};
  try { sessionStorage.removeItem('bw-plan-return'); } catch (e) { }

  // ===== الخطة المحفوظة (الخطة القديمة تُرحَّل كما هي: موعدها ومحتواها وعلامات «تم») =====
  function norm(p) {
    if (!p.goals) { var g = p.goal || 'tajm', s = p.subj || ['q', 'v']; p.goals = { q: s.indexOf('q') >= 0 ? g : 'none', v: s.indexOf('v') >= 0 ? g : 'none' }; }
    if (p.booked == null) p.booked = true;
    if (p.review == null) p.review = 0;
    p.pauses = p.pauses || []; p.excl = p.excl || {}; p.done = p.done || {}; p.off = p.off || [];
    return p;
  }
  function loadPlan() {
    var p = get(KEY, null); if (p && p.v === 2 && Array.isArray(p.srcs)) return norm(p);
    var g = get('bw-goal-v1', {}) || {}, o = get('bw-study-plan-v1', null);
    if (g.exam && parse(g.exam)) return norm({ v: 2, track: 'computer', trackTitle: 'القدرات المحوسب', goal: 'tajm', subj: ['q', 'v'], mode: 'all', srcs: ['kamy', 'kamy2', 'lafzi'], excl: {}, exam: g.exam, booked: true, review: 0, start: (o && o.start) || dk(today()), off: [], done: (o && o.done && typeof o.done === 'object') ? o.done : {}, migrated: 1 });
    return null;
  }
  function savePlan(p) { PLAN = p; put(KEY, p); if (p && p.exam) { var g = get('bw-goal-v1', {}) || {}; if (g.exam !== p.exam) { g.exam = p.exam; put('bw-goal-v1', g); } } }
  function lastPlace() { return (get('bw-place-v1', []) || []).slice(-1)[0] || null; }
  function trackOf(id) { return (CAT.allTracks || CAT.tracks).filter(function (t) { return t.id === id; })[0] || null; }

  // ===== التقدم في كل وحدة (من مفاتيح صفحات الاختبارات نفسها، وهي محفوظة في حساب الطالب) =====
  var MEMO = {};
  function memo(k, d) { if (!(k in MEMO)) MEMO[k] = get(k, d); return MEMO[k]; }
  function status(S, u) {
    var x = { done: false, part: false, info: '' };
    if (S.kind === 'bank') {
      var st = memo(S.stats, null), a = st && st.s ? (st.s[u.id] || st.s[+u.id]) : null, t = a ? +a.t || 0 : 0, c = a ? +a.c || 0 : 0;
      x.done = t >= Math.max(1, u.q); x.part = t > 0 && !x.done; x.info = x.done ? 'دقتك ' + AR(Math.round(c * 100 / Math.max(1, t))) + '٪' : x.part ? 'أنجزت ' + AR(Math.min(99, Math.round(t * 100 / Math.max(1, u.q)))) + '٪' : '';
    } else if (S.kind === 'raw') {
      var b = memo(S.best, {}) || {}, v = b[u.id]; if (v == null) v = b[+u.id];
      x.done = v != null; x.info = x.done ? 'أفضل نتيجة ' + AR(Math.round(+v || 0)) + '٪' : '';
    } else if (S.kind === 'pool') {
      var sn = memo(S.seen, null), n = sn && sn.ids ? ((sn.round || 1) > 1 ? (S.total || 0) : sn.ids.length) : 0, from = u.upto - u.q;
      x.done = n >= u.upto; x.part = !x.done && n > from; x.info = x.part ? 'أنجزت ' + AR(Math.round((n - from) * 100 / u.q)) + '٪' : '';
    } else if (S.kind === 'models') {
      var r = (memo(S.res, {}) || {})[u.id]; x.done = !!r; x.info = r ? 'أفضل نتيجة ' + AR(r.best) + '٪' : '';
    } else if (S.kind === 'mock') {
      var f = null; try { f = localStorage.getItem(S.done); } catch (e) { }
      x.done = f != null;
    }
    return x;
  }
  function back() { try { sessionStorage.setItem('bw-plan-return', JSON.stringify({ u: '/progress.html', t: Date.now() })); } catch (e) { } }
  function go(srcId, unitId) {
    var S = CAT && CAT.sources[srcId]; if (!S) return; back();
    if (S.kind === 'bank' && S.sel) { try { localStorage.setItem(S.sel, JSON.stringify([+unitId])); } catch (e) { } }
    location.href = S.page + (S.kind === 'models' ? '#model=' + encodeURIComponent(unitId) : '');
  }

  // ===== المحتوى والجدول =====
  // مصادر الخطة من أهداف كل قسم: تأسيس / تجميعات / شاملة (تأسيس ثم تجميعات) / بدونه
  function srcsFor(t, goals) {
    if (!t) return [];
    var out = [], add = function (id) { if (out.indexOf(id) < 0 && CAT.sources[id]) out.push(id); };
    var want = function (g) { return g === 'tasis' ? t.tasis : g === 'tajm' ? t.tajm : g === 'all' ? t.tasis.concat(t.tajm) : []; };
    ['q', 'v'].forEach(function (s) { want(goals[s]).forEach(function (id) { var S = CAT.sources[id]; if (S && S.subj === s) add(id); }); });
    var anyT = ['q', 'v'].some(function (s) { return goals[s] === 'tajm' || goals[s] === 'all'; });
    if (anyT) t.tajm.forEach(function (id) { var S = CAT.sources[id]; if (S && S.subj === 'm') add(id); });
    // ترتيب ثابت: التأسيس قبل التجميعات، وبترتيب الإدارة (أولوية التجميعات)
    var order = t.tasis.concat(t.tajm); out.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    return out;
  }
  function unitsOf(srcs, excl) {
    var out = [];
    (srcs || []).forEach(function (id) {
      var S = CAT.sources[id]; if (!S || !S.units) return; var ex = (excl && excl[id]) || [];
      S.units.forEach(function (u) { if (ex.indexOf(u.id) < 0) out.push({ key: id + ':' + u.id, src: S, u: u, w: Math.max(1, +u.q || 1) }); });
    });
    return out;
  }
  function paused(k, pauses) { return (pauses || []).some(function (p) { return k >= p.from && k <= p.to; }); }
  function dayList(fromKey, toKey, off, pauses) {
    var out = [], d = parse(fromKey), e = parse(toKey); if (!d || !e) return out;
    for (; d < e && out.length < 500; d.setDate(d.getDate() + 1)) { var k = dk(d); if ((off || []).indexOf(d.getDay()) < 0 && !paused(k, pauses)) out.push(k); }
    return out;
  }
  // موعد مقترح: أيام تكفي المحتوى بقدرة الطالب اليومية، ثم أيام المحاكي والمراجعة، ثم يوم الاختبار
  function suggestExam(fromKey, q, cap, off, pauses, review) {
    var need = Math.max(1, Math.ceil(q / Math.max(10, cap || 50))) + (review || 0), d = parse(fromKey), n = 0, guard = 0;
    while (n < need && guard++ < 800) { var k = dk(d); if ((off || []).indexOf(d.getDay()) < 0 && !paused(k, pauses)) n++; d.setDate(d.getDate() + 1); }
    return dk(d);
  }
  function schedule(p) {
    var all = unitsOf(p.srcs, p.excl), skip = p.rebase ? p.rebase.skip || [] : [];
    var from = p.rebase ? p.rebase.date : p.start, list = dayList(from, p.exam, p.off, p.pauses);
    var rv = p.review && list.length > p.review + 2 ? list.slice(-p.review) : [], study = rv.length ? list.slice(0, -rv.length) : list;
    var units = all.filter(function (x) { return skip.indexOf(x.key) < 0; }), extra = [];
    if (p.mode === 'prio' && study.length) {
      var cap = (p.cap || CAT.dailyMax || 120) * study.length, cum = 0, keep = [];
      units.forEach(function (x) { if (cum < cap) { keep.push(x); cum += x.w; } else extra.push(x); });
      units = keep;
    }
    var plan = study.map(function (d) { return { date: d, items: [], q: 0 }; });
    // كل قسم (كمي/لفظي/اختبار كامل) يتوزع وحده على الأيام، فيجد الطالب الكمي واللفظي معًا كل يوم
    if (plan.length) ['q', 'v', 'm'].forEach(function (sj) {
      var L = units.filter(function (x) { return x.src.subj === sj; }), total = L.reduce(function (t, x) { return t + x.w; }, 0), cum2 = 0;
      L.forEach(function (x) { var i = Math.min(plan.length - 1, Math.floor((cum2 + x.w / 2) * plan.length / Math.max(1, total))); cum2 += x.w; plan[i].items.push(x); plan[i].q += x.u.q; });
    });
    return { all: all, days: plan, review: rv, extra: extra, skipped: skip.length };
  }
  function errorsDue(goals) {
    var now = Date.now(), out = [];
    ERRK.forEach(function (e) {
      if (!goals || !goals[e[2]] || goals[e[2]] === 'none') return;
      var E = get(e[0], {}) || {}, n = 0;
      Object.keys(E).forEach(function (k) { var x = E[k]; if (x && x.date && now - new Date(x.date).getTime() >= [1, 3, 7][x.ok || 0] * DAY) n++; });
      if (n) out.push({ n: n, url: e[1], name: e[3] });
    });
    return out;
  }
  // كم سؤالًا يحل الطالب فعلًا في اليوم (آخر ٧ أيام)، من سجلات صفحات الاختبارات
  function actualDaily() {
    var since = Date.now() - 7 * DAY, n = 0;
    ['bw-stats-v1', 'bwa-stats-v1', 'bwv-stats-v1', 'bw-stats-v2'].forEach(function (k) { var S = get(k, null); ((S && S.h) || []).forEach(function (x) { if (x && x.d && new Date(x.d).getTime() >= since) n += +x.n || 0; }); });
    ['bwmt-hist', 'warky1447.hist'].forEach(function (k) { (get(k, []) || []).forEach(function (x) { if (x && x.d && new Date(x.d).getTime() >= since) n += +x.n || 0; }); });
    return Math.round(n / 7);
  }

  // ===== الواجهة =====
  function load() {
    ERR = ''; draw();
    fetch('/api/plan/catalog', { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) {
        if (!d || !d.sources) throw 0; CAT = d; PLAN = loadPlan(); if (PLAN && PLAN.migrated && !get(KEY, null)) savePlan(PLAN);
        var f = sget(FLOW);
        if (f && f.W) { W = f.W; var lp = lastPlace(); if (W.step === 2 && lp && (!f.at || new Date(lp.d).getTime() > f.at)) { W.goals = null; W.step = 3; W.goals = recGoals(); } }
        if (f) sput(FLOW, null);
        draw();
      })
      .catch(function () { ERR = 'تعذّر تحميل بيانات الخطة. تحقق من الاتصال ثم أعد المحاولة.'; draw(); });
  }
  function draw() {
    MEMO = {};
    var h = '<div class="study-plan-page"><h1>خطتي</h1>';
    if (ERR) h += '<div class="card"><p class="m">' + esc(ERR) + '</p><button class="btn btn-soft" data-p="retry" type="button">إعادة المحاولة</button></div>';
    else if (!CAT) h += '<div class="card"><p class="m">جارٍ تجهيز خطتك…</p></div>';
    else if (W) h += wizard();
    else if (PLAN) h += view();
    else { startWizard(); h += wizard(); }
    app.innerHTML = h + '</div>';
    [].forEach.call(app.querySelectorAll('[data-mixed]'), function (c) { c.indeterminate = true; });
  }

  // ---------- عرض الخطة ----------
  function view() {
    var p = PLAN, sc = schedule(p), tk = dk(today()), h = '', t = trackOf(p.track);
    var stOf = {}; sc.all.forEach(function (x) { stOf[x.key] = status(x.src, x.u); });
    var tot = sc.all.length, fin = sc.all.filter(function (x) { return stOf[x.key].done; }).length, pct = tot ? Math.round(fin * 100 / tot) : 0;
    var left = p.exam ? Math.round((parse(p.exam) - today()) / DAY) : 0;
    var gl = ['q', 'v'].filter(function (s) { return p.goals[s] && p.goals[s] !== 'none'; }).map(function (s) { return SUBN[s] + ': ' + GOALN[p.goals[s]]; }).join(' · ');
    var late = [], todayItems = [], next = null, isStudy = false;
    sc.days.forEach(function (d) { if (d.date === tk) isStudy = true; d.items.forEach(function (x) { if (d.date === tk) todayItems.push(x); else if (d.date < tk && !stOf[x.key].done) late.push(x); }); if (!next && d.date > tk && d.items.length) next = d; });
    var isReview = sc.review.indexOf(tk) >= 0, onTrack = !late.length;
    var pz = (p.pauses || []).filter(function (z) { return tk >= z.from && tk <= z.to; })[0];
    h += '<section class="card pv-head"><div class="pv-top"><div><small class="pv-k">' + esc(p.trackTitle || (t && t.title) || '') + '</small><h2>' + esc(gl || 'خطتك') + '</h2><p class="m">'
      + (left > 0 ? (p.booked ? 'اختبارك ' : 'الموعد المقترح لاختبارك ') + '<b>' + esc(nice(p.exam, true)) + '</b>، باقي <b>' + days(left) + '</b>' : left === 0 ? 'اختبارك اليوم، بالتوفيق!' : 'موعد اختبارك مضى. عدّل الموعد أو ابدأ خطة جديدة.')
      + (left > 0 && !pz ? ' · <span class="' + (onTrack ? 'pv-on">على المسار ✓' : 'pv-off">متأخر') + '</span>' : '') + '</p></div><div class="pv-acts"><button class="btn btn-soft" data-p="edit" type="button">✎ تعديل</button><button class="btn btn-soft" data-p="change" type="button">خطة جديدة</button></div></div>'
      + '<div class="pv-prog"><b>أنجزت ' + AR(fin) + ' من ' + AR(tot) + ' (' + AR(pct) + '٪)</b><div class="gbar"><i style="width:' + pct + '%"></i></div></div></section>';
    if (EDIT) h += editPanel();
    if (left <= 0) return h;
    if (pz) h += '<div class="pv-late pv-pause"><span>⏸ خطتك متوقفة حتى ' + esc(nice(pz.to, true)) + '. الأيام دي مش هتتحسب عليك تأخير.</span><button class="btn btn-navy" data-p="resume" type="button">استأنف الآن</button></div>';
    else if (late.length) h += '<div class="pv-late"><span>⚠ متأخر ' + AR(late.length) + ' ' + (late.length === 1 ? 'وحدة' : late.length <= 10 ? 'وحدات' : 'وحدة') + ' عن خطتك. ولا يهمك، وزّع الباقي على الأيام المتبقية.</span><button class="btn btn-navy" data-p="rebase" type="button">وزّع الباقي من اليوم</button></div>';
    h += suggestions(p, sc, stOf);
    // مهام اليوم
    var todayLeft = todayItems.filter(function (x) { return !stOf[x.key].done; }), list = late.concat(todayLeft), first = list[0] || (next && next.items.filter(function (x) { return !stOf[x.key].done; })[0]);
    h += '<section class="card"><div class="pv-th"><h3>📌 مهام اليوم</h3>' + (first && !pz && !isReview ? '<button class="btn btn-gold" type="button" data-go="' + esc(first.src.id) + '|' + esc(first.u.id) + '">▶ ابدأ ' + (list.length ? 'مهمة اليوم' : 'المهمة التالية') + '</button>' : '') + '</div>';
    if (pz) h += '<p class="m">استرح كويس، وهنكمّل لما ترجع. لو حابب تذاكر خفيف، مهامك التالية في الجدول بالأسفل.</p>';
    else if (isReview) {
      var mock = MOCK[p.track] || '/#tests';
      h += '<p class="m">أيام المحاكي والمراجعة قبل اختبارك. اختياري، لكنه أكثر ما يرفع الدرجة:</p><ul class="pv-list"><li><span class="st st-new">○</span><span class="pv-n"><b>اختبار محاكي كامل بالمؤقت</b><small>مثل يوم الاختبار بالضبط</small></span><a class="btn btn-navy sm" href="' + mock + '" data-back="1">ابدأ</a></li></ul>' + errRows(p) + (list.length ? '<p class="m" style="margin-top:12px">ولو حابب تكمّل اللي فاتك من الخطة:</p>' + lateRows(list, stOf) : '');
    } else if (!isStudy && !late.length) h += '<p class="m">اليوم إجازة في خطتك. ' + (next ? 'لو حابب تسبق، هذه مهام ' + esc(WD[parse(next.date).getDay()]) + ':' : '') + '</p>' + (next ? rows(next.items, stOf) : '') + errRows(p);
    else if (!list.length) h += '<p class="m pv-ok">🎉 أنهيت مهام اليوم. ' + (next ? 'تقدر تسبق بمهام ' + esc(WD[parse(next.date).getDay()]) + ':' : '') + '</p>' + (next ? rows(next.items, stOf) : '') + errRows(p) + (todayItems.length ? '<details class="pv-more" style="margin-top:10px"><summary>ما أنجزته اليوم (' + AR(todayItems.length) + ')</summary>' + rows(todayItems, stOf) + '</details>' : '');
    else h += '<p class="m">أنجزت ' + AR(todayItems.length - todayLeft.length) + ' من ' + AR(todayItems.length) + ' من مهام اليوم' + (late.length ? '، ومعها ' + AR(late.length) + ' متأخرة' : '') + '.</p>' + lateRows(late, stOf) + rows(todayItems, stOf) + errRows(p);
    h += '</section>';
    if (sc.extra.length) h += '<details class="card pv-more"><summary>لو خلّصت بدري: ' + AR(sc.extra.length) + ' وحدة إضافية حسب الأولوية</summary>' + rows(sc.extra, stOf) + '</details>';
    // الجدول كامل
    h += '<details class="card pv-more"' + (OPEN.full ? ' open' : '') + ' data-open="full"><summary>عرض الجدول كاملًا (' + days(sc.days.length) + ' دراسة' + (sc.review.length ? ' + ' + days(sc.review.length) + ' محاكي ومراجعة' : '') + ')</summary><div class="pv-days">';
    sc.days.forEach(function (d) {
      var dn = d.items.filter(function (x) { return stOf[x.key].done; }).length, auto = d.items.length && dn === d.items.length, man = !!(p.done || {})[d.date];
      h += '<div class="pv-day' + (auto || man ? ' done' : '') + (d.date === tk ? ' is-today' : '') + '"><div class="pv-dh"><b>' + (d.date === tk ? '<span class="today-tag">اليوم</span>' : '') + esc(nice(d.date, true)) + '</b><span class="m">' + (d.items.length ? qs(d.q) + ' · ' + (auto ? '✓ مكتمل تلقائيًا' : 'أنجزت ' + AR(dn) + ' من ' + AR(d.items.length)) : 'مراجعة أو راحة') + '</span><label class="study-check"><input type="checkbox" data-done="' + esc(d.date) + '"' + (man ? ' checked' : '') + '> تم</label></div>' + (d.items.length ? rows(d.items, stOf) : '') + '</div>';
    });
    if (sc.review.length) h += '<div class="pv-day pv-rv"><div class="pv-dh"><b>' + esc(nice(sc.review[0])) + ' – ' + esc(nice(sc.review[sc.review.length - 1])) + '</b><span class="m">محاكي كامل ومراجعة أخطاء (اختياري)</span></div></div>';
    h += '</div></details>';
    if (sc.skipped) h += '<p class="m">' + AR(sc.skipped) + ' وحدة أنجزتها قبل آخر توزيع للخطة، ومحسوبة في نسبة الإنجاز.</p>';
    h += '<p class="m study-foot">' + (window.__bwSid ? 'علامات ✓ تتحدث تلقائيًا من نتائجك المحفوظة في حسابك، على أي جهاز تدخل منه.' : 'خطتك محفوظة على هذا الجهاز فقط. <a href="/account.html?tab=signup">أنشئ حسابك مجانًا</a> لتُحفظ في حسابك وتجدها على أي جهاز.') + '</p>';
    return h;
  }
  function rows(items, stOf, late) {
    if (!items.length) return '';
    return '<ul class="pv-list">' + items.map(function (x) {
      var s = stOf[x.key] || status(x.src, x.u), cls = s.done ? 'st-done' : s.part ? 'st-part' : 'st-new', ic = s.done ? '✓' : s.part ? '◐' : '○';
      return '<li class="' + cls + '"><span class="st ' + cls + '">' + ic + '</span><span class="pv-n"><b>' + esc(AR(x.u.name)) + '</b><small>' + esc(AR(x.src.title)) + ' · ' + qs(x.u.q) + (s.info ? ' · ' + esc(s.info) : '') + (late && !s.done ? ' · <em>متأخر</em>' : '') + '</small></span><button class="btn ' + (s.done ? 'btn-soft' : 'btn-navy') + ' sm" type="button" data-go="' + esc(x.src.id) + '|' + esc(x.u.id) + '">' + (s.done ? 'أعد' : s.part ? 'أكمل' : 'ابدأ') + '</button></li>';
    }).join('') + '</ul>';
  }
  // المتأخر يظهر منه أول ٥ فقط حتى لا تزدحم الصفحة؛ الباقي يُوزَّع بزر «وزّع الباقي»
  function lateRows(late, stOf) { return late.length ? rows(late.slice(0, 5), stOf, true) + (late.length > 5 ? '<p class="m">و' + AR(late.length - 5) + ' وحدة متأخرة أخرى. اضغط «وزّع الباقي من اليوم» بالأعلى لتتوزع على الأيام الجاية.</p>' : '') : ''; }
  function errRows(p) {
    var E = errorsDue(p.goals); if (!E.length) return '';
    return '<ul class="pv-list">' + E.map(function (e) { return '<li><span class="st st-new">↺</span><span class="pv-n"><b>راجع ' + qs(e.n) + ' من أخطائك</b><small>' + esc(e.name) + ' · حان وقت مراجعتها حتى تثبت</small></span><a class="btn btn-soft sm" href="' + e.url + '" data-back="1">راجع</a></li>'; }).join('') + '</ul>';
  }
  // اقتراحات اختيارية: قياس التقدم كل فترة، وتحديث القدرة اليومية حسب ما يحله فعلًا
  function suggestions(p, sc, stOf) {
    var h = '', tk = dk(today()), pl = lastPlace(), every = CAT.checkEvery || 0, age = Math.round((today() - parse(p.start0 || p.start)) / DAY);
    if (pl && p.base && new Date(pl.d).getTime() > new Date(p.base.d).getTime() && p.seenCheck !== pl.d) {
      var th = CAT.threshold || 75, up = ['q', 'v'].filter(function (s) { return p.goals[s] === 'tasis' && (s === 'q' ? pl.k : pl.v) >= th; });
      h += '<div class="card pv-sug"><h3>📈 نتيجة قياس تقدمك</h3><p class="m">الكمي: ' + AR(p.base.k) + '٪ ← <b>' + AR(pl.k) + '٪</b> · اللفظي: ' + AR(p.base.v) + '٪ ← <b>' + AR(pl.v) + '٪</b></p>'
        + (up.length ? '<p class="m">🎉 مستواك في ' + up.map(function (s) { return SUBN[s]; }).join(' و') + ' بقى يسمح تنتقل للتجميعات. ننقله؟ اللي أنجزته هيفضل محسوب.</p><div class="row"><button class="btn btn-navy" type="button" data-p="upgrade" data-v="' + up.join(',') + '">انقله للتجميعات</button><button class="btn btn-soft" type="button" data-p="seen">لا، كمّل زي ما أنا</button></div>' : '<div class="row"><button class="btn btn-soft" type="button" data-p="seen">تمام</button></div>') + '</div>';
    } else if (every && age >= every && (!pl || (Date.now() - new Date(pl.d).getTime()) / DAY >= every) && (!p.snooze || p.snooze <= tk) && CAT.placement) {
      h += '<div class="card pv-sug"><h3>📊 وقت قياس تقدمك</h3><p class="m">٢٠ سؤال تعرف بيها إنت اتحسنت قد إيه من أول الخطة. اختياري.</p><div class="row"><button class="btn btn-navy" type="button" data-p="check">اختبر الآن</button><button class="btn btn-soft" type="button" data-p="snooze">بعدين</button></div></div>';
    }
    if (p.cap && age >= 7 && (!p.capSnooze || p.capSnooze <= tk)) {
      var a = actualDaily(), late = sc.days.some(function (d) { return d.date < tk && d.items.some(function (x) { return !stOf[x.key].done; }); });
      if (a >= p.cap * 1.3 + 5) h += '<div class="card pv-sug"><h3>💪 إنت أسرع من خطتك</h3><p class="m">بتحل في المتوسط <b>' + qs(a) + '</b> يوميًا، أكتر من الـ ' + AR(p.cap) + ' اللي حددتهم. نحدّث خطتك على ' + AR(a) + '؟' + (p.booked ? ' هتخلّص بدري وتلاقي وقت أكتر للمراجعة.' : ' الموعد المقترح لاختبارك هيقرب.') + '</p><div class="row"><button class="btn btn-navy" type="button" data-p="setcap" data-v="' + a + '">نعم، حدّث خطتي</button><button class="btn btn-soft" type="button" data-p="capsnooze">لا شكرًا</button></div></div>';
      else if (late && a > 0 && a <= p.cap * 0.6) h += '<div class="card pv-sug"><h3>🤝 نظبط الخطة على وقتك؟</h3><p class="m">بتحل في المتوسط <b>' + qs(a) + '</b> يوميًا، أقل من الـ ' + AR(p.cap) + ' اللي حددتهم. ممكن نخفف الخطة على ' + AR(Math.max(20, a)) + ' سؤال' + (p.booked ? ' ونمشي حسب الأولوية' : ' ونأخر الموعد المقترح') + '.</p><div class="row"><button class="btn btn-navy" type="button" data-p="setcap" data-v="' + Math.max(20, a) + '">نعم، خفّف الخطة</button><button class="btn btn-soft" type="button" data-p="capsnooze">هلحق، سيبها</button></div></div>';
    }
    return h;
  }
  function editPanel() {
    var E = EDIT;
    var h = '<section class="card pv-edit"><h3>✎ تعديل خطتك</h3><p class="m">أي تعديل يعيد توزيع اللي فاضل بس، واللي أنجزته يفضل محسوب.</p>';
    h += capRow(E.cap, 'e');
    h += '<div class="wz-row"><span>موعد اختبارك:</span><button type="button" class="chip' + (!E.booked ? ' on' : '') + '" data-e="booked" data-v="0">اقترحوا لي موعد</button><button type="button" class="chip' + (E.booked ? ' on' : '') + '" data-e="booked" data-v="1">حجزت موعد</button>' + (E.booked ? '<input type="date" id="edExam" min="' + dk(today()) + '" value="' + esc(E.exam || '') + '">' : '') + '</div>';
    h += offRow(E.off, 'e');
    if (CAT.reviewDays) h += '<label class="wz-chk"><input type="checkbox" id="edRv"' + (E.review ? ' checked' : '') + '> خصّص آخر ' + days(CAT.reviewDays) + ' قبل الاختبار للمحاكي ومراجعة الأخطاء</label>';
    h += '<div class="wz-row"><span>إيقاف مؤقت:</span><label class="m" style="margin:0">أوقف خطتي من النهارده لحد <input type="date" id="edPause" min="' + dk(today()) + '" value="' + esc(E.pause || '') + '"></label></div>';
    var sm = editSummary(); h += '<div class="wz-sum">' + sm.html + '</div>';
    h += '<div class="wz-nav"><button type="button" class="btn btn-soft" data-p="content">تعديل الأهداف والمحتوى</button><span class="row"><button type="button" class="btn btn-soft" data-p="editcancel">إلغاء</button><button type="button" class="btn btn-gold" data-p="editsave"' + (sm.ok ? '' : ' disabled') + '>حفظ التعديلات</button></span></div>';
    return h + '</section>';
  }
  function capRow(cap, ns) {
    var custom = cap && CAPS.indexOf(cap) < 0;
    return '<div class="wz-row"><span>تقدر تحل كام سؤال في اليوم؟</span>' + CAPS.map(function (c) { return '<button type="button" class="chip' + (cap === c ? ' on' : '') + '" data-' + ns + '="cap" data-v="' + c + '">' + AR(c) + '</button>'; }).join('') + '<label class="wz-cap">أو رقم آخر <input type="number" id="' + ns + 'Cap" min="10" max="500" value="' + (custom ? cap : '') + '" placeholder="مثلًا ٦٠"></label></div>';
  }
  function offRow(off, ns) { return '<div class="wz-row"><span>أيام الإجازة (اختياري):</span>' + [6, 0, 1, 2, 3, 4, 5].map(function (d) { return '<button type="button" class="chip' + (off.indexOf(d) >= 0 ? ' on' : '') + '" data-' + ns + '="off" data-v="' + d + '">' + WD[d] + '</button>'; }).join('') + '</div>'; }
  function remainingQ(p) { return unitsOf(p.srcs, p.excl).filter(function (x) { return !status(x.src, x.u).done; }).reduce(function (t, x) { return t + x.u.q; }, 0); }
  function editSummary() {
    var E = EDIT, tk = dk(today()), q = remainingQ(PLAN), pauses = (PLAN.pauses || []).slice();
    if (E.pause) pauses.push({ from: tk, to: E.pause });
    var rv = E.review ? (CAT.reviewDays || 0) : 0;
    if (!E.cap) return { ok: false, html: 'اختر عدد الأسئلة اللي تقدر تحلها في اليوم.' };
    if (!E.booked) { var ex = suggestExam(tk, q, E.cap, E.off, pauses, rv); return { ok: true, html: 'باقي لك ' + qs(q) + '. بمعدل ' + AR(E.cap) + ' في اليوم، <b>الموعد المقترح لاختبارك: من ' + esc(nice(ex, true)) + '</b>.' + subWarn(ex, q, tk, E.off, pauses, rv) }; }
    if (!E.exam || E.exam <= tk) return { ok: false, html: 'اكتب موعد اختبارك (بعد النهارده).' };
    var n = dayList(tk, E.exam, E.off, pauses).length - rv;
    if (n <= 0) return { ok: false, html: 'مفيش أيام دراسة كفاية قبل الموعد. قلّل الإجازات أو أيام المراجعة.' };
    var need = Math.ceil(q / n);
    return { ok: true, html: 'باقي لك ' + qs(q) + ' على ' + days(n) + ' دراسة: حوالي <b>' + qs(need) + '</b> يوميًا.' + (need > E.cap ? '<br><span class="wz-warn">ده أكتر من قدرتك (' + AR(E.cap) + '). الخطة هتمشي حسب الأولوية: الأهم أولًا، والباقي لو الوقت سمح.</span>' : '') + subWarn(E.exam, q, tk, E.off, pauses, rv) };
  }
  function subWarn(ex, q, from, off, pauses, rv) {
    var end = window.__bw && window.__bw.subEnd; if (!end) return '';
    var e = dk(new Date(end)); if (ex <= e) return '';
    var n = dayList(from, e, off, pauses).length - (rv || 0), need = n > 0 ? Math.ceil(q / n) : 0;
    return '<br><span class="wz-warn">اشتراكك ينتهي ' + esc(nice(e)) + '، والخطة محتاجة لحد ' + esc(nice(ex)) + '.' + (need ? ' زوّد عدد الأسئلة لـ ' + AR(need) + ' يوميًا علشان تلحق، أو جدّد اشتراكك.' : ' جدّد اشتراكك علشان تكمّل.') + '</span>';
  }
  function doneKeys(p) { return unitsOf(p.srcs, p.excl).filter(function (x) { return status(x.src, x.u).done; }).map(function (x) { return x.key; }); }
  function applyEdit() {
    var p = PLAN, E = EDIT, tk = dk(today());
    p.cap = E.cap; p.off = E.off.slice(); p.review = E.review ? (CAT.reviewDays || 0) : 0;
    if (E.pause) p.pauses = (p.pauses || []).concat([{ from: tk, to: E.pause }]);
    p.booked = E.booked; p.rebase = { date: tk, skip: doneKeys(p) };
    if (p.booked) { p.exam = E.exam; var n = dayList(tk, p.exam, p.off, p.pauses).length - p.review; p.mode = n > 0 && Math.ceil(remainingQ(p) / n) > p.cap ? 'prio' : 'all'; }
    else { p.mode = 'all'; p.exam = suggestExam(tk, remainingQ(p), p.cap, p.off, p.pauses, p.review); }
    savePlan(p); EDIT = null;
  }
  function redistribute() { var tk = dk(today()); PLAN.rebase = { date: tk, skip: doneKeys(PLAN) }; if (!PLAN.booked && PLAN.cap) PLAN.exam = suggestExam(tk, remainingQ(PLAN), PLAN.cap, PLAN.off, PLAN.pauses, PLAN.review); savePlan(PLAN); }

  // ---------- إنشاء الخطة ----------
  function firstStep() { return CAT.tracks.length === 1 ? (CAT.placement ? 2 : 3) : 1; }
  function startWizard(keep) {
    var tr = CAT.tracks;
    W = { step: firstStep(), track: tr.length === 1 ? tr[0].id : '', goals: null, excl: {}, cap: (PLAN && PLAN.cap) || 50, booked: false, exam: '', off: (PLAN && PLAN.off) || [], review: !!CAT.reviewDays, mode: 'all' };
    if (keep && PLAN && trackOf(PLAN.track)) { W.track = PLAN.track; W.goals = JSON.parse(JSON.stringify(PLAN.goals)); W.excl = JSON.parse(JSON.stringify(PLAN.excl || {})); W.booked = PLAN.booked; W.exam = PLAN.exam; W.review = !!PLAN.review; W.mode = PLAN.mode || 'all'; W.cap = PLAN.cap || 50; W.step = 3; W.keep = 1; }
    if (!tr.length && !W.keep) W.step = 0;
    if (W.step === 3 && !W.goals) W.goals = recGoals();
  }
  function T() { return trackOf(W.track); }
  function recGoals() {
    var t = T(), pl = lastPlace(), th = CAT.threshold || 75;
    if (!t) return { q: 'tasis', v: 'tasis' };
    if (!t.subjects) { var g0 = pl ? (pl.p >= th ? 'tajm' : 'tasis') : 'tasis'; return { q: g0, v: g0 }; }
    return { q: pl ? (pl.k >= th ? 'tajm' : 'tasis') : 'tasis', v: pl ? (pl.v >= th ? 'tajm' : 'tasis') : 'tasis' };
  }
  function wSrcs() { return srcsFor(T(), W.goals || {}); }
  function wizard() {
    var h = '<section class="card wz">';
    if (W.step === 0) return h + '<p class="m">لا توجد خطط متاحة حاليًا.</p></section>';
    var steps = ['اختبارك', 'مستواك', 'أهدافك', 'وقتك'];
    h += '<ol class="wz-steps">' + steps.map(function (s, i) { return '<li class="' + (i + 1 === W.step ? 'on' : i + 1 < W.step ? 'ok' : '') + '">' + AR(i + 1) + '. ' + s + '</li>'; }).join('') + '</ol>';
    var pl = lastPlace();
    if (W.step === 1) {
      h += '<h2>بتستعد لأنهي اختبار؟</h2><div class="wz-cards">' + CAT.tracks.map(function (t) { return '<button type="button" class="wz-card" data-w="track" data-v="' + esc(t.id) + '"><b>' + esc(t.title) + '</b></button>'; }).join('') + '</div>';
    } else if (W.step === 2) {
      h += '<h2>نعرف مستواك الأول</h2><p class="m">على أساس مستواك بنبني خطتك: كل قسم بالهدف المناسب له.</p>';
      if (pl) h += '<div class="wz-rec">📊 آخر تحديد مستوى (' + esc(new Date(pl.d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })) + '): الكمي <b>' + AR(pl.k) + '٪</b> · اللفظي <b>' + AR(pl.v) + '٪</b> · العام <b>' + AR(pl.p) + '٪</b></div><div class="wz-nav"><button type="button" class="btn btn-soft" data-w="level">أعد تحديد المستوى</button><button type="button" class="btn btn-navy" data-w="next">كمّل بالنتيجة دي ←</button></div>';
      else h += '<div class="wz-cards"><button type="button" class="wz-card wz-main" data-w="level"><b>حدّد مستواك الآن</b><small>٢٠ سؤالًا من الكمي واللفظي، حوالي ٢٠ دقيقة، وترجع هنا على طول</small></button><button type="button" class="wz-card" data-w="next"><b>أعرف مستواي</b><small>أختار أهدافي بنفسي</small></button></div>';
    } else if (W.step === 3) {
      var t = T(), rec = recGoals();
      if (!W.goals) W.goals = rec;
      h += '<h2>أهدافك</h2><p class="m">' + esc(t.title) + (pl ? ' · اخترنا لك المقترح حسب مستواك، وتقدر تغيّره' : '') + '</p>';
      var opts = [['tasis', 'تأسيس'], ['tajm', 'تجميعات']].concat(t.all ? [['all', 'شاملة']] : []);
      var row = function (key, label, sc) { return '<div class="wz-goal"><b>' + label + (sc != null ? ' <small>(' + AR(sc) + '٪)</small>' : '') + '</b><div class="row">' + opts.concat(key === 'both' ? [] : [['none', 'مش محتاجه']]).map(function (o) { var cur = key === 'both' ? W.goals.q : W.goals[key], r = key === 'both' ? rec.q : rec[key]; return '<button type="button" class="chip' + (cur === o[0] ? ' on' : '') + '" data-w="goal" data-k="' + key + '" data-v="' + o[0] + '">' + o[1] + (pl && r === o[0] ? '<small>مقترح</small>' : '') + '</button>'; }).join('') + '</div></div>'; };
      if (t.subjects) h += row('q', 'الكمي', pl ? pl.k : null) + row('v', 'اللفظي', pl ? pl.v : null);
      else h += row('both', 'الكمي واللفظي', pl ? pl.p : null);
      h += '<p class="m wz-hint">تأسيس: المهارات من البداية · تجميعات: الأقسام والنماذج المكررة في الاختبار' + (t.all ? ' · شاملة: التأسيس ثم التجميعات' : '') + '</p>';
      var srcs = wSrcs(), all = unitsOf(srcs, W.excl), tq = all.reduce(function (s, x) { return s + x.u.q; }, 0);
      h += '<details class="wz-src wz-custom"' + (OPEN.custom ? ' open' : '') + ' data-open="custom"><summary><b>المحتوى: ' + AR(all.length) + ' وحدة · ' + qs(tq) + '</b><span class="m">خصّص (اختياري)</span></summary>';
      srcs.forEach(function (id) {
        var S = CAT.sources[id], ex = W.excl[id] || [], n = S.units.length, on = n - ex.length, q = S.units.reduce(function (s, u) { return s + (ex.indexOf(u.id) < 0 ? u.q : 0); }, 0);
        h += '<details class="wz-src"' + (OPEN['s' + id] ? ' open' : '') + ' data-open="s' + esc(id) + '"><summary><label class="wz-sl"><input type="checkbox" data-all="' + esc(id) + '"' + (on === n ? ' checked' : '') + (on && on < n ? ' data-mixed="1"' : '') + '> <b>' + esc(AR(S.title)) + '</b></label><span class="m">' + AR(on) + ' من ' + AR(n) + ' ' + esc(S.unit) + ' · ' + qs(q) + '</span></summary><div class="wz-units">';
        var grp = null;
        S.units.forEach(function (u) { if (u.group && u.group !== grp) { grp = u.group; h += '<div class="wz-g">' + esc(grp) + '</div>'; } h += '<label class="wz-u"><input type="checkbox" data-u="' + esc(id) + '|' + esc(u.id) + '"' + (ex.indexOf(u.id) < 0 ? ' checked' : '') + '> ' + esc(AR(u.name)) + ' <small>(' + AR(u.q) + ')</small></label>'; });
        h += '</div></details>';
      });
      h += '</details>';
    } else if (W.step === 4) {
      h += '<h2>وقتك</h2>' + capRow(W.cap, 'w');
      h += '<div class="wz-row"><span>حجزت موعد اختبارك؟</span><button type="button" class="chip' + (!W.booked ? ' on' : '') + '" data-w="booked" data-v="0">لأ، اقترحوا لي موعد</button><button type="button" class="chip' + (W.booked ? ' on' : '') + '" data-w="booked" data-v="1">أيوه حجزت</button>' + (W.booked ? '<input type="date" id="wzExam" min="' + dk(today()) + '" value="' + esc(W.exam) + '">' : '') + '</div>';
      h += offRow(W.off, 'w');
      if (CAT.reviewDays) h += '<label class="wz-chk"><input type="checkbox" id="wzRv"' + (W.review ? ' checked' : '') + '> خصّص آخر ' + days(CAT.reviewDays) + ' قبل الاختبار للمحاكي ومراجعة الأخطاء (مستحسن)</label>';
      h += '<div class="wz-sum">' + summary().html + '</div>';
    }
    h += '<div class="wz-nav">' + (W.step > firstStep() && !(W.keep && W.step === 3) ? '<button type="button" class="btn btn-soft" data-w="back">→ رجوع</button>' : '<span></span>') + (W.step === 3 ? '<button type="button" class="btn btn-navy" data-w="next"' + (unitsOf(wSrcs(), W.excl).length ? '' : ' disabled') + '>التالي ←</button>' : W.step === 4 ? '<button type="button" class="btn btn-gold" data-w="save"' + (summary().ok ? '' : ' disabled') + '>' + (W.keep ? 'احفظ خطتي' : 'ابدأ خطتي') + '</button>' : '') + '</div>';
    if (PLAN) h += '<p class="m" style="margin-top:10px"><button type="button" class="lnk" data-w="cancel">إلغاء والرجوع لخطتي الحالية</button></p>';
    return h + '</section>';
  }
  function summary() {
    var u = unitsOf(wSrcs(), W.excl), q = u.reduce(function (t, x) { return t + x.u.q; }, 0), tk = dk(today()), rv = W.review ? (CAT.reviewDays || 0) : 0;
    if (!W.cap) return { ok: false, html: 'اختر عدد الأسئلة اللي تقدر تحلها في اليوم.' };
    if (!W.booked) {
      var ex = suggestExam(tk, q, W.cap, W.off, [], rv), n = dayList(tk, ex, W.off, []).length - rv;
      W.sug = ex;
      return { ok: true, html: AR(u.length) + ' وحدة، ' + qs(q) + '. بمعدل <b>' + AR(W.cap) + '</b> في اليوم هتخلّص في <b>' + days(n) + ' دراسة</b>' + (rv ? ' وبعدها ' + days(rv) + ' محاكي ومراجعة' : '') + '.<br>✅ <b>الموعد المقترح لاختبارك: من ' + esc(nice(ex, true)) + '</b>. احجز في قياس من اليوم ده أو بعده.' + subWarn(ex, q, tk, W.off, [], rv) };
    }
    if (!W.exam) return { ok: false, html: 'اكتب موعد اختبارك.' };
    if (W.exam <= tk) return { ok: false, html: 'اختر تاريخًا بعد اليوم.' };
    var d = dayList(tk, W.exam, W.off, []).length - rv;
    if (d <= 0) return { ok: false, html: 'مفيش أيام دراسة كفاية قبل الموعد. قلّل الإجازات أو ألغِ أيام المراجعة.' };
    var need = Math.ceil(q / d), h = AR(u.length) + ' وحدة، ' + qs(q) + ' على <b>' + days(d) + ' دراسة</b>: محتاج حوالي <b>' + qs(need) + '</b> يوميًا.';
    if (need <= W.cap) { W.mode = 'all'; return { ok: true, html: h + '<br>✅ قدرتك (' + AR(W.cap) + ') كفاية، وهتخلّص في المعاد.' + subWarn(W.exam, q, tk, W.off, [], rv) }; }
    h += '<br><span class="wz-warn">ده أكتر من قدرتك (' + AR(W.cap) + ' في اليوم). اختار حل:</span><div class="wz-fix"><button type="button" class="chip" data-w="cap" data-v="' + need + '">أزوّد مجهودي لـ ' + AR(need) + '</button><button type="button" class="chip' + (W.mode === 'prio' ? ' on' : '') + '" data-w="mode" data-v="prio">أمشي حسب الأولوية<small>الأهم أولًا بقدرتي الحالية</small></button><button type="button" class="chip" data-w="back">أقلّل المحتوى</button></div>';
    return { ok: W.mode === 'prio', html: h };
  }
  function saveWizard() {
    var t = T(), tk = dk(today()), pl = lastPlace(), sc0 = summary();
    if (!sc0.ok) return;
    var old = PLAN, p = { v: 2, track: t.id, trackTitle: t.title, goals: JSON.parse(JSON.stringify(W.goals)), goal: W.goals.q !== 'none' ? W.goals.q : W.goals.v, subj: ['q', 'v'].filter(function (s) { return W.goals[s] !== 'none'; }), srcs: wSrcs(), excl: JSON.parse(JSON.stringify(W.excl)), cap: W.cap, booked: W.booked, review: W.review ? (CAT.reviewDays || 0) : 0, off: W.off.slice(), pauses: [], done: {}, start: tk, start0: (W.keep && old && (old.start0 || old.start)) || tk, base: pl ? { d: pl.d, k: pl.k, v: pl.v, p: pl.p } : null };
    p.mode = W.booked ? (W.mode === 'prio' ? 'prio' : 'all') : 'all';
    p.exam = W.booked ? W.exam : (W.sug || suggestExam(tk, unitsOf(p.srcs, p.excl).reduce(function (s, x) { return s + x.u.q; }, 0), p.cap, p.off, [], p.review));
    if (W.keep && old) { p.done = old.done || {}; p.seenCheck = old.seenCheck; p.base = old.base || p.base; p.snooze = old.snooze; p.capSnooze = old.capSnooze; }
    // ما أنجزه الطالب قبل الخطة الجديدة لا يُعاد توزيعه، ويبقى محسوبًا في الإنجاز
    var done = doneKeys(p);
    if (done.length) { p.rebase = { date: tk, skip: done }; if (!p.booked) p.exam = suggestExam(tk, remainingQ(p), p.cap, p.off, [], p.review); }
    savePlan(p); W = null; OPEN = {}; draw(); window.scrollTo(0, 0);
  }

  // ===== الأحداث =====
  function readCap(id) { var c = document.getElementById(id); var v = c && +c.value; return v >= 10 && v <= 500 ? Math.round(v) : 0; }
  app.addEventListener('toggle', function (e) { var d = e.target; if (d && d.getAttribute && d.getAttribute('data-open')) OPEN[d.getAttribute('data-open')] = d.open; }, true);
  app.addEventListener('click', function (e) {
    if (e.target.closest('a[data-back]')) { back(); return; }
    var b = e.target.closest('[data-go],[data-p],[data-w],[data-e]'); if (!b || b.disabled) return;
    if (b.hasAttribute('data-go')) { var g = b.getAttribute('data-go').split('|'); return go(g[0], g[1]); }
    var p = b.getAttribute('data-p'), v = b.getAttribute('data-v'), tk = dk(today());
    if (p) {
      if (p === 'retry') return load();
      if (p === 'change') { EDIT = null; startWizard(); return draw(); }
      if (p === 'content') { EDIT = null; startWizard(true); return draw(); }
      if (p === 'edit') { EDIT = { cap: PLAN.cap || 50, booked: !!PLAN.booked, exam: PLAN.exam, off: (PLAN.off || []).slice(), review: !!PLAN.review, pause: '' }; draw(); var el = app.querySelector('.pv-edit'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' }); return; }
      if (p === 'editcancel') { EDIT = null; return draw(); }
      if (p === 'editsave') { if (editSummary().ok) applyEdit(); return draw(); }
      if (p === 'rebase') { redistribute(); return draw(); }
      if (p === 'resume') { PLAN.pauses = (PLAN.pauses || []).map(function (x) { return tk >= x.from && tk <= x.to ? { from: x.from, to: addDays(tk, -1) } : x; }).filter(function (x) { return x.to >= x.from; }); redistribute(); return draw(); }
      if (p === 'check') { sput(FLOW, { check: 1 }); location.href = '/placement.html'; return; }
      if (p === 'snooze') { PLAN.snooze = addDays(tk, 7); savePlan(PLAN); return draw(); }
      if (p === 'seen') { PLAN.seenCheck = (lastPlace() || {}).d; savePlan(PLAN); return draw(); }
      if (p === 'upgrade') { var t = trackOf(PLAN.track); v.split(',').forEach(function (s) { PLAN.goals[s] = 'tajm'; }); if (t) PLAN.srcs = srcsFor(t, PLAN.goals); PLAN.seenCheck = (lastPlace() || {}).d; redistribute(); return draw(); }
      if (p === 'setcap') { EDIT = { cap: +v, booked: !!PLAN.booked, exam: PLAN.exam, off: (PLAN.off || []).slice(), review: !!PLAN.review, pause: '' }; applyEdit(); return draw(); }
      if (p === 'capsnooze') { PLAN.capSnooze = addDays(tk, 7); savePlan(PLAN); return draw(); }
      return;
    }
    var e2 = b.getAttribute('data-e');
    if (e2) {
      if (!EDIT) return;
      if (e2 === 'cap') EDIT.cap = +v;
      else if (e2 === 'booked') EDIT.booked = v === '1';
      else if (e2 === 'off') { var d = +v, i = EDIT.off.indexOf(d); if (i >= 0) EDIT.off.splice(i, 1); else if (EDIT.off.length < 5) EDIT.off.push(d); }
      return draw();
    }
    var w = b.getAttribute('data-w'); if (!w || !W) return;
    if (w === 'track') { W.track = v; W.goals = null; W.excl = {}; W.step = CAT.placement ? 2 : 3; if (W.step === 3) W.goals = recGoals(); }
    else if (w === 'level') { sput(FLOW, { W: W, at: Date.now() }); location.href = '/placement.html'; return; }
    else if (w === 'goal') { var k = b.getAttribute('data-k'); if (k === 'both') { W.goals.q = v; W.goals.v = v; } else W.goals[k] = v; W.excl = {}; }
    else if (w === 'cap') { W.cap = +v; W.mode = 'all'; }
    else if (w === 'mode') W.mode = v;
    else if (w === 'booked') { W.booked = v === '1'; W.mode = 'all'; }
    else if (w === 'off') { var d2 = +v, j = W.off.indexOf(d2); if (j >= 0) W.off.splice(j, 1); else if (W.off.length < 5) W.off.push(d2); }
    else if (w === 'back') { if (W.step === 4) W.step = 3; else if (W.step === 3) W.step = CAT.placement ? 2 : 1; else W.step = 1; if (W.step < firstStep()) W.step = firstStep(); }
    else if (w === 'next') { if (W.step === 2) { W.goals = recGoals(); W.step = 3; } else if (W.step === 3) W.step = 4; }
    else if (w === 'save') return saveWizard();
    else if (w === 'cancel') W = null;
    draw();
  });
  app.addEventListener('change', function (e) {
    var c = e.target;
    if (c.hasAttribute('data-done')) { PLAN.done = PLAN.done || {}; PLAN.done[c.getAttribute('data-done')] = c.checked; savePlan(PLAN); return draw(); }
    if (c.id === 'wzExam') { W.exam = c.value; W.mode = 'all'; return draw(); }
    if (c.id === 'wCap') { var v = readCap('wCap'); if (v) { W.cap = v; W.mode = 'all'; } return draw(); }
    if (c.id === 'wzRv') { W.review = c.checked; return draw(); }
    if (c.id === 'eCap') { var v2 = readCap('eCap'); if (v2) EDIT.cap = v2; return draw(); }
    if (c.id === 'edExam') { EDIT.exam = c.value; return draw(); }
    if (c.id === 'edRv') { EDIT.review = c.checked; return draw(); }
    if (c.id === 'edPause') { EDIT.pause = c.value; return draw(); }
    if (c.hasAttribute('data-all')) { var id = c.getAttribute('data-all'); W.excl[id] = c.checked ? [] : CAT.sources[id].units.map(function (u) { return u.id; }); return draw(); }
    if (c.hasAttribute('data-u')) { var a = c.getAttribute('data-u').split('|'), L = W.excl[a[0]] = W.excl[a[0]] || [], k = L.indexOf(a[1]); if (c.checked && k >= 0) L.splice(k, 1); else if (!c.checked && k < 0) L.push(a[1]); return draw(); }
  });
  // الرجوع للخطة من صفحة اختبار: تُقرأ النتائج من جديد
  addEventListener('pageshow', function (e) { if (e.persisted) location.reload(); });
  addEventListener('storage', function () { if (CAT && !W && !EDIT) draw(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && CAT && !W && !EDIT) draw(); });
  load();
})();
