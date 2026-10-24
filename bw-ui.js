// شريط العد العكسي (التجربة المجانية أو الاشتراك) + زر الاستراحة + تنبيه حماية التجربة + واتساب عائم.
// يظهر في الصفحات الرئيسية والإعدادات والنتائج، ويختفي أثناء أداء الاختبار فقط.
(function () {
  var C = window.__bw || {};
  var P = decodeURIComponent(location.pathname).replace(/^\//, '').replace(/(\.html)+$/, '');
  var hub = P === '' || P === 'index' || P === 'waraqi' || !!document.querySelector('meta[name="bw-hub"]');
  // المشترك المسجّل لا يرى شريط الاشتراك إلا في آخر ٣ أيام (تذكير بالتجديد)؛ شريط التجربة المجانية يظهر للزوار كما هو
  var TRIAL = !!C.trialEnd, SUB = !!C.subEnd && C.subEnd - Date.now() < 3 * 864e5;
  var st = document.createElement('style');
  st.textContent = '.bwb{direction:rtl;font-family:Cairo,Tahoma,Arial,sans-serif;color:#fff;background:linear-gradient(90deg,#12345a,#1769aa);position:relative;z-index:50}.bwb.w{background:linear-gradient(90deg,#7a4b00,#c98a00)}.bwb.d{background:linear-gradient(90deg,#8e2b2b,#c0392b)}'
    + '.bwb .in{max-width:1100px;margin:auto;padding:10px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.bwb .ic{font-size:26px}.bwb .tx{flex:1;min-width:200px;line-height:1.5}.bwb .tx b{display:block;font-size:15px}.bwb .tx span{font-size:13px;opacity:.95}'
    + '.bwb .bt{background:#fff;color:#12345a;font:700 14px Cairo,Tahoma,Arial,sans-serif;padding:8px 16px;border-radius:99px;text-decoration:none;white-space:nowrap;border:0;cursor:pointer}.bwb .bt.g{background:transparent;color:#fff;border:1.5px solid #ffffff99}'
    + '.bwb .wr{background:#5c1414;color:#fff;font-size:13px;padding:8px 14px;text-align:center;line-height:1.6}.bwb .pg{height:4px;background:#ffffff33}.bwb .pg i{display:block;height:100%;background:#fff;border-radius:0 4px 4px 0;transition:width .6s}'
    + '.bwb.c .in{padding:6px 12px;gap:8px}.bwb.c .ic{font-size:18px}.bwb.c .tx{min-width:0}.bwb.c .tx b{display:inline;font-size:13px}.bwb.c .tx span{font-size:12.5px}.bwb.c .bt{padding:4px 12px;font-size:12.5px}.bwb.c .wr{font-size:12px;padding:5px 10px}.bwb.c .pg{height:3px}'
    + '.bwwa{position:fixed;left:16px;bottom:16px;z-index:2147483000;display:flex;align-items:center;gap:8px;background:#25d366;color:#fff;text-decoration:none;border-radius:99px;padding:0 18px 0 6px;height:56px;box-shadow:0 6px 20px #0004;font:700 14px Cairo,Tahoma,Arial,sans-serif;direction:rtl}'
    + '.bwwa svg{width:44px;height:44px;fill:#fff;padding:7px}.bwwa.s{padding:0;width:46px;height:46px;justify-content:center;left:12px;bottom:12px;opacity:.92}.bwwa.s span{display:none}.bwwa.s svg{width:34px;height:34px}.bwwa:hover{filter:brightness(1.05)}@media(max-width:600px){.bwwa{padding:0;width:56px;justify-content:center}.bwwa span{display:none}.bwwa svg{width:40px;height:40px}}'
    + '.bwm{position:fixed;inset:0;background:#0009;z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:16px;direction:rtl;font-family:Cairo,Tahoma,Arial,sans-serif}.bwm>div{background:#fff;color:#1d2b3a;border-radius:18px;padding:22px;max-width:400px;width:100%;box-shadow:0 20px 50px #0006;line-height:1.7}.bwm h3{margin:0 0 8px;color:#12345a;font-size:19px}.bwm p{margin:0 0 12px;font-size:14px;color:#44546a}'
    + '.bwm select{width:100%;padding:10px;border:2px solid #cfdde8;border-radius:10px;font:inherit;margin-bottom:12px}.bwm .r{display:flex;gap:8px}.bwm button{flex:1;padding:11px;border:0;border-radius:12px;font:700 15px Cairo,Tahoma,Arial,sans-serif;cursor:pointer;background:#12345a;color:#fff}.bwm button.g{background:#e3ebf3;color:#12345a}.bwm .e{color:#c0392b;font-size:13px;min-height:18px}';
  document.head.appendChild(st);

  function num(n) { try { return n.toLocaleString('ar-EG'); } catch (e) { return String(n); } }
  function fmt(ms) {
    var m = Math.max(0, Math.floor(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), n = m % 60;
    if (d) return num(d) + ' يوم' + (h ? ' و' + num(h) + ' ساعة' : '');
    if (h) return num(h) + ' ساعة' + (n ? ' و' + num(n) + ' دقيقة' : '');
    return num(Math.max(n, 1)) + ' دقيقة';
  }
  function waLink(t) { return 'https://wa.me/' + C.contact + '?text=' + encodeURIComponent(t); }
  function modal(html) { var m = document.createElement('div'); m.className = 'bwm'; m.innerHTML = '<div>' + html + '</div>'; document.body.appendChild(m); return m; }

  // الاستراحة: من شريط الاشتراك، أو من زر «استراحة» في صفحة «تقدمي» (window.bwPause)
  function pauseDlg() {
    var base = [360, 720, 1440, 2880, 4320, 7200, 10080, 14400, 20160, 43200], o = base.filter(function (x) { return x <= C.pauseMax; });
    if (!o.length || o[o.length - 1] !== C.pauseMax) o.push(C.pauseMax);
    var m = modal('<h3>⏸ استراحة من الدراسة</h3><p>خلال الاستراحة يتوقف العد العكسي ولا يمكنك الدخول، ثم تُضاف مدتها لاشتراكك. أقصى مدة متاحة لك: <b>' + fmt(C.pauseMax * 60000) + '</b> (١٠٪ من مدة اشتراكك).</p><select id="bwpm">'
      + o.map(function (x) { return '<option value="' + x + '">' + fmt(x * 60000) + (x === C.pauseMax ? ' (الحد الأقصى)' : '') + '</option>'; }).join('')
      + '</select><div class="e" id="bwpe"></div><div class="r"><button id="bwpok" type="button">تأكيد الاستراحة</button><button class="g" id="bwpno" type="button">إلغاء</button></div>');
    m.querySelector('#bwpno').onclick = function () { m.remove(); };
    m.querySelector('#bwpok').onclick = function () {
      var btn = this; btn.disabled = true;
      fetch('/api/pause', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ minutes: +m.querySelector('#bwpm').value }) })
        .then(function (r) { return r.json().then(function (d) { return [r.ok, d]; }); })
        .then(function (x) { if (x[0]) location.href = '/login?why=paused&until=' + x[1].until; else { m.querySelector('#bwpe').textContent = x[1].error || 'حدث خطأ'; btn.disabled = false; } })
        .catch(function () { m.querySelector('#bwpe').textContent = 'تعذّر الاتصال'; btn.disabled = false; });
    };
  }
  if (C.pauseMax >= 60) window.bwPause = pauseDlg;

  var bar = null, wa = null;
  if (TRIAL || SUB) {
    var end = TRIAL ? C.trialEnd : C.subEnd, start = TRIAL ? C.trialStart : C.subStart, total = Math.max(end - start, 1);
    bar = document.createElement('div');
    var title = TRIAL ? (hub ? 'أنت الآن في التجربة المجانية' : 'التجربة المجانية') : (hub ? 'اشتراكك فعّال' : 'اشتراكك');
    var btns = '';
    if (TRIAL) {
      btns += '<a class="bt" href="/login?next=' + encodeURIComponent(location.pathname) + '">سجّل بكودك</a>';
      if (hub) btns += '<a class="bt g" href="/login#plans">الباقات والأسعار</a>';
    } else {
      if (C.pauseMax >= 60) btns += '<button class="bt g" id="bwpz" type="button">⏸ استراحة</button>';
      if (C.contact) btns += '<a class="bt" target="_blank" rel="noopener" href="' + waLink('السلام عليكم، أريد تجديد اشتراكي في منصة البوابة التعليمية') + '">تجديد</a>';
    }
    var warnTxt = C.warn ? '⚠ تنبيه ' + num(C.warn) + ' من ٢: رصدنا مسح بيانات المتصفح لتجديد التجربة المجانية أكثر من مرة. تكرار ذلك سيمنع التجربة المجانية ويحظر عنوان شبكتك، ولن تدخل إلا بكود صحيح.' : '';
    bar.innerHTML = '<div class="in"><span class="ic">' + (TRIAL ? '🎁' : '⏳') + '</span><div class="tx"><b>' + title + '</b> <span id="bwr"></span></div>' + btns + '</div>'
      + (warnTxt ? '<div class="wr">' + warnTxt + '</div>' : '') + '<div class="pg"><i id="bwp"></i></div>';
    document.body.insertBefore(bar, document.body.firstChild);
    var verb = TRIAL ? 'تنتهي' : 'ينتهي';
    var tick = function () {
      var left = end - Date.now(), r = document.getElementById('bwr');
      r.textContent = left > 0
        ? (hub ? verb + ' بعد ' + fmt(left) + (TRIAL ? ' — وبعدها تحتاج كودًا للدخول.' : '.') : '— ' + verb + ' بعد ' + fmt(left))
        : (TRIAL ? (hub ? 'انتهت التجربة المجانية — سجّل دخولك بكودك للمتابعة.' : '— انتهت، سجّل بكودك للمتابعة') : '— انتهى اشتراكك، جدّد للمتابعة');
      document.getElementById('bwp').style.width = Math.max(0, Math.min(100, left / total * 100)) + '%';
      var lvl = TRIAL ? (left < 15 * 60000 ? 'd' : (left < 2 * 3600000 || left / total < .15) ? 'w' : '') : (left < 864e5 ? 'd' : left < 3 * 864e5 ? 'w' : '');
      bar.className = 'bwb' + (hub ? '' : ' c') + (lvl ? ' ' + lvl : '');
    };
    tick(); setInterval(tick, 30000);

    var pz = document.getElementById('bwpz');
    if (pz) pz.onclick = pauseDlg;
    if (C.warn && hub) {
      var key = 'bwWarn' + C.warn, seen = false; try { seen = sessionStorage.getItem(key); } catch (e) { }
      if (!seen) {
        var wm = modal('<h3>⚠ تنبيه ' + num(C.warn) + ' من ٢</h3><p>' + warnTxt.replace(/^⚠ تنبيه [^:]*: /, '') + '</p><div class="r"><button id="bwwok" type="button">فهمت</button></div>');
        wm.querySelector('#bwwok').onclick = function () { try { sessionStorage.setItem(key, '1'); } catch (e) { } wm.remove(); };
      }
    }
  }
  if (C.contact && (hub || TRIAL)) {
    var a = document.createElement('a');
    wa = a; a.className = 'bwwa' + (hub ? '' : ' s'); a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', 'تواصل معنا عبر واتساب');
    a.href = waLink('السلام عليكم ورحمة الله وبركاته\nكيف أقدر أنضم لمنصة الاختبارات في البوابة التعليمية');
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg><span>تواصل معنا</span>';
    document.body.appendChild(a);
  }
  var shown = function (id) { var e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); };
  var inExam = function () {
    return document.body.classList.contains('testing') || shown('simQ') || shown('simInter') || shown('vExam') || shown('vCover') || !!document.getElementById('cbox');
  };
  var sync = function () { var d = inExam() ? 'none' : ''; if (bar) bar.style.display = d; if (wa) wa.style.display = d; };
  sync();
  new MutationObserver(sync).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
})();
