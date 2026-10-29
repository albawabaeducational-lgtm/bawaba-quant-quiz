// حساب الطالب: أيقونة الشخص وقائمتها، وعزل المحتوى في الصفحة الرئيسية، وتنبيه قرب انتهاء الاشتراك.
// يعمل في الصفحة الرئيسية وكل صفحات الاختبارات وصفحة الحساب.
(function () {
  if (window.__bwAcct) return; window.__bwAcct = 1;
  var LMS = 'https://albawaba-edu.com/e/';
  var URLS = { 'muhaky mohawsab': '/muhaky%20mohawsab.html', 'tasis lafzi': '/tasis%20lafzi.html.html', 'ikmal_aljumal': '/ikmal_aljumal.html', 'aksam kamy': '/aksam%20kamy.html', 'ak_kamyadd': '/ak_kamyadd.html', 'aksam lafzi': '/aksam%20lafzi.html', 'aktar kamy': '/aktar%20kamy.html', 'skills': '/skills', 'waraqi': '/waraqi.html' };
  window.bwCourseUrl = function (k) { return URLS[k] || '/'; };
  var AR = function (n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var MEP = null;
  function getMe(force) {
    if (!MEP || force) MEP = fetch('/api/me', { credentials: 'same-origin', cache: 'no-store' }).then(function (r) { return r.json(); }).catch(function () { return { logged: false }; });
    return MEP;
  }
  window.bwMe = getMe;
  window.bwMeClear = function () { MEP = null; };
  var st = document.createElement('style');
  st.textContent = '.bwp{position:relative;flex:none}.bwp-b{width:42px;height:42px;border-radius:50%;border:1.5px solid #ffffff4d;background:#ffffff14;color:#fff;display:grid;place-items:center;cursor:pointer;padding:0;position:relative}.bwp-b svg{width:22px;height:22px;fill:currentColor}.bwp-b i{position:absolute;top:-4px;left:-6px;font:700 10.5px "IBM Plex Sans Arabic",Tahoma,sans-serif;font-style:normal;background:#c9a45c;color:#1d2a39;border-radius:99px;padding:1px 6px;white-space:nowrap}'
    + 'html.th-light .bwp-b{color:var(--navy,#1b3a5c);border-color:#0000002a;background:#fff}'
    + '.bwp-d{position:absolute;top:calc(100% + 8px);left:0;min-width:240px;background:#fff;color:#1d2a39;border-radius:16px;box-shadow:0 18px 40px #0c244033;border:1px solid #dbe2ea;padding:8px;z-index:2147483200;direction:rtl;font:500 14.5px "IBM Plex Sans Arabic",Tahoma,sans-serif;text-align:right}.bwp-d[hidden]{display:none}'
    + '.bwp-h{padding:10px 12px 12px;border-bottom:1px solid #eef2f6;margin-bottom:6px}.bwp-h b{display:block;font-size:15.5px;color:#1b3a5c}.bwp-h small{display:block;color:#5d6b7c;font-size:12.5px;direction:ltr;text-align:right}.bwp-h em{display:inline-block;margin-top:6px;font-style:normal;font-size:12px;font-weight:700;background:#fff1d6;color:#8a5d00;border-radius:99px;padding:1px 10px}'
    + '.bwp-d a,.bwp-d button{display:flex;align-items:center;gap:10px;width:100%;text-align:right;padding:10px 12px;border-radius:10px;color:#1d2a39;text-decoration:none;background:none;border:0;font:inherit;cursor:pointer}.bwp-d a:hover,.bwp-d button:hover{background:#f3f5f8}.bwp-d .o{color:#b4321f}.bwp-d .p{background:#1b3a5c;color:#fff;justify-content:center;font-weight:700;margin-top:4px}.bwp-d .p:hover{background:#2c5f8a}'
    + '#bw-shell .bwp-b{width:36px;height:36px}@media(max-width:700px){.bwp-d{position:fixed;top:66px;left:10px;right:10px;min-width:0}}'
    + '.bwx{position:fixed;top:10px;left:0;right:0;margin:0 auto;width:max-content;z-index:2147483100;background:#fff6e0;color:#5a3e00;border:1.5px solid #e3a92b;border-radius:14px;padding:8px 12px;box-shadow:0 10px 26px #0c244026;display:flex;align-items:center;gap:10px;font:600 13.5px "IBM Plex Sans Arabic",Tahoma,sans-serif;max-width:calc(100% - 24px);direction:rtl;transition:opacity .4s}.bwx a{background:#1b3a5c;color:#fff;border-radius:10px;padding:5px 12px;text-decoration:none;white-space:nowrap}.bwx button{background:none;border:0;font-size:18px;cursor:pointer;color:#5a3e00;padding:0 2px}';
  document.head.appendChild(st);
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"/></svg>';
  function menu(me) {
    var host = document.querySelector('#bw-shell') || document.querySelector('header.top .wrap'); if (!host || host.querySelector('.bwp')) return;
    var w = document.createElement('div'); w.className = 'bwp';
    var act = (me.subs || []).filter(function (s) { return s.state === 'active' || s.state === 'soon'; }), near = act.slice().sort(function (a, b) { return a.days - b.days; })[0];
    var DY = function (n) { return n === 1 ? 'يوم' : n === 2 ? 'يومان' : AR(n) + (n <= 10 ? ' أيام' : ' يومًا'); };
    var badge = me.account && me.showCounter && near ? '<i>' + DY(near.days) + '</i>' : '';
    w.innerHTML = '<button type="button" class="bwp-b" aria-haspopup="true" aria-expanded="false" title="حسابي">' + ICON + badge + '</button><div class="bwp-d" hidden role="menu"></div>';
    var d = w.querySelector('.bwp-d');
    if (me.logged) {
      d.innerHTML = '<div class="bwp-h"><b>' + esc(me.name) + '</b>' + (me.email || me.phone ? '<small>' + esc(me.email || '') + (me.email && me.phone ? ' · ' : '') + esc(String(me.phone || '').replace(/^966(5\d{8})$/, '0$1')) + '</small>' : '<small>دخول بالكود</small>') + (me.account && near ? '<em>أقرب انتهاء: ' + esc(near.title) + ' بعد ' + DY(near.days) + '</em>' : '') + '</div>'
        + '<a href="/account.html?tab=me" role="menuitem">👤 حسابي</a><a href="/account.html?tab=exams" role="menuitem">📚 اختباراتي</a><a href="' + LMS + '" target="_blank" rel="noopener" role="menuitem">🎓 الدخول لمنصة الدورات</a><a href="/account.html?tab=ref" role="menuitem">🤝 سفيري (رابط الإحالة)</a><button type="button" class="o" data-out role="menuitem">⎋ تسجيل الخروج</button>';
    } else {
      d.innerHTML = '<div class="bwp-h"><b>مرحبًا بك</b><small style="direction:rtl">سجّل دخولك لتصل لاختباراتك</small></div><a href="/account.html" class="p" role="menuitem">تسجيل الدخول</a><a href="/account.html?tab=signup" role="menuitem">✨ إنشاء حساب جديد</a><a href="' + LMS + '" target="_blank" rel="noopener" role="menuitem">🎓 منصة الدورات</a>';
    }
    if (host.id === 'bw-shell') { var bk = host.querySelector('.bws-back'); host.insertBefore(w, bk ? bk.nextSibling : null); } else host.appendChild(w);
    var b = w.querySelector('.bwp-b');
    b.onclick = function (e) { e.stopPropagation(); d.hidden = !d.hidden; b.setAttribute('aria-expanded', d.hidden ? 'false' : 'true'); };
    document.addEventListener('click', function (e) { if (!w.contains(e.target)) { d.hidden = true; b.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') d.hidden = true; });
    var out = d.querySelector('[data-out]'); if (out) out.onclick = function () { out.textContent = 'جارٍ تسجيل الخروج…'; window.bwMeClear(); fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).finally(function () { try { localStorage.removeItem('bw-sync-sid'); } catch (e) { } location.href = '/'; }); };
  }
  // تنبيه قرب الانتهاء: مرة واحدة يوميًا، يختفي بعد ٨ ثوانٍ، ولا يظهر أثناء الاختبار
  function alertSoon(me) {
    if (!me.account) return; var soon = (me.subs || []).filter(function (s) { return s.state === 'soon'; })[0]; if (!soon) return;
    var key = 'bw-exp-' + new Date().toISOString().slice(0, 10); try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (e) { }
    if (document.body.classList.contains('testing') || document.body.classList.contains('simlive')) return;
    var x = document.createElement('div'); x.className = 'bwx'; x.setAttribute('role', 'status');
    x.innerHTML = '<span>⏳ ينتهي اشتراكك في «' + esc(soon.title) + '» بعد ' + (soon.days <= 1 ? 'يوم واحد' : AR(soon.days) + ' أيام') + '</span><a href="/account.html?tab=exams&renew=' + encodeURIComponent(soon.course) + '">تجديد</a><button type="button" aria-label="إغلاق">×</button>';
    document.body.appendChild(x); var rm = function () { x.style.opacity = '0'; setTimeout(function () { x.remove(); }, 400); };
    x.querySelector('button').onclick = rm; setTimeout(rm, 8000);
  }
  function freeCard() {
    var tests = document.getElementById('tests'); if (!tests || document.getElementById('bwNoSub')) return;
    var n = document.createElement('div'); n.id = 'bwNoSub'; n.style.cssText = 'background:#fff;border-radius:22px;padding:20px;text-align:center;margin:0 0 20px;box-shadow:0 10px 26px #0000001f;color:#1d2a39';
    n.innerHTML = '<h3 style="margin:0 0 6px;color:#1b3a5c">🎁 حسابك جاهز وأمامك النسخة المجانية</h3><p style="margin:0 0 12px;color:#5d6b7c">ادخل أي اختبار من الأسفل وتدرّب على الأجزاء المفتوحة مجانًا. ولفتح الاختبارات كاملة اطلب الاشتراك في القسم الذي تريده.</p><a href="/account.html?tab=exams" style="display:inline-block;background:#c9a45c;color:#1d2a39;border-radius:12px;padding:10px 20px;font-weight:700;text-decoration:none">اطلب الاشتراك</a>';
    var w2 = tests.querySelector('.wrap'); if (w2) w2.insertBefore(n, w2.firstChild);
  }
  // الصفحة الرئيسية: الطالب صاحب الحساب يرى فقط ما اشترك فيه (عزل المحتوى)
  function isolate(me) {
    if (!me.account || !document.querySelector('.pathways')) return;
    var mine = (me.subs || []).filter(function (s) { return s.state === 'active' || s.state === 'soon'; }).map(function (s) { return s.course; });
    // بلا اشتراك ساري: يرى الصفحة كاملة بالنسخة المجانية مثل الزائر، مع بطاقة توضح ذلك
    if (!mine.length) { freeCard(); return; }
    var hide = (me.courses || []).map(function (c) { return c.key; }).filter(function (k) { return mine.indexOf(k) < 0; });
    document.documentElement.classList.add('bw-in', 'bw-acct');
    [].forEach.call(document.querySelectorAll('.pathway-link.pending'), function (p) { p.setAttribute('hidden', ''); var g = p.closest('.pathway-group'); if (g && ![].some.call(g.querySelectorAll('.pathway-link'), function (a) { return !a.hasAttribute('hidden'); })) g.setAttribute('hidden', ''); });
    if (window.__bwHide) window.__bwHide(hide);
    [].forEach.call(document.querySelectorAll('.pathway'), function (art) { if (![].some.call(art.querySelectorAll('.pathway-link'), function (a) { return !a.hasAttribute('hidden') && !a.closest('[hidden]'); })) art.setAttribute('hidden', ''); });
    var tests = document.getElementById('tests'); if (tests && !mine.length && !document.getElementById('bwNoSub')) {
      var n = document.createElement('div'); n.id = 'bwNoSub'; n.style.cssText = 'background:#fff;border-radius:22px;padding:22px;text-align:center;margin:0 0 20px;box-shadow:0 10px 26px #0000001f;color:#1d2a39';
      n.innerHTML = '<h3 style="margin:0 0 6px;color:#1b3a5c">لا توجد اشتراكات في حسابك بعد</h3><p style="margin:0 0 12px;color:#5d6b7c">اختر القسم الذي تريده وأرسل طلب الاشتراك، ونفعّله لك بعد الدفع عبر واتساب.</p><a href="/account.html?tab=exams" style="display:inline-block;background:#c9a45c;color:#1d2a39;border-radius:12px;padding:10px 20px;font-weight:700;text-decoration:none">اختباراتي واشتراكاتي</a>';
      var w2 = tests.querySelector('.wrap'); if (w2) w2.insertBefore(n, w2.firstChild);
    }
  }
  function boot() { getMe().then(function (me) { window.__bwMeData = me; menu(me); isolate(me); alertSoon(me); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
