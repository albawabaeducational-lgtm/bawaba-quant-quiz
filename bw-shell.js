// الشريط العلوي الموحد لصفحات الاختبارات: ينقل أدوات الصفحة (المؤقت، الأسئلة الخاطئة) إليه،
// ويضيف زر «إبلاغ عن خطأ» الذي يرسل رقم السؤال الحالي للمعلم.
(function () {
  var sh = document.getElementById('bw-shell'); if (!sh) return;
  var tools = sh.querySelector('.bws-tools');
  var hr = document.querySelector('header.top .hr');
  if (hr && tools) { while (hr.firstChild) tools.appendChild(hr.firstChild); }

  // رابط ثابت للعودة إلى منصة الدورات
  var back = sh.querySelector('.bws-back');
  if (back && !sh.querySelector('.bws-lms')) { var lms = document.createElement('a'); lms.className = 'bws-lms'; lms.href = 'https://albawaba-edu.com/e/'; lms.target = '_blank'; lms.rel = 'noopener'; lms.title = 'منصة الدورات'; lms.innerHTML = '🎓<span> منصة الدورات</span>'; sh.insertBefore(lms, back); }
  // أدوات سهولة القراءة: تكبير الخط، خط أوضح، تباين أعلى، إيقاف الحركة (تُحفظ لهذا الجهاز)
  (function () {
    var KEY = 'bw-a11y', H = document.documentElement, O = {};
    try { O = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { }
    var apply = function () { H.classList.remove('bwa-z1', 'bwa-z2'); if (O.z) H.classList.add('bwa-z' + O.z); H.classList.toggle('bwa-rf', !!O.rf); H.classList.toggle('bwa-hc', !!O.hc); H.classList.toggle('bwa-nm', !!O.nm); };
    var save = function () { try { localStorage.setItem(KEY, JSON.stringify(O)); } catch (e) { } apply(); draw(); };
    apply();
    var b = document.createElement('button'); b.type = 'button'; b.className = 'bws-a11y'; b.title = 'سهولة القراءة'; b.setAttribute('aria-haspopup', 'true'); b.setAttribute('aria-expanded', 'false'); b.innerHTML = 'Aa';
    var tl = sh.querySelector('.bws-tools'); sh.insertBefore(b, tl ? tl.nextSibling : sh.querySelector('.bws-back'));
    var pn = document.createElement('div'); pn.className = 'bws-a11yp'; pn.hidden = true; pn.setAttribute('role', 'dialog'); pn.setAttribute('aria-label', 'سهولة القراءة'); document.body.appendChild(pn);
    var row = function (k, t, on) { return '<button type="button" data-a="' + k + '" aria-pressed="' + (on ? 'true' : 'false') + '"' + (on ? ' class="on"' : '') + '>' + t + '</button>'; };
    function draw() { pn.innerHTML = '<b>سهولة القراءة</b><div class="g3">' + row('z0', 'خط عادي', !O.z) + row('z1', 'أكبر', O.z === 1) + row('z2', 'أكبر جدًا', O.z === 2) + '</div>' + row('rf', 'خط أوضح ومسافات أوسع', O.rf) + row('hc', 'تباين أعلى', O.hc) + row('nm', 'إيقاف الحركة', O.nm) + '<button type="button" data-a="x" class="x">إغلاق</button>'; }
    draw();
    b.onclick = function () { pn.hidden = !pn.hidden; b.setAttribute('aria-expanded', pn.hidden ? 'false' : 'true'); };
    pn.addEventListener('click', function (e) { var t = e.target.closest('[data-a]'); if (!t) return; var a = t.getAttribute('data-a');
      if (a === 'x') { pn.hidden = true; b.setAttribute('aria-expanded', 'false'); return; }
      if (a[0] === 'z' && a.length === 2) O.z = +a[1] || 0; else O[a] = !O[a]; save(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pn.hidden) { pn.hidden = true; b.focus(); } });
  })();

  var slug = ''; try { slug = decodeURIComponent(location.pathname).replace(/^\//, '').replace(/(\.html)+$/, ''); } catch (e) { }
  var COURSES = ['aksam kamy', 'aksam lafzi', 'muhaky mohawsab', 'muhaky warky1', 'muhaky warky2', 'tasis lafzi'];
  if (COURSES.indexOf(slug) < 0) return;
  // فتح «الأسئلة الخاطئة» مباشرة من صفحة «تقدمي»
  if (location.hash === '#errors') addEventListener('load', function () { setTimeout(function () { var b = document.getElementById('errBtn'); if (b) b.click(); }, 150); });
  function g(n) { try { return eval('typeof ' + n + '!=="undefined"?' + n + ':undefined'); } catch (e) { return undefined; } }
  // يحدد السؤال المعروض الآن (إن وُجد) حسب نوع الصفحة
  function ctx() {
    var linked = slug === 'muhaky mohawsab';
    try {
      var SM = g('SM'), curQ = g('curQ');
      if (SM && SM.live && typeof curQ === 'function') { var x = curQ(); if (x && x.q) return x.q.qn ? { course: 'aksam kamy', qkey: String(x.q.n) } : { course: linked ? 'aksam lafzi' : slug, qkey: String(x.q.id) }; }
      var run = g('run'), pos = g('pos');
      if (g('live') && run && run[pos]) { var q = run[pos]; return q.qn ? { course: 'aksam kamy', qkey: String(q.n) } : { course: linked ? 'aksam lafzi' : slug, qkey: String(q.id) }; }
      var st = g('st');
      if (st && st.qs && st.qs[st.i]) { var k = window.__bwRawKeys, id = st.qs[st.i].id; return { course: slug, qkey: k && k[id] !== undefined ? String(k[id]) : String(id) }; }
      var S = g('S');
      if (S && S.q && S.phase && S.phase !== 'idle') return { course: slug, qkey: String(S.q) };
    } catch (e) { }
    return { course: linked ? '' : slug, qkey: '' };
  }
  // خطة علاج بعد كل اختبار في صفحات الأقسام: ماذا تراجع الآن، وما الخطوة التالية
  var resEl = document.getElementById('result');
  if (resEl && g('run') !== undefined && g('ans') !== undefined) {
    var AR = function (n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); };
    var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    new MutationObserver(function () {
      if (!resEl.firstElementChild || resEl.querySelector('.bw-plan')) return;
      try {
        var run = g('run'), ans = g('ans'), t0 = g('study') ? 0 : g('t0'), DBx = g('DB'), SN = {}; ((DBx && DBx.secs) || []).forEach(function (s) { SN[s.id] = s.name; }); if (!run || !run.length) return;
        var by = {}, na = 0, ok = 0;
        run.forEach(function (q) { var b = by[q.sectionId] || (by[q.sectionId] = { t: 0, c: 0 }); b.t++; if (ans[q.id] === q.correct) { b.c++; ok++; } if (ans[q.id] === undefined) na++; });
        var weak = Object.keys(by).map(function (k) { return { id: +k, t: by[k].t, c: by[k].c, p: by[k].c / by[k].t }; }).filter(function (x) { return x.p < .7; }).sort(function (a, b) { return a.p - b.p; }).slice(0, 4);
        var avg = t0 ? Math.round((Date.now() - t0) / 1000 / run.length) : 0, items = [];
        if (ok < run.length) items.push('<li><b>راجع أخطاءك الآن وهي حاضرة في ذهنك.</b> أفضل وقت لمراجعة الخطأ مباشرة بعد الاختبار، ثم بعد يوم، ثم بعد أسبوع.</li>');
        if (na) items.push('<li><b>تركت ' + (na === 1 ? 'سؤالًا واحدًا' : na === 2 ? 'سؤالين' : AR(na) + (na <= 10 ? ' أسئلة' : ' سؤالًا')) + ' بدون إجابة.</b> في الاختبار الحقيقي لا يوجد خصم للخطأ، فلا تترك سؤالًا فارغًا.</li>');
        if (avg > 80) items.push('<li><b>متوسط وقتك ' + AR(avg) + ' ثانية للسؤال.</b> زمن الاختبار الحقيقي قريب من دقيقة للسؤال؛ درّب نفسك بمؤقت أقصر.</li>');
        else if (avg && avg < 25 && ok / run.length < .6) items.push('<li><b>إجاباتك سريعة جدًا (' + AR(avg) + ' ثانية) ودقتك منخفضة.</b> تمهّل واقرأ السؤال كاملًا قبل الاختيار.</li>');
        if (!items.length) items.push('<li><b>أداء ممتاز في هذا الاختبار.</b> انتقل لأقسام جديدة أو اختبر نفسك في المحاكي المحوسب.</li>');
        try { var SS = g('SSK'), HH = SS ? (JSON.parse(localStorage.getItem(SS) || '{}').h || []) : []; if (HH.length >= 2) { var c1 = HH[HH.length - 1], c0 = HH[HH.length - 2], p1 = c1.n ? Math.round(c1.g / c1.n * 100) : 0, p0 = c0.n ? Math.round(c0.g / c0.n * 100) : 0, df = p1 - p0; items.unshift('<li><b>مقارنة بمحاولتك السابقة: ' + AR(p0) + '٪ ← ' + AR(p1) + '٪' + (df > 0 ? ' (+' + AR(df) + ')' : df < 0 ? ' (−' + AR(-df) + ')' : ' (نفس المستوى)') + '.</b> ' + (df > 0 ? 'استمر بنفس الطريقة.' : df < 0 ? 'لا تقلق، راجع أخطاء هذه المحاولة ثم أعد القسم نفسه.' : 'ركّز على الأقسام الأضعف بالأسفل لتتقدم.') + '</li>'); } } catch (e) { }
        var card = document.createElement('div'); card.className = 'card bw-plan noprint';
        card.innerHTML = '<h3>خطة علاجك بعد هذا الاختبار</h3><ul class="bw-plan-list">' + items.join('') + '</ul>'
          + (weak.length ? '<div class="bw-plan-weak">' + weak.map(function (w) { return '<div class="bw-plan-row"><span>' + esc(SN[w.id] || 'القسم ' + w.id) + '</span><b>' + AR(w.c) + ' / ' + AR(w.t) + '</b><button class="btn soft sm" type="button" data-bwre="' + w.id + '">أعد التدريب على هذا القسم</button></div>'; }).join('') + '</div>' : '')
          + '<div class="row" style="margin-top:10px"><a class="btn ghost sm" href="/progress.html">شوف تقدمك وخطوتك التالية</a></div>';
        resEl.insertBefore(card, resEl.children[1] || null);
        card.addEventListener('click', function (e) { var b = e.target.closest('[data-bwre]'); if (!b) return; try { var sc = g('setChosen'), st = g('start'); if (sc) sc([+b.dataset.bwre]); if (st) st(); } catch (err) { } });
      } catch (e) { }
    }).observe(resEl, { childList: true });
  }

  // المراجعة على مراحل: السؤال لا يخرج من مجلد الأخطاء من أول إجابة صحيحة؛ يعود بعد ٣ أيام ثم بعد أسبوع،
  // ويخرج بعد إجابته صحيحًا ٣ مرات. الحذف اليدوي من المجلد يعمل كما هو.
  var STK = g('ST'), skipKeep = false;
  if (STK && g('run') !== undefined) {
    var origSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (this === window.localStorage && k === STK && !skipKeep) {
        try {
          var old = JSON.parse(localStorage.getItem(STK) || '{}') || {}, nw = JSON.parse(v) || {}, run = g('run') || [], ans = g('ans') || {}, ch = false;
          run.forEach(function (q) { var o = old[q.id]; if (o && !nw[q.id] && ans[q.id] === q.correct && (o.ok || 0) < 2) { var r = {}; for (var z in o) r[z] = o[z]; r.ok = (o.ok || 0) + 1; r.date = new Date().toISOString(); nw[q.id] = r; ch = true; } });
          if (ch) { v = JSON.stringify(nw); var nn = Object.keys(nw).length; setTimeout(function () { [].forEach.call(document.querySelectorAll('.ecn'), function (e) { e.textContent = nn; }); }, 0); }
        } catch (e) { }
      }
      return origSet.call(this, k, v);
    };
  }
  var REV = [1, 3, 7];

  // مجلد الأخطاء: سبب كل خطأ (لم أفهم / تسرّعت / حساب أو قراءة / خمّنت / ضاق الوقت) + ملخص ونصيحة + تصفية حسب السبب
  var errBox = document.getElementById('errors');
  if (errBox) {
    var WHY = [['u', 'لم أفهم الفكرة', 'راجع شرح المهارة أولًا، ثم أعد هذه الأسئلة بتصحيح فوري.'], ['r', 'تسرّعت', 'تمهّل: اقرأ السؤال وكل الخيارات قبل أن تختار.'], ['c', 'خطأ حساب أو قراءة', 'اكتب خطوات الحل على ورقة وراجعها قبل الاختيار.'], ['g', 'خمّنت', 'هذه مهارة لم تثبت بعد؛ تدرّب على قسمها بتصحيح فوري.'], ['t', 'ضاق الوقت', 'تدرّب بمؤقت أقصر تدريجيًا لتعتاد سرعة الاختبار.']];
    var WN = {}; WHY.forEach(function (w) { WN[w[0]] = w; });
    var WK = 'bw-why-v1', wf = '';
    var wget = function () { try { return JSON.parse(localStorage.getItem(WK) || '{}') || {}; } catch (e) { return {}; } };
    var wput = function (o) { try { localStorage.setItem(WK, JSON.stringify(o)); } catch (e) { } };
    var decorate = function () {
      var cards = errBox.querySelectorAll('article.qcard'); if (!cards.length) return;
      var all = wget(), W = all[slug] || {}, cnt = {}, none = 0;
      [].forEach.call(cards, function (c) {
        var d = c.querySelector('[data-d]'); if (!d) return; var id = d.getAttribute('data-d'), r = W[id];
        if (!c.querySelector('.bw-why')) {
          var box = document.createElement('div'); box.className = 'bw-why noprint'; box.setAttribute('data-id', id);
          box.innerHTML = '<span>لماذا أخطأت؟</span>' + WHY.map(function (w) { return '<button type="button" data-why="' + w[0] + '">' + w[1] + '</button>'; }).join('');
          c.appendChild(box);
        }
        [].forEach.call(c.querySelectorAll('[data-why]'), function (b) { b.classList.toggle('on', b.getAttribute('data-why') === r); b.setAttribute('aria-pressed', b.getAttribute('data-why') === r ? 'true' : 'false'); });
        if (r) cnt[r] = (cnt[r] || 0) + 1; else none++;
        try { var EE = JSON.parse(localStorage.getItem(STK) || '{}')[id]; if (EE && EE.ok && !c.querySelector('.bw-stage')) { var days = REV[EE.ok] || 7, due = new Date(EE.date).getTime() + days * 864e5, left = Math.ceil((due - Date.now()) / 864e5), st2 = document.createElement('div'); st2.className = 'bw-stage'; st2.textContent = '✓ أجبت عنه صحيحًا ' + (EE.ok === 1 ? 'مرة' : 'مرتين') + ' من ٣ — ' + (left > 0 ? 'يعود للمراجعة بعد ' + (left === 1 ? 'يوم' : left === 2 ? 'يومين' : left + ' أيام') : 'جاهز للمراجعة الآن'); c.insertBefore(st2, c.querySelector('.bw-why')); } } catch (e) { }
        c.style.display = !wf || wf === (r || '-') ? '' : 'none';
      });
      var sum = errBox.querySelector('.bw-whysum');
      if (!sum) { sum = document.createElement('div'); sum.className = 'bw-whysum noprint'; var first = errBox.querySelector('article.qcard'); first.parentNode.insertBefore(sum, first); }
      var top = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0];
      sum.innerHTML = '<b>أسباب أخطائك</b><div class="bw-whychips"><button type="button" data-wf=""' + (wf ? '' : ' class="on"') + '>الكل (' + cards.length + ')</button>' + WHY.filter(function (w) { return cnt[w[0]]; }).map(function (w) { return '<button type="button" data-wf="' + w[0] + '"' + (wf === w[0] ? ' class="on"' : '') + '>' + w[1] + ' (' + cnt[w[0]] + ')</button>'; }).join('') + (none ? '<button type="button" data-wf="-"' + (wf === '-' ? ' class="on"' : '') + '>بدون سبب (' + none + ')</button>' : '') + '</div>'
        + '<p>' + (top ? 'أكثر سبب لأخطائك: <b>' + WN[top][1] + '</b> — ' + WN[top][2] : 'حدّد سبب كل خطأ تحت السؤال؛ ستعرف ما تحتاج تحسينه فعلًا: الفهم أم التركيز أم السرعة.') + '</p>';
    };
    errBox.addEventListener('click', function (e) { if (e.target.closest('[data-d],#cl')) { skipKeep = true; setTimeout(function () { skipKeep = false; }, 0); } }, true);
    errBox.addEventListener('click', function (e) {
      var b = e.target.closest('[data-why],[data-wf]'); if (!b) return;
      e.stopPropagation();
      if (b.hasAttribute('data-wf')) { wf = b.getAttribute('data-wf'); return decorate(); }
      var id = b.closest('.bw-why').getAttribute('data-id'), r = b.getAttribute('data-why'), all = wget(), W = all[slug] || (all[slug] = {});
      if (W[id] === r) delete W[id]; else W[id] = r; wput(all); decorate();
    }, true);
    new MutationObserver(function () {
      // النص القديم «محفوظ على هذا المتصفح» لا يناسب الطالب المسجّل (تقدمه محفوظ في حسابه)
      if (window.__bwSid) [].forEach.call(errBox.querySelectorAll('.sub'), function (p) { if (/المتصفح/.test(p.textContent)) p.textContent = p.textContent.replace(/محفوظًا على هذا (الجهاز و)?المتصفح\.?.*$/, 'محفوظًا في حسابك ويظهر على أي جهاز تدخل منه.'); });
      if (errBox.querySelector('article.qcard') && !errBox.querySelector('.bw-whysum')) { wf = ''; decorate(); }
    }).observe(errBox, { childList: true });
  }

  // إعلان الوقت المتبقي لقارئ الشاشة ولمن لا ينتبه للون: «تبقى خمس دقائق» و«تبقى دقيقة واحدة»
  (function () {
    var live = document.createElement('div'); live.className = 'bws-live'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'assertive'); document.body.appendChild(live);
    var secs = function (t) { var m = String(t || '').replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).match(/(?:(\d+):)?(\d+):(\d{2})/); return m ? (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) : -1; };
    var prev = {}, said = {};
    var say = function (msg) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 50); live.classList.add('on'); clearTimeout(live._t); live._t = setTimeout(function () { live.classList.remove('on'); }, 4000); };
    setInterval(function () {
      document.querySelectorAll('#timer, .timer').forEach(function (el, i) {
        if (!el.offsetParent) return;
        var v = secs(el.textContent), k = el.id || ('t' + i), p = prev[k]; prev[k] = v; if (v < 0 || p === undefined || p < 0) return;
        if (v > p) { said[k] = {}; return; } // مؤقت جديد أو تصاعدي
        var S = said[k] || (said[k] = {});
        if (p > 300 && v <= 300 && v > 240 && !S[5]) { S[5] = 1; say('تبقى خمس دقائق'); }
        if (p > 60 && v <= 60 && v > 30 && !S[1]) { S[1] = 1; say('تبقى دقيقة واحدة'); }
      });
    }, 1000);
  })();

  var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'bws-report'; btn.title = 'إبلاغ عن خطأ في السؤال'; btn.innerHTML = '⚑<span> إبلاغ عن خطأ</span>';
  sh.insertBefore(btn, sh.querySelector('.bws-back'));
  btn.onclick = function () {
    var c = ctx(), o = document.createElement('div'); o.className = 'bws-ov';
    o.innerHTML = '<form class="bws-dlg"><h3>إبلاغ عن خطأ</h3><p class="bws-q"></p><label>نوع المشكلة<select name="reason"><option value="answer">الإجابة الصحيحة خطأ</option><option value="text">خطأ في نص السؤال أو الاختيارات</option><option value="image">الصورة غير واضحة</option><option value="other">مشكلة أخرى</option></select></label><label>اشرح باختصار<textarea name="note" maxlength="600" rows="3" placeholder="مثال: الإجابة الصحيحة هي (ج) وليست (ب)"></textarea></label><p class="bws-msg" role="status"></p><div class="bws-acts"><button type="submit">إرسال البلاغ</button><button type="button" class="bws-x">إلغاء</button></div></form>';
    document.body.appendChild(o);
    var f = o.querySelector('form'), msg = o.querySelector('.bws-msg');
    o.querySelector('.bws-q').textContent = c.qkey ? 'سيُرسل البلاغ عن السؤال المعروض الآن، وسيصل للمعلم مباشرة.' : (c.course ? 'افتح السؤال الذي فيه المشكلة ثم اضغط الزر ليُحدَّد تلقائيًا، أو اكتب رقمه في الشرح.' : 'افتح السؤال الذي فيه المشكلة أثناء الحل ثم اضغط الزر.');
    var close = function () { o.remove(); };
    o.querySelector('.bws-x').onclick = close; o.addEventListener('mousedown', function (e) { if (e.target === o) close(); });
    f.onsubmit = function (e) {
      e.preventDefault();
      if (!c.course) { msg.textContent = 'افتح السؤال أولًا.'; return; }
      var note = f.note.value.trim(); if (!c.qkey && !note) { msg.textContent = 'اكتب رقم السؤال ووصف المشكلة.'; return; }
      f.querySelector('[type=submit]').disabled = true; msg.textContent = 'جارٍ الإرسال…';
      fetch('/api/report', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ course: c.course, qkey: c.qkey, reason: f.reason.value, note: note }) })
        .then(function (r) { return r.json().then(function (d) { return [r.ok, d]; }); })
        .then(function (x) { if (x[0]) { msg.textContent = 'وصل بلاغك، شكرًا لك ✓'; setTimeout(close, 1400); } else { msg.textContent = x[1].error || 'تعذّر الإرسال'; f.querySelector('[type=submit]').disabled = false; } })
        .catch(function () { msg.textContent = 'تعذّر الاتصال، حاول مرة أخرى'; f.querySelector('[type=submit]').disabled = false; });
    };
  };
})();

// شطب الاختيارات (كالاختبار الحقيقي): كليك يمين على الكمبيوتر أو ضغطة مطوّلة على الجوال تشطب الاختيار
// المستبعد ولا تختاره. الشطب يُحفظ لكل سؤال طوال الجلسة ويرجع عند العودة للسؤال.
(function () {
  if (!document.getElementById('bw-shell')) return;
  var SEL = '.opts > button, .opts > .opt, .opts > label';
  var KEY = 'bw-strike', M = {}; try { M = JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) { }
  var save = function () { try { sessionStorage.setItem(KEY, JSON.stringify(M)); } catch (e) { } };
  var st = document.createElement('style');
  st.textContent = '.bw-x{opacity:.42!important;text-decoration:line-through!important;text-decoration-thickness:2px!important;filter:grayscale(1)}.bw-x *{text-decoration:line-through}.bw-xhint{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:99999;background:#0c2440;color:#fff;border-radius:12px;padding:9px 16px;font:600 13.5px/1.6 inherit;box-shadow:0 8px 24px #0004;max-width:92vw;text-align:center}';
  document.head.appendChild(st);
  function sig(btn) {
    var box = btn.closest('.exam, .qcard, .card, main') || document.body, q = box.querySelector('.qbody, .stem, .qimg, .q, h2');
    var s = q ? (q.innerHTML || '').slice(0, 400) : location.pathname, h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return location.pathname + '#' + h;
  }
  function idx(btn) { return [].indexOf.call(btn.parentNode.querySelectorAll(':scope > button, :scope > .opt, :scope > label'), btn); }
  function toggle(btn) {
    var k = sig(btn), i = idx(btn), a = M[k] || [], p = a.indexOf(i);
    if (p >= 0) a.splice(p, 1); else a.push(i);
    if (a.length) M[k] = a; else delete M[k];
    btn.classList.toggle('bw-x', p < 0); save();
    try { if (!localStorage.getItem('bw-xh')) { localStorage.setItem('bw-xh', '1'); } } catch (e) { }
  }
  function apply() {
    var seen = {};
    [].forEach.call(document.querySelectorAll('.opts'), function (o) {
      var b = o.querySelector(':scope > button, :scope > .opt, :scope > label'); if (!b) return;
      var k = sig(b); if (seen[k]) return; seen[k] = 1;
      var a = M[k] || [];
      [].forEach.call(o.querySelectorAll(':scope > button, :scope > .opt, :scope > label'), function (x, i) { x.classList.toggle('bw-x', a.indexOf(i) >= 0); });
    });
  }
  document.addEventListener('contextmenu', function (e) {
    var b = e.target.closest && e.target.closest(SEL); if (!b || b.disabled) return;
    e.preventDefault(); toggle(b);
  }, true);
  // الجوال: ضغطة مطوّلة نصف ثانية
  var tm = null, lp = false;
  document.addEventListener('touchstart', function (e) {
    var b = e.target.closest && e.target.closest(SEL); if (!b || b.disabled) return;
    lp = false; clearTimeout(tm); tm = setTimeout(function () { lp = true; toggle(b); if (navigator.vibrate) try { navigator.vibrate(20); } catch (x) { } }, 520);
  }, { passive: true });
  ['touchend', 'touchmove', 'touchcancel'].forEach(function (ev) { document.addEventListener(ev, function () { clearTimeout(tm); }, { passive: true }); });
  document.addEventListener('click', function (e) { if (lp) { lp = false; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  var pend = 0; new MutationObserver(function () { if (pend) return; pend = 1; requestAnimationFrame(function () { pend = 0; apply(); }); }).observe(document.body, { childList: true, subtree: true });
  // تلميح مرة واحدة أول ما تظهر اختيارات
  var hinted = false; try { hinted = !!localStorage.getItem('bw-xh'); } catch (e) { }
  if (!hinted) {
    var hw = new MutationObserver(function () {
      if (!document.querySelector('.opts > button, .opts > .opt')) return;
      hw.disconnect(); try { localStorage.setItem('bw-xh', '1'); } catch (e) { }
      var t = document.createElement('div'); t.className = 'bw-xhint';
      t.textContent = '💡 لشطب اختيار تستبعده: ' + (('ontouchstart' in window) ? 'اضغط عليه ضغطة مطوّلة' : 'كليك يمين عليه') + '. ونفس الطريقة تلغي الشطب.';
      document.body.appendChild(t); setTimeout(function () { t.remove(); }, 6000);
    });
    hw.observe(document.body, { childList: true, subtree: true });
  }
})();
