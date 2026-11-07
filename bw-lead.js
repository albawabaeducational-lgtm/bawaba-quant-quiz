// «هدية مقابل رقم الواتساب»: يظهر للزائر غير المسجّل فقط.
// - زر عائم صغير «🎁 هديتك المجانية» + نافذة تعرض الهدية وتطلب الرقم (تظهر تلقائيًا مرة كل ٣ أيام بعد دقيقة من التصفح).
// - window.bwLead.open({ctx:'result', onDone, onSkip}) تستخدمها صفحة تحديد المستوى قبل عرض النتيجة.
// - عند الحفظ يفتح الخادم الأقسام المختارة من لوحة التحكم كاملة لعدد أيام (كوكي bw_lg).
(function () {
  'use strict';
  var H = document.documentElement;
  if (window.bwLead || H.classList.contains('bw-in') || H.classList.contains('bw-acct') || window.__BWE) return;
  var C = window.__bw || {}, KEY = 'bw-lead-done', SNOOZE = 'bw-lead-snooze';
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var put = function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } };
  var AR = function (n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var en = function (s) { return String(s).replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); }); };
  var daysTxt = function (n) { return n === 1 ? 'يومًا كاملًا' : n === 2 ? 'يومين' : AR(n) + (n <= 10 ? ' أيام' : ' يومًا'); };
  var left = function (t) { var m = Math.max(0, Math.ceil((t - Date.now()) / 60000)); return m >= 1440 ? AR(Math.ceil(m / 1440)) + ' يوم' : m >= 60 ? AR(Math.ceil(m / 60)) + ' ساعة' : AR(m) + ' دقيقة'; };
  var shown = function (id) { var e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); };
  var inExam = function () { var b = document.body; return !b || b.classList.contains('testing') || shown('simQ') || shown('simInter') || shown('vExam') || shown('vCover') || !!document.getElementById('cbox') || !!document.querySelector('.qhead .qsub'); };

  var css = '.bwl-m{position:fixed;inset:0;z-index:2147483500;background:#0c2440c7;display:flex;align-items:center;justify-content:center;padding:14px;direction:rtl;font-family:"IBM Plex Sans Arabic",Cairo,Tahoma,Arial,sans-serif}'
    + '.bwl-m>div{background:#fff;color:#0c2440;border-radius:20px;max-width:430px;width:100%;max-height:94vh;overflow:auto;padding:22px 20px 16px;box-shadow:0 24px 70px #0007;border-top:5px solid #e3a92b;text-align:center}'
    + '.bwl-m h3{margin:0 0 6px;font:700 21px/1.4 "Readex Pro","IBM Plex Sans Arabic",Tahoma,sans-serif}.bwl-m .lead{margin:0 0 12px;color:#3b4b63;line-height:1.8;font-size:15px}'
    + '.bwl-m ul{list-style:none;margin:0 0 12px;padding:12px 14px;background:#fbf4e1;border-radius:14px;text-align:start}.bwl-m li{margin:5px 0;line-height:1.7;font-size:14.5px}.bwl-m li b{color:#0c2440}'
    + '.bwl-m .soc{margin:0 0 12px;font-size:13.5px;color:#1d5c8f;font-weight:700}'
    + '.bwl-m input{width:100%;box-sizing:border-box;border:1.5px solid #cfdbe7;border-radius:12px;padding:12px;font-size:16px;font-weight:600;margin:0 0 8px;font-family:inherit}.bwl-m label{display:block;text-align:start;font-size:13.5px;font-weight:700;color:#3b4b63;margin:0 0 4px}.bwl-m input:focus{outline:2px solid #e3a92b;border-color:#e3a92b}'
    + '.bwl-m .go{display:block;width:100%;border:0;border-radius:12px;padding:13px;font-size:16.5px;font-weight:700;font-family:inherit;background:#25d366;color:#fff;cursor:pointer}.bwl-m .go:disabled{opacity:.6}'
    + '.bwl-m .msg{min-height:20px;font-size:13.5px;margin:6px 0 0}.bwl-m .msg.bad{color:#b4232c}.bwl-m small{display:block;color:#6b7a90;margin-top:8px;line-height:1.6}'
    + '.bwl-m .x{background:none;border:0;color:#6b7a90;font-size:13.5px;font-weight:600;font-family:inherit;margin-top:6px;cursor:pointer;text-decoration:underline}'
    + '.bwl-m .open{display:block;margin:8px 0;padding:12px;border-radius:12px;background:#0c2440;color:#fff;text-decoration:none;font-weight:700}'
    + '.bwl-p{position:fixed;right:14px;bottom:16px;z-index:2147482998;direction:rtl;display:flex;align-items:center;gap:6px;background:#e3a92b;color:#0c2440;border:0;border-radius:99px;padding:10px 15px;font:700 14px "IBM Plex Sans Arabic",Cairo,Tahoma,sans-serif;box-shadow:0 6px 18px #0004;cursor:pointer;animation:bwlp 2.4s ease-in-out 3}'
    + '.bwl-p i{font-style:normal;margin-inline-start:4px;opacity:.6;padding:0 4px}.bwl-p.on{background:#0c2440;color:#fff;cursor:default;animation:none}'
    + '@keyframes bwlp{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}@media(max-width:600px){.bwl-p{right:10px;bottom:12px;font-size:13px;padding:8px 12px}}';
  var st = document.createElement('style'); st.textContent = css; (document.head || H).appendChild(st);

  var OFFER = null, offerP = null;
  var offer = function () { return offerP || (offerP = fetch('/api/lead-gift').then(function (r) { return r.json(); }).then(function (o) { OFFER = o && o.on ? o : null; return OFFER; }).catch(function () { return null; })); };
  var titles = function (o) { return o.courses.map(function (c) { return '«' + esc(c.title) + '»'; }).join(' و'); };

  function modal(opt) {
    opt = opt || {};
    var o = OFFER, res = opt.ctx === 'result';
    var old = document.querySelector('.bwl-m'); if (old) old.remove();
    var m = document.createElement('div'); m.className = 'bwl-m'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div><h3>' + (res ? '🎉 أحسنت! نتيجتك جاهزة' : '🎁 هديتك المجانية بانتظارك') + '</h3>'
      + '<p class="lead">' + (res ? 'اترك رقم الواتساب حتى تحصل على <b>النتيجة والخطة</b> المناسبة لمستواك، ومعها هدية:' : 'اترك رقم الواتساب واحصل فورًا على:') + '</p>'
      + '<ul>' + (o ? '<li>🔓 فتح ' + titles(o) + ' <b>كاملًا ' + daysTxt(o.days) + '</b> فورًا</li>' : '')
      + '<li>📄 <b>ملف كل الأسئلة الأكثر تكرارًا</b> يصلك على الواتساب</li>'
      + '<li>🗺️ <b>خطة التأهيل المجرّبة</b> مع مئات الطلاب قبلك</li></ul>'
      + '<p class="soc">انضم إلى مئات الطلاب معنا على المنصة لمتابعة مسيرة التميز 🌟</p>'
      + '<form novalidate><label for="bwlp">رقم الواتساب</label><input id="bwlp" name="p" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" maxlength="20" placeholder="05XXXXXXXX"><input name="n" autocomplete="name" maxlength="80" placeholder="اسمك (اختياري)" aria-label="الاسم">'
      + '<button class="go" type="submit">' + (res ? 'اعرض نتيجتي وخطتي' : 'افتح هديتي الآن') + '</button><div class="msg" role="status" aria-live="polite"></div></form>'
      + '<small>🔒 رقمك عندنا بأمان، ولن نشاركه مع أي جهة.</small>'
      + '<button type="button" class="x">' + (res ? 'عرض النتيجة فقط بدون الخطة' : 'لاحقًا') + '</button></div>';
    var f = m.querySelector('form'), msg = m.querySelector('.msg'), b = m.querySelector('.go'), ph = f.elements.p;
    var close = function (skip) { m.remove(); if (skip) { put(SNOOZE, String(Date.now())); if (opt.onSkip) opt.onSkip(); } };
    m.querySelector('.x').onclick = function () { close(true); };
    if (!res) m.addEventListener('click', function (e) { if (e.target === m) close(true); });
    f.onsubmit = function (e) {
      e.preventDefault();
      var d = en(ph.value).replace(/\D/g, '');
      if (d.length < 9 || d.length > 15) { msg.className = 'msg bad'; msg.textContent = 'اكتب رقم واتساب صحيحًا، مثال: 05XXXXXXXX'; ph.focus(); return; }
      b.disabled = true; msg.className = 'msg'; msg.textContent = 'جارٍ تجهيز هديتك…';
      fetch('/api/guest-lead', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone: d, name: f.elements.n.value, gift: 1, source: res ? 'placement' : 'gift', interest: '🎁 ' + (res ? 'نتيجة تحديد المستوى + الخطة' : 'طلب الهدية') + ': ملف الأكثر تكرارًا + خطة التأهيل' + (o ? ' + فتح ' + o.courses.map(function (c) { return c.title; }).join('، ') : '') }) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (!x.ok) { b.disabled = false; msg.className = 'msg bad'; msg.textContent = x.j.error || 'تعذّر الحفظ، حاول مرة أخرى'; return; }
          put(KEY, '1'); var g = x.j.gift; if (pill) pill.remove();
          if (res) { m.remove(); if (opt.onDone) opt.onDone(g); return; }
          m.firstChild.innerHTML = '<h3>✅ تم! هديتك جاهزة</h3><p class="lead">سنرسل لك <b>ملف الأسئلة الأكثر تكرارًا</b> و<b>خطة التأهيل</b> على الواتساب قريبًا بإذن الله.</p>'
            + (g && g.courses && g.courses.length ? '<p class="lead" style="margin-bottom:4px">وتم فتح الأقسام التالية لك كاملة حتى ' + new Date(g.until).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }) + ':</p>' + g.courses.map(function (c) { return '<a class="open" href="' + esc(c.url) + '">ابدأ الآن: ' + esc(c.title) + ' ←</a>'; }).join('') : (x.j.giftUsed ? '<p class="lead">هدية فتح الأقسام استُخدمت من قبل لهذا الرقم.</p>' : ''))
            + '<button type="button" class="x">إغلاق</button>';
          m.querySelector('.x').onclick = function () { m.remove(); };
        })
        .catch(function () { b.disabled = false; msg.className = 'msg bad'; msg.textContent = 'تعذّر الاتصال، حاول مرة أخرى'; });
    };
    document.body.appendChild(m); setTimeout(function () { ph.focus(); }, 50);
  }

  var pill = null;
  window.bwLead = {
    done: function () { return get(KEY) === '1'; },
    // ctx 'result': قبل عرض نتيجة تحديد المستوى. لو ترك رقمه سابقًا تُعرض النتيجة مباشرة.
    open: function (opt) { opt = opt || {}; if (opt.ctx === 'result' && get(KEY) === '1') { if (opt.onDone) opt.onDone(); return; } offer().then(function () { modal(opt); }); }
  };

  function boot() {
    // هدية مفتوحة الآن: شريط صغير بالمدة المتبقية
    if (C.giftEnd) {
      pill = document.createElement('div'); pill.className = 'bwl-p on';
      var t = function () { pill.textContent = '🎁 هديتك مفتوحة — متبقي ' + left(C.giftEnd); }; t(); setInterval(t, 60000);
      document.body.appendChild(pill);
    } else if (get(KEY) !== '1') {
      offer().then(function (o) {
        if (!o && !document.getElementById('leadForm')) { /* بدون هدية فتح أقسام: نكتفي بالنافذة عند الطلب */ }
        pill = document.createElement('button'); pill.type = 'button'; pill.className = 'bwl-p';
        pill.innerHTML = o ? '🎁 افتح ' + esc(o.courses[0].title) + ' مجانًا<i aria-label="إخفاء">✕</i>' : '🎁 هديتك المجانية<i aria-label="إخفاء">✕</i>';
        pill.onclick = function (e) { if (e.target.tagName === 'I') { pill.remove(); try { sessionStorage.setItem('bw-lead-pill', '0'); } catch (x) { } return; } modal(); };
        var hidden = false; try { hidden = sessionStorage.getItem('bw-lead-pill') === '0'; } catch (x) { }
        if (!hidden) document.body.appendChild(pill);
        // مرة كل ٣ أيام: تظهر النافذة تلقائيًا بعد دقيقة من التصفح (ليس أثناء الاختبار)
        var sn = +get(SNOOZE) || 0;
        if (Date.now() - sn > 3 * 864e5) setTimeout(function () { if (get(KEY) !== '1' && !inExam() && !document.querySelector('.bwl-m,.bwf-m')) { put(SNOOZE, String(Date.now())); modal(); } }, 60000);
      });
    }
    // لا يغطي الزر أسئلة الاختبار، ولا يتعارض مع زر «العودة إلى خطتي»
    setInterval(function () { if (!pill) return; pill.style.display = inExam() ? 'none' : ''; pill.style.bottom = document.querySelector('.bwpb') ? '70px' : ''; }, 800);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
