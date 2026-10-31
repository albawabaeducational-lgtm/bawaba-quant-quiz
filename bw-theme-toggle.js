// ألوان المنصة الموحدة (يحددها المدير). لا يوجد تبديل فاتح/داكن للمستخدم.
// هذا الملف: (١) ينظّف اختيار «الوضع الداكن» القديم، (٢) «مُوائم الألوان»: حين يحدد المدير ألوانًا، يحوّل الصناديق البيضاء المحايدة
// إلى لون البطاقات (في الألوان الداكنة)، ويضمن أن كل نص مقروء على خلفيته الفعلية (يبدّله لأسود/أبيض إن ضعف التباين).
// الألوان ذات المعنى (أخضر الصحيح، أحمر الخطأ، الذهبي…) والصور لا تُمس.
(function () {
  try { localStorage.removeItem('bw-user-theme'); } catch (e) { }
  var R = document.documentElement; R.classList.remove('bw-user-dark');
  [].forEach.call(document.querySelectorAll('[data-bw-global-theme]'), function (b) { b.remove(); });
  if (document.body && document.body.classList.contains('bw-home')) return;
  var P = function (c) { var m = String(c).match(/[\d.]+/g); return m ? { r: +m[0], g: +m[1], b: +m[2], a: m[3] == null ? 1 : +m[3] } : null; };
  var L = function (c) { var f = function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  var CR = function (a, b) { var x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  var mix = function (t, b) { return { r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 }; };
  var SKIP = 'img,svg,canvas,video,picture,iframe,.seg,.qimg,#qQuestionHost,#qSharedHost,.bw-question-zoom,#zm,[data-bw-keep],input[type=color]';
  var card = null, dark = false, busy = 0;
  function conf() { var cs = getComputedStyle(document.body), on = cs.getPropertyValue('--bwsc-on').trim(); if (on !== '1') return false; card = P(cs.getPropertyValue('--bwsc-card').trim() || 'rgb(255,255,255)'); dark = cs.getPropertyValue('--bwsc-dark').trim() === '1'; return !!card; }
  // خلفية النص الفعلية؛ null إن كان فوق تدرّج أو صورة (لا نحكم عليها ولا نغيّر لونها)
  function bgOf(el) { var st = []; for (var e = el; e && e.nodeType === 1; e = e.parentElement) { var cs = getComputedStyle(e); if (cs.backgroundImage && cs.backgroundImage !== 'none') return null; var c = P(cs.backgroundColor); if (c && c.a > 0) { st.push(c); if (c.a >= .99) break; } } var b = { r: 255, g: 255, b: 255, a: 1 }; for (var i = st.length - 1; i >= 0; i--) b = mix(st[i], b); return b; }
  function run() {
    busy = 0; if (!conf()) return;
    var all = document.body.getElementsByTagName('*'), cardCss = 'rgb(' + card.r + ',' + card.g + ',' + card.b + ')';
    if (dark) for (var i = 0; i < all.length; i++) {
      var e = all[i]; if (e.closest(SKIP) || e.dataset.bwscBg) continue;
      var c = P(getComputedStyle(e).backgroundColor); if (!c || c.a < .5) continue;
      var mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b);
      if (L(c) > .55 && (mx - mn) < 34) { e.style.setProperty('background-color', cardCss, 'important'); e.dataset.bwscBg = '1'; }
    }
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n, seen = new Set();
    while ((n = w.nextNode())) {
      if (!n.nodeValue.trim()) continue; var el = n.parentElement; if (!el || seen.has(el) || el.closest(SKIP)) continue; seen.add(el);
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
      var fc = P(getComputedStyle(el).color); if (!fc) continue; var bg = bgOf(el); if (!bg) continue; var fg = mix(fc, bg);
      if (CR(fg, bg) < 3.6) el.style.setProperty('color', CR(bg, { r: 17, g: 24, b: 39 }) >= CR(bg, { r: 255, g: 255, b: 255 }) ? '#111827' : '#ffffff', 'important');
    }
  }
  function later() { if (busy) return; busy = 1; setTimeout(run, 120); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', later); else later();
  addEventListener('load', later);
  new MutationObserver(later).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
})();
