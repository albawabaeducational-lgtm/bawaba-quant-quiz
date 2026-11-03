// خطط الاستعداد في صفحة «خطتي»: يختار الطالب الاختبار (محوسب/ورقي/…) والهدف (تأسيس/تجميعات/شاملة)
// والمحتوى والموعد، فتتوزع الوحدات على الأيام بعدد الأسئلة، ويُحسب الإنجاز تلقائيًا من نتائجه المحفوظة في حسابه.
(function () {
  'use strict';
  var app = document.getElementById('app'); if (!app) return;
  var KEY = 'bw-plan-v2', DAY = 864e5;
  var AR = function (n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function get(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function dk(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function parse(s) { var d = new Date(s + 'T00:00:00'); return Number.isFinite(d.getTime()) ? d : null; }
  function today() { var t = new Date(); t.setHours(0, 0, 0, 0); return t; }
  var WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var GOALN = { tasis: 'التأسيس', tajm: 'حل التجميعات', all: 'الخطة الشاملة' }, SUBN = { q: 'الكمي', v: 'اللفظي' };
  var CAT = null, ERR = '', PLAN = null, W = null, OPEN = {};
  try { sessionStorage.removeItem('bw-plan-return'); } catch (e) { }

  // ===== الخطة المحفوظة (مع ترحيل الخطة القديمة: موعد الاختبار وعلامات «تم» تبقى كما هي) =====
  function loadPlan() {
    var p = get(KEY, null); if (p && p.v === 2 && Array.isArray(p.srcs)) return p;
    var g = get('bw-goal-v1', {}) || {}, o = get('bw-study-plan-v1', null);
    if (g.exam && parse(g.exam)) return { v: 2, track: 'computer', trackTitle: 'القدرات المحوسب', goal: 'tajm', subj: ['q', 'v'], mode: 'all', srcs: ['kamy', 'kamy2', 'lafzi'], excl: {}, exam: g.exam, start: (o && o.start) || dk(today()), off: [], done: (o && o.done && typeof o.done === 'object') ? o.done : {}, migrated: 1 };
    return null;
  }
  function savePlan(p) { PLAN = p; put(KEY, p); if (p) { var g = get('bw-goal-v1', {}) || {}; if (g.exam !== p.exam) { g.exam = p.exam; put('bw-goal-v1', g); } } }

  // ===== التقدم في كل وحدة (من نفس مفاتيح صفحات الاختبارات، وهي محفوظة في حساب الطالب) =====
  var MEMO = {};
  function memo(k, d) { if (!(k in MEMO)) MEMO[k] = get(k, d); return MEMO[k]; }
  function status(src, u) {
    var S = src, x = { done: false, part: false, info: '' };
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
  function go(srcId, unitId) {
    var S = CAT && CAT.sources[srcId]; if (!S) return;
    try { sessionStorage.setItem('bw-plan-return', JSON.stringify({ u: '/progress.html', t: Date.now() })); } catch (e) { }
    if (S.kind === 'bank' && S.sel) { try { localStorage.setItem(S.sel, JSON.stringify([+unitId])); } catch (e) { } }
    location.href = S.page + (S.kind === 'models' ? '#model=' + encodeURIComponent(unitId) : '');
  }

  // ===== بناء الجدول: الوحدات بالترتيب، موزعة على أيام الدراسة بعدد الأسئلة =====
  function unitsOf(p, subj, srcs, excl) {
    var out = [];
    (srcs || []).forEach(function (id) {
      var S = CAT.sources[id]; if (!S || !S.units) return;
      if (S.subj !== 'm' && subj.indexOf(S.subj) < 0) return;
      var ex = (excl && excl[id]) || [];
      S.units.forEach(function (u) { if (ex.indexOf(u.id) < 0) out.push({ key: id + ':' + u.id, src: S, u: u, w: Math.max(1, +u.q || 1) }); });
    });
    return out;
  }
  function studyDays(fromKey, exam, off) {
    var a = parse(fromKey), e = parse(exam), out = []; if (!a || !e) return out;
    for (var d = new Date(a); d < e && out.length < 400; d.setDate(d.getDate() + 1)) if ((off || []).indexOf(d.getDay()) < 0) out.push(dk(d));
    return out;
  }
  function schedule(p) {
    var all = unitsOf(p, p.subj, p.srcs, p.excl), skip = p.rebase ? p.rebase.skip || [] : [];
    var from = p.rebase ? p.rebase.date : p.start, days = studyDays(from, p.exam, p.off);
    var units = all.filter(function (x) { return skip.indexOf(x.key) < 0; }), extra = [];
    if (p.mode === 'prio' && days.length) {
      var cap = (CAT.dailyMax || 120) * days.length, cum = 0, keep = [];
      units.forEach(function (x) { if (cum < cap) { keep.push(x); cum += x.w; } else extra.push(x); });
      units = keep;
    }
    var plan = days.map(function (d) { return { date: d, items: [], q: 0 }; });
    // كل قسم (كمي/لفظي/اختبار كامل) يتوزع وحده على كل الأيام، فيجد الطالب في اليوم الواحد كميًا ولفظيًا معًا
    if (plan.length) ['q', 'v', 'm'].forEach(function (sj) {
      var L = units.filter(function (x) { return x.src.subj === sj; }), total = L.reduce(function (t, x) { return t + x.w; }, 0), cum2 = 0;
      L.forEach(function (x) { var i = Math.min(plan.length - 1, Math.floor((cum2 + x.w / 2) * plan.length / Math.max(1, total))); cum2 += x.w; plan[i].items.push(x); plan[i].q += x.u.q; });
    });
    return { all: all, days: plan, extra: extra, skipped: skip.length };
  }

  // ===== الواجهة =====
  function load() {
    ERR = ''; draw();
    fetch('/api/plan/catalog', { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { if (!d || !d.sources) throw 0; CAT = d; PLAN = loadPlan(); if (PLAN && PLAN.migrated && !get(KEY, null)) savePlan(PLAN); draw(); })
      .catch(function () { ERR = 'تعذّر تحميل بيانات الخطط. تحقق من الاتصال ثم أعد المحاولة.'; draw(); });
  }
  function draw() {
    MEMO = {};
    var h = '<main class="study-plan-page"><h1>خطتي</h1>';
    if (ERR) h += '<div class="card"><p class="m">' + esc(ERR) + '</p><button class="btn btn-soft" data-p="retry" type="button">إعادة المحاولة</button></div>';
    else if (!CAT) h += '<div class="card"><p class="m">جارٍ تجهيز خطتك…</p></div>';
    else if (W) h += wizard();
    else if (PLAN) h += view();
    else { startWizard(); h += wizard(); }
    app.innerHTML = h + '</main>';
    [].forEach.call(app.querySelectorAll('[data-mixed]'), function (c) { c.indeterminate = true; });
  }

  // ---------- عرض الخطة ----------
  function view() {
    var p = PLAN, sc = schedule(p), tk = dk(today()), h = '';
    var stOf = {}; sc.all.forEach(function (x) { stOf[x.key] = status(x.src, x.u); });
    var tot = sc.all.length, fin = sc.all.filter(function (x) { return stOf[x.key].done; }).length, pct = tot ? Math.round(fin * 100 / tot) : 0;
    var ex = parse(p.exam), left = ex ? Math.round((ex - today()) / DAY) : 0;
    var sub = p.subj && p.subj.length && p.srcs.some(function (id) { var S = CAT.sources[id]; return S && S.subj !== 'm'; }) ? ' · ' + p.subj.map(function (s) { return SUBN[s]; }).join(' و') : '';
    h += '<section class="card pv-head"><div class="pv-top"><div><small class="pv-k">' + esc(p.trackTitle || '') + '</small><h2>' + esc(GOALN[p.goal] || '') + esc(sub) + '</h2><p class="m">' + (left > 0 ? 'باقي <b>' + AR(left) + '</b> ' + (left === 1 ? 'يوم' : left <= 10 ? 'أيام' : 'يومًا') + ' على اختبارك (' + esc(ex.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })) + ')' : left === 0 ? 'اختبارك اليوم، بالتوفيق!' : 'موعد اختبارك مضى. حدّث الموعد أو ابدأ خطة جديدة.') + '</p></div><button class="btn btn-soft" data-p="change" type="button">غيّر خطتي</button></div>'
      + '<div class="pv-prog"><b>أنجزت ' + AR(fin) + ' من ' + AR(tot) + ' (' + AR(pct) + '٪)</b><div class="gbar"><i style="width:' + pct + '%"></i></div></div></section>';
    if (left <= 0) return h;
    // المتأخر: وحدات أيام مضت ولم تُنجز
    var late = [], todayItems = [], next = null;
    sc.days.forEach(function (d) { d.items.forEach(function (x) { if (d.date === tk) todayItems.push(x); else if (d.date < tk && !stOf[x.key].done) late.push(x); }); if (!next && d.date > tk && d.items.length) next = d; });
    if (late.length) h += '<div class="pv-late"><span>⚠ متأخر ' + AR(late.length) + ' ' + (late.length === 1 ? 'وحدة' : late.length <= 10 ? 'وحدات' : 'وحدة') + ' عن خطتك. لا مشكلة، وزّع الباقي على الأيام المتبقية.</span><button class="btn btn-navy" data-p="rebase" type="button">وزّع الباقي من اليوم</button></div>';
    var isStudy = sc.days.some(function (d) { return d.date === tk; });
    h += '<section class="card"><h3>📌 مهام اليوم</h3>';
    var todayLeft = todayItems.filter(function (x) { return !stOf[x.key].done; }), list = late.concat(todayLeft);
    if (!isStudy && !late.length) h += '<p class="m">اليوم إجازة في خطتك. ' + (next ? 'لو حابب تسبق، هذه مهام ' + esc(WD[parse(next.date).getDay()]) + ':' : '') + '</p>' + (next ? rows(next.items, stOf) : '');
    else if (!list.length) h += '<p class="m pv-ok">🎉 أنهيت مهام اليوم. ' + (next ? 'تقدر تسبق بمهام ' + esc(WD[parse(next.date).getDay()]) + ':' : '') + '</p>' + (next ? rows(next.items, stOf) : '') + (todayItems.length ? '<details class="pv-more" style="margin-top:10px"><summary>ما أنجزته اليوم (' + AR(todayItems.length) + ')</summary>' + rows(todayItems, stOf) + '</details>' : '');
    else h += '<p class="m">أنجزت ' + AR(todayItems.length - todayLeft.length) + ' من ' + AR(todayItems.length) + ' من مهام اليوم' + (late.length ? '، ومعها ' + AR(late.length) + ' متأخرة' : '') + '.</p>' + rows(late, stOf, true) + rows(todayItems, stOf);
    h += '</section>';
    if (sc.extra.length) h += '<details class="card pv-more"><summary>لو خلّصت بدري: ' + AR(sc.extra.length) + ' وحدة إضافية حسب الأولوية</summary>' + rows(sc.extra, stOf) + '</details>';
    // الجدول كامل
    h += '<details class="card pv-more"' + (OPEN.full ? ' open' : '') + ' data-open="full"><summary>عرض الجدول كاملًا (' + AR(sc.days.length) + ' يوم دراسة)</summary><div class="pv-days">';
    sc.days.forEach(function (d) {
      var dn = d.items.filter(function (x) { return stOf[x.key].done; }).length, auto = d.items.length && dn === d.items.length, man = !!(p.done || {})[d.date], dd = parse(d.date);
      h += '<div class="pv-day' + (auto || man ? ' done' : '') + (d.date === tk ? ' is-today' : '') + '"><div class="pv-dh"><b>' + (d.date === tk ? '<span class="today-tag">اليوم</span>' : '') + esc(dd.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'short' })) + '</b><span class="m">' + (d.items.length ? AR(d.q) + ' سؤالًا · ' + (auto ? '✓ مكتمل تلقائيًا' : 'أنجزت ' + AR(dn) + ' من ' + AR(d.items.length)) : 'مراجعة أو راحة') + '</span><label class="study-check"><input type="checkbox" data-done="' + esc(d.date) + '"' + (man ? ' checked' : '') + '> تم</label></div>' + (d.items.length ? rows(d.items, stOf) : '') + '</div>';
    });
    h += '</div></details>';
    if (sc.skipped) h += '<p class="m">أعدت توزيع الخطة، و' + AR(sc.skipped) + ' وحدة أنجزتها قبلها محسوبة في نسبة الإنجاز.</p>';
    h += '<p class="m study-foot">' + (window.__bwSid ? 'علامات ✓ تتحدث تلقائيًا من نتائجك المحفوظة في حسابك، على أي جهاز تدخل منه.' : 'سجّل الدخول لتُحفظ خطتك ونتائجك في حسابك وتجدها على أي جهاز.') + '</p>';
    return h;
  }
  function rows(items, stOf, late) {
    if (!items.length) return '';
    return '<ul class="pv-list">' + items.map(function (x) {
      var s = stOf[x.key] || status(x.src, x.u), cls = s.done ? 'st-done' : s.part ? 'st-part' : 'st-new', ic = s.done ? '✓' : s.part ? '◐' : '○';
      return '<li class="' + cls + '"><span class="st ' + cls + '">' + ic + '</span><span class="pv-n"><b>' + esc(AR(x.u.name)) + '</b><small>' + esc(x.src.title) + ' · ' + AR(x.u.q) + ' سؤالًا' + (s.info ? ' · ' + esc(s.info) : '') + (late && !s.done ? ' · <em>متأخر</em>' : '') + '</small></span><button class="btn ' + (s.done ? 'btn-soft' : 'btn-navy') + ' sm" type="button" data-go="' + esc(x.src.id) + '|' + esc(x.u.id) + '">' + (s.done ? 'أعد' : s.part ? 'أكمل' : 'ابدأ') + '</button></li>';
    }).join('') + '</ul>';
  }

  // ---------- إنشاء الخطة (٤ خطوات) ----------
  function startWizard() {
    var tr = CAT.tracks; W = { step: tr.length === 1 ? 2 : 1, track: tr.length === 1 ? tr[0].id : '', goal: '', subj: ['q', 'v'], excl: {}, mode: 'all', exam: (PLAN && PLAN.exam) || '', off: (PLAN && PLAN.off) || [] };
    if (!tr.length) W.step = 0;
  }
  function T() { return CAT.tracks.filter(function (t) { return t.id === W.track; })[0]; }
  function wSrcs() { var t = T(); if (!t) return []; var a = W.goal === 'tasis' ? t.tasis : W.goal === 'tajm' ? t.tajm : t.tasis.concat(t.tajm); return a.filter(function (x, i) { return a.indexOf(x) === i && CAT.sources[x]; }); }
  function wizard() {
    var h = '<section class="card wz">';
    if (W.step === 0) return h + '<p class="m">لا توجد خطط متاحة حاليًا.</p></section>';
    var steps = ['الاختبار', 'الهدف', 'المحتوى', 'الموعد'];
    h += '<ol class="wz-steps">' + steps.map(function (s, i) { return '<li class="' + (i + 1 === W.step ? 'on' : i + 1 < W.step ? 'ok' : '') + '">' + AR(i + 1) + '. ' + s + '</li>'; }).join('') + '</ol>';
    if (W.step === 1) {
      h += '<h2>إنت بتستعد لأنهي اختبار؟</h2><div class="wz-cards">' + CAT.tracks.map(function (t) { return '<button type="button" class="wz-card" data-w="track" data-v="' + esc(t.id) + '"><b>' + esc(t.title) + '</b></button>'; }).join('') + '</div>';
    } else if (W.step === 2) {
      var t = T(), pl = (get('bw-place-v1', []) || []).slice(-1)[0], th = CAT.threshold || 75;
      h += '<h2>إيه هدفك دلوقتي؟</h2><p class="m">' + esc(t.title) + '</p>';
      if (pl) {
        var rec = function (v) { return v >= th ? '<b class="rk-g">حل التجميعات</b>' : '<b class="rk-o">مراجعة التأسيس</b>'; };
        h += '<div class="wz-rec">📊 نتيجتك في تحديد المستوى: ' + (t.subjects ? 'الكمي <b>' + AR(pl.k) + '٪</b>، اللفظي <b>' + AR(pl.v) + '٪</b>.<br>ننصحك في الكمي بـ ' + rec(pl.k) + '، وفي اللفظي بـ ' + rec(pl.v) + '.' : '<b>' + AR(pl.p) + '٪</b>. ننصحك بـ ' + rec(pl.p) + '.') + '</div>';
      } else h += '<div class="wz-rec">لا تعرف من أين تبدأ؟ <a href="/placement.html">اختبر مستواك في ٢٠ سؤالًا</a> وسننصحك بالهدف المناسب.</div>';
      h += '<div class="wz-cards">' + [['tasis', 'أبني الأساس', 'التأسيس: المهارات من البداية'], ['tajm', 'أحل التجميعات', 'الأقسام والنماذج المكررة في الاختبار']].concat(t.all ? [['all', 'الخطة الشاملة', 'التأسيس أولًا ثم التجميعات']] : []).map(function (g) { return '<button type="button" class="wz-card" data-w="goal" data-v="' + g[0] + '"><b>' + g[1] + '</b><small>' + g[2] + '</small></button>'; }).join('') + '</div>';
    } else if (W.step === 3) {
      var t3 = T(), srcs = wSrcs();
      h += '<h2>تحب تذاكر إيه؟</h2><p class="m">' + esc(t3.title) + ' · ' + GOALN[W.goal] + '</p>';
      if (t3.subjects) h += '<div class="wz-row"><span>القسم:</span>' + [['q', 'الكمي'], ['v', 'اللفظي'], ['qv', 'الاثنين']].map(function (o) { var on = W.subj.join('') === o[0]; return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-w="subj" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>';
      if (W.goal === 'tajm') h += '<div class="wz-row"><span>طريقة الإنهاء:</span><button type="button" class="chip' + (W.mode === 'all' ? ' on' : '') + '" data-w="mode" data-v="all">كل المحتوى<small>أنهي كل ما اخترته</small></button><button type="button" class="chip' + (W.mode === 'prio' ? ' on' : '') + '" data-w="mode" data-v="prio">حسب الأولوية<small>الأهم أولًا، والباقي إن سمح الوقت</small></button></div>';
      h += '<p class="m">كل المحتوى مختار. افتح أي مصدر لو تحب تشيل منه شيئًا تتقنه.</p>';
      srcs.forEach(function (id) {
        var S = CAT.sources[id]; if (S.subj !== 'm' && W.subj.indexOf(S.subj) < 0) return;
        var ex = W.excl[id] || [], n = S.units.length, on = n - ex.length, q = S.units.reduce(function (t, u) { return t + (ex.indexOf(u.id) < 0 ? u.q : 0); }, 0);
        h += '<details class="wz-src"' + (OPEN['s' + id] ? ' open' : '') + ' data-open="s' + esc(id) + '"><summary><label class="wz-sl"><input type="checkbox" data-all="' + esc(id) + '"' + (on === n ? ' checked' : '') + (on && on < n ? ' data-mixed="1"' : '') + '> <b>' + esc(S.title) + '</b></label><span class="m">' + AR(on) + ' من ' + AR(n) + ' ' + esc(S.unit) + ' · ' + AR(q) + ' سؤالًا</span></summary><div class="wz-units">';
        var grp = null;
        S.units.forEach(function (u) {
          if (u.group && u.group !== grp) { grp = u.group; h += '<div class="wz-g">' + esc(grp) + '</div>'; }
          h += '<label class="wz-u"><input type="checkbox" data-u="' + esc(id) + '|' + esc(u.id) + '"' + (ex.indexOf(u.id) < 0 ? ' checked' : '') + '> ' + esc(AR(u.name)) + ' <small>(' + AR(u.q) + ')</small></label>';
        });
        h += '</div></details>';
      });
    } else if (W.step === 4) {
      var tk = dk(today()), sm = summary();
      h += '<h2>إمتى اختبارك؟</h2><div class="study-date-row"><label for="wzExam">موعد الاختبار</label><input type="date" id="wzExam" min="' + tk + '" value="' + esc(W.exam) + '"></div>';
      h += '<div class="wz-row"><span>أيام الإجازة (اختياري):</span>' + [6, 0, 1, 2, 3, 4, 5].map(function (d) { return '<button type="button" class="chip' + (W.off.indexOf(d) >= 0 ? ' on' : '') + '" data-w="off" data-v="' + d + '">' + WD[d] + '</button>'; }).join('') + '</div>';
      h += '<div class="wz-sum">' + sm.html + '</div>';
    }
    h += '<div class="wz-nav">' + (W.step > (CAT.tracks.length === 1 ? 2 : 1) ? '<button type="button" class="btn btn-soft" data-w="back">→ رجوع</button>' : '<span></span>') + (W.step === 3 ? '<button type="button" class="btn btn-navy" data-w="next"' + (selectedUnits().length ? '' : ' disabled') + '>التالي ←</button>' : W.step === 4 ? '<button type="button" class="btn btn-gold" data-w="save"' + (summary().ok ? '' : ' disabled') + '>ابدأ خطتي</button>' : '') + '</div>';
    if (PLAN) h += '<p class="m" style="margin-top:10px"><button type="button" class="lnk" data-w="cancel">إلغاء والرجوع لخطتي الحالية</button></p>';
    return h + '</section>';
  }
  function selectedUnits() { return unitsOf(null, W.subj, wSrcs(), W.excl); }
  function summary() {
    var u = selectedUnits(), q = u.reduce(function (t, x) { return t + x.u.q; }, 0), tk = dk(today());
    if (!W.exam) return { ok: false, html: 'اختر موعد اختبارك لنحسب لك الجدول.' };
    if (W.exam <= tk) return { ok: false, html: 'اختر تاريخًا بعد اليوم.' };
    var days = studyDays(tk, W.exam, W.off).length;
    if (!days) return { ok: false, html: 'لا توجد أيام دراسة قبل الموعد. قلّل أيام الإجازة أو أبعد الموعد.' };
    var per = Math.ceil(q / days), uPer = (u.length / days), dm = CAT.dailyMax || 120;
    var h = '<b>' + AR(u.length) + '</b> وحدة، <b>' + AR(q) + '</b> سؤالًا، خلال <b>' + AR(days) + '</b> يوم دراسة.<br>';
    if (W.mode === 'prio' && W.goal === 'tajm') {
      var cap = dm * days; h += q > cap ? 'حسب الأولوية: تدخل الخطة ما يقارب <b>' + AR(cap) + '</b> سؤالًا (حوالي ' + AR(dm) + ' يوميًا) بالأهم أولًا، والباقي يظهر لك في «لو خلّصت بدري».' : 'الوقت يكفي لكل المحتوى: حوالي <b>' + AR(per) + '</b> سؤالًا يوميًا.';
    } else {
      h += 'يعني حوالي <b>' + AR(per) + '</b> سؤالًا يوميًا (' + (uPer < 1 ? 'وحدة كل ' + AR(Math.round(1 / uPer)) + ' أيام تقريبًا' : 'من ' + AR(Math.max(1, Math.floor(uPer))) + ' إلى ' + AR(Math.ceil(uPer) + 1) + ' وحدات حسب حجمها') + ').';
      if (per > dm) h += '<br><span class="wz-warn">العدد كبير على يوم واحد. جرّب موعدًا أبعد، أو قلّل المحتوى' + (W.goal === 'tajm' ? '، أو اختر «حسب الأولوية»' : '') + '.</span>';
    }
    return { ok: true, html: h };
  }
  function saveWizard() {
    var t = T(), tk = dk(today());
    savePlan({ v: 2, track: t.id, trackTitle: t.title, goal: W.goal, subj: W.subj.slice(), mode: W.goal === 'tajm' ? W.mode : 'all', srcs: wSrcs(), excl: JSON.parse(JSON.stringify(W.excl)), exam: W.exam, start: tk, off: W.off.slice(), done: {} });
    W = null; OPEN = {}; draw(); window.scrollTo(0, 0);
  }

  // ===== الأحداث =====
  app.addEventListener('toggle', function (e) { var d = e.target; if (d && d.getAttribute && d.getAttribute('data-open')) OPEN[d.getAttribute('data-open')] = d.open; }, true);
  app.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go],[data-p],[data-w]'); if (!b || b.disabled) return;
    if (b.hasAttribute('data-go')) { var g = b.getAttribute('data-go').split('|'); return go(g[0], g[1]); }
    var p = b.getAttribute('data-p');
    if (p === 'retry') return load();
    if (p === 'change') { startWizard(); return draw(); }
    if (p === 'rebase') { var sc = schedule(PLAN), done = sc.all.filter(function (x) { return status(x.src, x.u).done; }).map(function (x) { return x.key; }); PLAN.rebase = { date: dk(today()), skip: done }; savePlan(PLAN); return draw(); }
    var w = b.getAttribute('data-w'), v = b.getAttribute('data-v');
    if (!w) return;
    if (w === 'track') { W.track = v; W.step = 2; }
    else if (w === 'goal') { W.goal = v; W.excl = {}; W.mode = 'all'; W.step = 3; var t = T(), pl = (get('bw-place-v1', []) || []).slice(-1)[0]; if (t && t.subjects && pl && W.goal !== 'all') { var th = CAT.threshold || 75, want = W.goal === 'tajm' ? function (x) { return x >= th; } : function (x) { return x < th; }, s = ['q', 'v'].filter(function (k) { return want(k === 'q' ? pl.k : pl.v); }); W.subj = s.length ? s : ['q', 'v']; } else W.subj = ['q', 'v']; }
    else if (w === 'subj') W.subj = v === 'qv' ? ['q', 'v'] : [v];
    else if (w === 'mode') W.mode = v;
    else if (w === 'off') { var d = +v, i = W.off.indexOf(d); if (i >= 0) W.off.splice(i, 1); else if (W.off.length < 5) W.off.push(d); }
    else if (w === 'back') W.step = Math.max(1, W.step - 1);
    else if (w === 'next') W.step = 4;
    else if (w === 'save') return saveWizard();
    else if (w === 'cancel') W = null;
    draw();
  });
  app.addEventListener('change', function (e) {
    var c = e.target;
    if (c.hasAttribute('data-done')) { PLAN.done = PLAN.done || {}; PLAN.done[c.getAttribute('data-done')] = c.checked; savePlan(PLAN); return draw(); }
    if (c.id === 'wzExam') { W.exam = c.value; return draw(); }
    if (c.hasAttribute('data-all')) { var id = c.getAttribute('data-all'); W.excl[id] = c.checked ? [] : CAT.sources[id].units.map(function (u) { return u.id; }); return draw(); }
    if (c.hasAttribute('data-u')) { var a = c.getAttribute('data-u').split('|'), L = W.excl[a[0]] = W.excl[a[0]] || [], k = L.indexOf(a[1]); if (c.checked && k >= 0) L.splice(k, 1); else if (!c.checked && k < 0) L.push(a[1]); return draw(); }
  });
  // الرجوع للخطة من صفحة اختبار: تُقرأ النتائج من جديد
  addEventListener('pageshow', function (e) { if (e.persisted) location.reload(); });
  addEventListener('storage', function () { if (CAT && !W) draw(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && CAT && !W) draw(); });
  load();
})();
