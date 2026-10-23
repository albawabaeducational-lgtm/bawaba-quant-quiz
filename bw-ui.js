// يظهر في الصفحات الرئيسية فقط (الرئيسية وقوائم الاختبارات)، ولا يظهر أثناء حل الاختبار.
(function () {
  var C = window.__bw || {};
  var P = decodeURIComponent(location.pathname).replace(/^\//, '').replace(/(\.html)+$/, '');
  var hub = P === '' || P === 'index' || P === 'waraqi' || !!document.querySelector('meta[name="bw-hub"]');
  var st = document.createElement('style');
  st.textContent = '.bwb{direction:rtl;font-family:Cairo,Tahoma,Arial,sans-serif;color:#fff;background:linear-gradient(90deg,#12345a,#1769aa);position:relative;z-index:50}.bwb.w{background:linear-gradient(90deg,#7a4b00,#c98a00)}.bwb.d{background:linear-gradient(90deg,#8e2b2b,#c0392b)}'
    + '.bwb .in{max-width:1100px;margin:auto;padding:10px 14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}.bwb .ic{font-size:26px}.bwb .tx{flex:1;min-width:200px;line-height:1.5}.bwb .tx b{display:block;font-size:15px}.bwb .tx span{font-size:13px;opacity:.95}'
    + '.bwb .bt{background:#fff;color:#12345a;font-weight:700;font-size:14px;padding:8px 16px;border-radius:99px;text-decoration:none;white-space:nowrap}.bwb .pg{height:4px;background:#ffffff33}.bwb .pg i{display:block;height:100%;background:#fff;border-radius:0 4px 4px 0;transition:width .6s}'
    + '.bwb.c .in{padding:6px 12px;gap:8px}.bwb.c .ic{font-size:18px}.bwb.c .tx{min-width:0}.bwb.c .tx b{display:inline;font-size:13px}.bwb.c .tx span{font-size:12.5px}.bwb.c .bt{padding:4px 12px;font-size:12.5px}.bwb.c .pg{height:3px}.bwwa{position:fixed;left:16px;bottom:16px;z-index:2147483000;display:flex;align-items:center;gap:8px;background:#25d366;color:#fff;text-decoration:none;border-radius:99px;padding:0 18px 0 6px;height:56px;box-shadow:0 6px 20px #0004;font:700 14px Cairo,Tahoma,Arial,sans-serif;direction:rtl}'
    + '.bwwa svg{width:44px;height:44px;fill:#fff;padding:7px}.bwwa.s{padding:0;width:46px;height:46px;justify-content:center;left:12px;bottom:12px;opacity:.92}.bwwa.s span{display:none}.bwwa.s svg{width:34px;height:34px}.bwwa:hover{filter:brightness(1.05)}@media(max-width:600px){.bwwa{padding:0;width:56px;justify-content:center}.bwwa span{display:none}.bwwa svg{width:40px;height:40px}}';
  document.head.appendChild(st);

  function num(n) { try { return n.toLocaleString('ar-EG'); } catch (e) { return String(n); } }
  function fmt(ms) {
    var m = Math.max(0, Math.floor(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), n = m % 60;
    if (d) return num(d) + ' يوم' + (h ? ' و' + num(h) + ' ساعة' : '');
    if (h) return num(h) + ' ساعة' + (n ? ' و' + num(n) + ' دقيقة' : '');
    return num(Math.max(n, 1)) + ' دقيقة';
  }
  if (C.trialEnd) {
    var bar = document.createElement('div'), total = C.trialEnd - C.trialStart;
    bar.className = 'bwb';
    bar.innerHTML = '<div class="in"><span class="ic">🎁</span><div class="tx"><b>' + (hub ? 'أنت الآن في التجربة المجانية' : 'التجربة المجانية') + '</b> <span id="bwr"></span></div><a class="bt" href="/login?next=' + encodeURIComponent(location.pathname) + '">سجّل بكودك</a></div><div class="pg"><i id="bwp"></i></div>';
    document.body.insertBefore(bar, document.body.firstChild);
    var tick = function () {
      var left = C.trialEnd - Date.now(), r = document.getElementById('bwr');
      r.textContent = left > 0 ? (hub ? 'تنتهي بعد ' + fmt(left) + ' — وبعدها تحتاج كودًا للدخول.' : '— تنتهي بعد ' + fmt(left)) : (hub ? 'انتهت التجربة المجانية — سجّل دخولك بكودك للمتابعة.' : '— انتهت، سجّل بكودك للمتابعة');
      document.getElementById('bwp').style.width = Math.max(0, Math.min(100, left / total * 100)) + '%';
      bar.className = 'bwb' + (hub ? '' : ' c') + (left < 15 * 60000 ? ' d' : (left < 2 * 3600000 || left / total < .15) ? ' w' : '');
    };
    tick(); setInterval(tick, 30000);
  }
  var wa = null;
  if (C.contact && (hub || C.trialEnd)) {
    var a = document.createElement('a');
    wa = a; a.className = 'bwwa' + (hub ? '' : ' s'); a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', 'تواصل معنا عبر واتساب');
    a.href = 'https://wa.me/' + C.contact + '?text=' + encodeURIComponent('السلام عليكم، أريد الاستفسار عن منصة البوابة التعليمية');
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg><span>تواصل معنا</span>';
    document.body.appendChild(a);
  }
  // يختفي أثناء أداء الاختبار فقط: حل الأسئلة (testing)، أو شاشة سؤال/استراحة المحاكي (simQ/simInter)،
  // أو الورقي (vCover/vExam)، أو التأسيس (cbox). يظهر في الإعدادات والنتائج والتقارير.
  var bar = document.querySelector('.bwb');
  var shown = function (id) { var e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); };
  var inExam = function () {
    return document.body.classList.contains('testing') || shown('simQ') || shown('simInter') || shown('vExam') || shown('vCover') || !!document.getElementById('cbox');
  };
  var sync = function () { var d = inExam() ? 'none' : ''; if (bar) bar.style.display = d; if (wa) wa.style.display = d; };
  sync();
  new MutationObserver(sync).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
})();
