// الشريط العلوي الموحد لصفحات الاختبارات: ينقل أدوات الصفحة (المؤقت، الأسئلة الخاطئة) إليه،
// ويضيف زر «إبلاغ عن خطأ» الذي يرسل رقم السؤال الحالي للمعلم.
(function () {
  var sh = document.getElementById('bw-shell'); if (!sh) return;
  var tools = sh.querySelector('.bws-tools');
  var hr = document.querySelector('header.top .hr');
  if (hr && tools) { while (hr.firstChild) tools.appendChild(hr.firstChild); }

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
        var card = document.createElement('div'); card.className = 'card bw-plan noprint';
        card.innerHTML = '<h3>خطة علاجك بعد هذا الاختبار</h3><ul class="bw-plan-list">' + items.join('') + '</ul>'
          + (weak.length ? '<div class="bw-plan-weak">' + weak.map(function (w) { return '<div class="bw-plan-row"><span>' + esc(SN[w.id] || 'القسم ' + w.id) + '</span><b>' + AR(w.c) + ' / ' + AR(w.t) + '</b><button class="btn soft sm" type="button" data-bwre="' + w.id + '">أعد التدريب على هذا القسم</button></div>'; }).join('') + '</div>' : '')
          + '<div class="row" style="margin-top:10px"><a class="btn ghost sm" href="/progress.html">شوف تقدمك وخطوتك التالية</a></div>';
        resEl.insertBefore(card, resEl.children[1] || null);
        card.addEventListener('click', function (e) { var b = e.target.closest('[data-bwre]'); if (!b) return; try { var sc = g('setChosen'), st = g('start'); if (sc) sc([+b.dataset.bwre]); if (st) st(); } catch (err) { } });
      } catch (e) { }
    }).observe(resEl, { childList: true });
  }

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
