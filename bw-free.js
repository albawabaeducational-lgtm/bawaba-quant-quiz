// النسخة المجانية المحدودة: يُحمَّل فقط لغير المشترك بعد انتهاء التجربة (يضيفه الخادم).
// يترك أول N من كل اختبار مفتوحًا، ويعرض الباقي بعلامة قفل تطلب تسجيل الدخول أو الاشتراك.
(function () {
  'use strict';
  var F = window.__BWF; if (!F) return;
  var N = F.n || 10, PAGE = F.c || '', LOCK = { secs: [], tests: 0, total: 0 };
  var SIGNUP = 'https://albawaba-edu.com/e/login/signup.php';
  var AR = function (n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var firstSecs = function (ids) { var u = []; ids.forEach(function (i) { if (u.indexOf(i) < 0) u.push(i); }); u.sort(function (a, b) { return a - b; }); return { keep: u.slice(0, N), all: u }; };

  // ===== تقليل البيانات قبل أن تقرأها الصفحة =====
  function bank(D) {
    if (!D || !D.qs) return D;
    // الخادم يحذف أسئلة الأقسام المقفولة من الصفحة؛ قائمة الأقسام (الأسماء فقط) تبقى لعرض علامة القفل
    var s = firstSecs(D.qs.map(function (a) { return a[1]; })), names = {};
    (D.secs || []).forEach(function (x) { names[x.id] = x.name; });
    var all = s.all.slice(); (D.secs || []).forEach(function (x) { if (all.indexOf(x.id) < 0) all.push(x.id); }); all.sort(function (a, b) { return a - b; });
    LOCK.secs = all.filter(function (id) { return s.keep.indexOf(id) < 0 && id > (s.keep[s.keep.length - 1] || 0); }).map(function (id) { return { id: id, name: names[id] || '' }; });
    D.qs = D.qs.filter(function (a) { return s.keep.indexOf(a[1]) >= 0; });
    return D;
  }
  function raw(R) {
    if (!Array.isArray(R)) return R;
    var PER = 25, n = Math.round(R.length / PER), keep = 0;
    for (var i = 0; i < n && i < N; i++) keep += Math.floor(R.length / n) + (i < R.length % n ? 1 : 0);
    LOCK.tests = Math.max(n, +window.__BWFT || 0); if (keep < R.length) R.length = keep;
    return R;
  }
  var apply0 = window.__bwApply;
  if (apply0) window.__bwApply = function (model, data) {
    var d = apply0(model, data);
    if (model === 'bank') return bank(d);
    if (model === 'raw') return raw(d);
    return d;
  };
  var linked0 = window.__bwLinked;
  if (linked0) window.__bwLinked = function (D0) {
    var D = linked0(D0);
    try {
      var l = firstSecs(D.qs.map(function (a) { return a[1]; })), k = firstSecs((D.qq || []).map(function (a) { return a[1]; }));
      D.qs = D.qs.filter(function (a) { return l.keep.indexOf(a[1]) >= 0; });
      if (D.qq) D.qq = D.qq.filter(function (a) { return k.keep.indexOf(a[1]) >= 0; });
      LOCK.linked = [l.all.length, k.all.length];
    } catch (e) { }
    return D;
  };
  // الأكثر تكرارًا: بنك أسئلة واحد → أول N×٥ سؤال، واختبارات ١٠ و٢٠ فقط
  window.__bwFreeData = function (kind, D) {
    if (kind !== 'aktar' || !D || !D.qs) return D;
    LOCK.total = D.qs.length; D.qs = D.qs.slice(0, N * 5);
    var ok = {}; D.qs.forEach(function (a) { ok[a[0]] = 1; });
    try { var r = JSON.parse(localStorage.getItem('bwmt-run') || 'null'); if (r && r.ids && r.ids.some(function (i) { return !ok[i]; })) localStorage.removeItem('bwmt-run'); var pf = JSON.parse(localStorage.getItem('bwmt-pref') || 'null'); if (pf && pf.n > 20) { pf.n = 20; localStorage.setItem('bwmt-pref', JSON.stringify(pf)); } } catch (e) { }
    return D;
  };

  // ===== الواجهة =====
  var css = '.bwf-bar{position:sticky;top:0;z-index:60;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;background:#0c2440;color:#fff;padding:8px 12px;font:600 14px/1.5 inherit;border-bottom:2px solid #e3a92b;text-align:center}'
    + '.bwf-bar a{color:#0c2440;background:#e3a92b;border-radius:999px;padding:4px 12px;text-decoration:none;font-weight:700;white-space:nowrap}.bwf-bar a.o{background:transparent;color:#fff;border:1px solid #fff9}'
    + '.bwf-lock{position:relative;opacity:.62;filter:grayscale(.5);cursor:pointer}.bwf-lock:hover{opacity:.85}.bwf-tag{display:block;font-size:12px;color:#b4232c;font-weight:700;margin-top:2px}'
    + '.bwf-m{position:fixed;inset:0;z-index:2147483000;background:#0c2440b3;display:flex;align-items:center;justify-content:center;padding:16px}'
    + '.bwf-m>div{background:#fff;color:#0c2440;border-radius:18px;max-width:420px;width:100%;padding:22px 20px;text-align:center;box-shadow:0 20px 60px #0006;font-family:inherit}'
    + '.bwf-m h3{margin:0 0 8px;font-size:20px}.bwf-m p{margin:0 0 12px;line-height:1.8;color:#3b4b63}.bwf-m .b{display:block;margin:8px 0;padding:11px;border-radius:12px;text-decoration:none;font-weight:700;border:0;width:100%;font:inherit;font-weight:700;cursor:pointer}'
    + '.bwf-m .b1{background:#0c2440;color:#fff}.bwf-m .b2{background:#e3a92b;color:#0c2440}.bwf-m .b3{background:#25d366;color:#fff}.bwf-m .b4{background:#eef3fb;color:#0c2440}.bwf-m small{display:block;color:#6b7a90;line-height:1.7;margin-top:6px}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  var nxt = encodeURIComponent(location.pathname + location.search);
  function modal(msg) {
    var old = document.querySelector('.bwf-m'); if (old) old.remove();
    var m = document.createElement('div'); m.className = 'bwf-m'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div><h3>🔒 هذا الجزء للمشتركين</h3><p>' + esc(msg || ('أنت الآن على النسخة المجانية: أول ' + AR(N) + ' من كل اختبار. سجّل دخولك لفتح كل الاختبارات والأقسام.')) + '</p>'
      + '<a class="b b1" href="/login?next=' + nxt + '">تسجيل الدخول</a>'
      + '<a class="b b2" href="' + SIGNUP + '" target="_blank" rel="noopener">إنشاء حساب جديد</a>'
      + (F.wa ? '<a class="b b3" href="https://wa.me/' + esc(F.wa) + '?text=' + encodeURIComponent('أريد الاشتراك في منصة البوابة التعليمية') + '" target="_blank" rel="noopener">اشترك عبر واتساب</a>' : '')
      + '<button type="button" class="b b4" data-x>إغلاق</button>'
      + '<small>إنشاء الحساب وحده لا يفتح النسخة الكاملة؛ لازم تكون مشتركًا في دورة واحدة على الأقل من دوراتنا.</small></div>';
    m.addEventListener('click', function (e) { if (e.target === m || e.target.hasAttribute('data-x')) m.remove(); });
    document.body.appendChild(m);
    var b = m.querySelector('a'); if (b) b.focus();
  }
  window.bwFreeLock = modal;
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.bwf-lock');
    if (!t) return;
    e.preventDefault(); e.stopImmediatePropagation(); modal(t.getAttribute('data-msg'));
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var m = document.querySelector('.bwf-m'); if (m) m.remove(); } });

  // علامات القفل على الأجزاء المقفولة (تُعاد كلما أعادت الصفحة رسم القائمة)
  function locks() {
    // أقسام الكمي / اللفظي
    var ch = document.getElementById('chips');
    if (ch && LOCK.secs.length && !ch.querySelector('.bwf-lock') && ch.querySelector('.chip')) {
      ch.insertAdjacentHTML('beforeend', LOCK.secs.map(function (s) { return '<button type="button" class="chip bwf-lock" title="للمشتركين">🔒 القسم ' + s.id + '</button>'; }).join(''));
    }
    // تأسيس اللفظي
    var g = document.querySelector('body.bwt-raw .grid');
    if (g && LOCK.tests > N && !g.querySelector('.bwf-lock') && g.querySelector('.card')) {
      var h = ''; for (var i = N + 1; i <= LOCK.tests; i++) h += '<button type="button" class="card bwf-lock"><span class="t">🔒 اختبار ' + AR(i) + '</span><span class="bwf-tag">للمشتركين</span></button>';
      g.insertAdjacentHTML('beforeend', h);
    }
    // الأكثر تكرارًا: أحجام الاختبار الكبيرة
    [].forEach.call(document.querySelectorAll('#sz .chip[data-n]'), function (c) { if (+c.getAttribute('data-n') > 20 && !c.classList.contains('bwf-lock')) { c.classList.add('bwf-lock'); c.classList.remove('on'); c.insertAdjacentHTML('afterbegin', '🔒 '); } });
    // قائمة المحاكي الورقي: النموذج الثاني
    [].forEach.call(document.querySelectorAll('a[href*="warky2"]'), function (a) {
      if (a.classList.contains('bwf-lock')) return;
      a.classList.add('bwf-lock'); var go = a.querySelector('.go'); if (go) go.textContent = '🔒 للمشتركين';
      a.setAttribute('data-msg', 'النموذج الأول متاح لك مجانًا. النموذج الثاني وباقي الاختبارات للمشتركين.');
    });
  }
  var pend = 0;
  function sched() { if (pend) return; pend = 1; requestAnimationFrame(function () { pend = 0; locks(); }); }

  function bar() {
    if (!F.why && PAGE !== 'aktar kamy' && PAGE !== 'skills') return;
    var w = F.why === 'expired' ? 'انتهى اشتراكك، وأنت الآن على النسخة المجانية' : 'أنت على النسخة المجانية';
    var what = PAGE === 'aktar kamy' ? ('أول ' + AR(N * 5) + ' سؤالًا') : PAGE === 'muhaky mohawsab' ? ('أول ' + AR(N) + ' أقسام لفظي و' + AR(N) + ' كمي') : PAGE === 'skills' ? ('أول ' + AR(N) + ' أسئلة من كل مهارة') : ('أول ' + AR(N) + ' من كل اختبار');
    var b = document.createElement('div'); b.className = 'bwf-bar';
    b.innerHTML = '<span>🔓 ' + w + ': ' + what + '.</span><a href="/login?next=' + nxt + '">تسجيل الدخول</a><a class="o" href="' + SIGNUP + '" target="_blank" rel="noopener">إنشاء حساب</a>';
    document.body.insertBefore(b, document.body.firstChild);
  }
  function boot() {
    bar(); locks();
    new MutationObserver(sched).observe(document.body, { childList: true, subtree: true });
    if (/[?&]locked=1/.test(location.search)) { modal('هذا الاختبار للمشتركين. النموذج الأول متاح لك مجانًا.'); try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { } }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
