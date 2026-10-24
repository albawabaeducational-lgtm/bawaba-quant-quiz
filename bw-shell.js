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
