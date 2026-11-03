// يحفظ تقدم الطالب (الإحصائيات، الأخطاء، نتائج المحاكاة) على الخادم، فيجده على أي جهاز يدخل منه بنفس الكود أو حساب مودل.
(function () {
  'use strict';
  if (!window.__bwSid) return;
  var K = ['bw-stats-v1', 'quant-quiz-errors-v1', 'bw-sim-v1', 'bw-sel-v1', 'bwq-seen', 'bwa-stats-v1', 'bwa-errors-v1', 'bwa-sim-v1', 'bwa-sel-v1', 'bwa-seen', 'bwv-stats-v1', 'verbal-quiz-errors-v1', 'bwv-sim-v1', 'bwv-sel-v1', 'bwm-sim-v1', 'bwm-seen', 'tanazur.best', 'ikmal.best', 'ikmal.prefs', 'tanazur.prefs', 'bawaba_folder_v1_e1', 'bawaba_folder_v1_e2', 'bw-place-v1', 'bw-why-v1', 'bwmt-seen', 'bwmt-errors', 'bwmt-hist', 'bw-goal-v1', 'bw-study-plan-v1', 'bw-skill-v1', 'bw-rank-off', 'warky1447.seen', 'warky1447.err', 'warky1447.hist', 'warky1447.run', 'warky1447.pref', 'warky1447.res'];
  var L = window.localStorage, srv = window.__bwSrv || {}, dirty = {}, timer = null;
  var orig = Storage.prototype.setItem, origGet = Storage.prototype.getItem;
  function meta() { try { var m = JSON.parse(origGet.call(L, 'bw-sync-meta') || '{}') || {}; m.t = m.t || {}; m.sid = window.__bwSid; return m; } catch (e) { return { sid: window.__bwSid, t: {} }; } }
  function flush(useBeacon) {
    timer = null; var keys = Object.keys(dirty); if (!keys.length) return;
    var M = meta(), items = {};
    keys.forEach(function (k) { var v = origGet.call(L, k); if (v != null) items[k] = { v: v, t: M.t[k] || Date.now() }; });
    dirty = {};
    // المتصفح يرفض طلبات keepalive وsendBeacon الأكبر من ٦٤ كيلوبايت؛ فالبيانات الكبيرة تُرسل بطلب عادي،
    // وكل مفتاح كبير يُرسل وحده حتى لا يمنع حفظ بقية المفاتيح. وعند الفشل تُعاد المحاولة لاحقًا.
    var small = {}, big = [], size = 0;
    Object.keys(items).forEach(function (k) { var n = items[k].v.length + k.length + 40; if (size + n < 60000) { small[k] = items[k]; size += n; } else big.push(k); });
    var retry = function (ks) { ks.forEach(function (k) { dirty[k] = 1; }); if (!timer) timer = setTimeout(flush, 15000); };
    var send = function (obj, ka) {
      var ks = Object.keys(obj); if (!ks.length) return; var body = JSON.stringify({ items: obj });
      try {
        if (ka && useBeacon && navigator.sendBeacon && navigator.sendBeacon('/api/progress', new Blob([body], { type: 'application/json' }))) return;
        fetch('/api/progress', { method: 'POST', headers: { 'content-type': 'application/json' }, body: body, keepalive: !!ka, credentials: 'same-origin' })
          .then(function (r) { if (!r.ok) retry(ks); }).catch(function () { retry(ks); });
      } catch (e) { retry(ks); }
    };
    send(small, true);
    big.forEach(function (k) { var o = {}; o[k] = items[k]; send(o, false); });
  }
  function mark(k) {
    var M = meta(); M.t[k] = Date.now(); orig.call(L, 'bw-sync-meta', JSON.stringify(M));
    dirty[k] = 1; if (!timer) timer = setTimeout(flush, 2500);
  }
  Storage.prototype.setItem = function (k, v) {
    var r = orig.apply(this, arguments);
    try { if (this === L && K.indexOf(k) >= 0) mark(k); } catch (e) { }
    return r;
  };
  // تقدم موجود على هذا الجهاز من قبل ولم يُرفع بعد (أو أحدث من نسخة الخادم)
  try {
    var M0 = meta(), changed = false;
    K.forEach(function (k) { if (origGet.call(L, k) == null) return; if (!M0.t[k]) { M0.t[k] = Date.now(); changed = true; } if (!srv[k] || M0.t[k] > srv[k]) dirty[k] = 1; });
    if (changed) orig.call(L, 'bw-sync-meta', JSON.stringify(M0));
    if (Object.keys(dirty).length) timer = setTimeout(flush, 1500);
  } catch (e) { }
  addEventListener('pagehide', function () { if (Object.keys(dirty).length) flush(true); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && Object.keys(dirty).length) flush(true); });
})();
