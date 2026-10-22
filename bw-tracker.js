(function () {
  var P = decodeURIComponent(location.pathname).replace(/^\//, '').replace(/(\.html)+$/, '') || 'home';
  function send(o) { o.page = P; try { fetch('/api/track', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(o), keepalive: true, credentials: 'same-origin' }).catch(function () {}); } catch (e) {} }
  var AD = '٠١٢٣٤٥٦٧٨٩'; function en(s) { return String(s).replace(/[٠-٩]/g, function (d) { return AD.indexOf(d); }); }
  send({ t: 'open' });
  setInterval(function () { if (document.visibilityState === 'visible') send({ t: 'beat', s: 60 }); }, 60000);
  var prevBest = {}; try { prevBest = JSON.parse(localStorage.getItem('tanazur.best') || '{}') || {}; } catch (e) {}
  var orig = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    var r = orig.apply(this, arguments);
    try {
      if (/^(bw|bwm|bwv)-sim-v1/.test(k)) { var h = JSON.parse(v), l = h[h.length - 1]; if (l) send({ t: 'attempt', sub: 'محاكي', score: l.p, correct: l.g, total: l.n }); }
      else if (k === 'tanazur.best') { var b = JSON.parse(v); for (var i in b) if (b[i] !== prevBest[i]) send({ t: 'attempt', sub: 'اختبار ' + (+i + 1), score: b[i] }); prevBest = b; }
    } catch (e) {}
    return r;
  };
  var vr = document.getElementById('vRes');
  if (vr && /warky/.test(P)) {
    var done = false;
    new MutationObserver(function () {
      if (vr.classList.contains('hidden')) { done = false; return; }
      if (done) return; done = true;
      setTimeout(function () {
        var t = en((document.getElementById('resTop') || {}).textContent || ''), m = t.match(/(\d+)\s*(?:\/|من)\s*(\d+)/);
        send({ t: 'attempt', sub: 'ورقي', correct: m ? +m[1] : null, total: m ? +m[2] : null, score: m ? Math.round(m[1] * 100 / m[2]) : null });
      }, 500);
    }).observe(vr, { attributes: true, attributeFilter: ['class'] });
  }
})();
