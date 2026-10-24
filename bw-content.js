// يطبّق تعديلات المعلمين (المحفوظة في قاعدة البيانات) على أسئلة الصفحة قبل أن تبدأ الصفحة في استخدامها.
// الملف الأصلي لا يتغير؛ أي تعديل يمكن الرجوع عنه من وضع التحرير.
(function () {
  'use strict';
  var X = window.__BWX || { p: [] }, P = X.p || [];
  function rows(kind) { return P.filter(function (r) { return r[0] === kind; }); }
  // المحاكي المحوسب: يُبنى من «أقسام اللفظي» و«أقسام الكمي» (تُحمَّل من /api/exam/data) مع تعديلات المعلمين عليهما
  window.__bwLinked = function (D0) {
    try {
      var W = window.__BWD || {}, L = W['aksam lafzi'], K = W['aksam kamy'], LK = X.linked || {};
      if (!L || !L.qs || !K || !K.qs) return window.__bwApply('bank', D0);
      var own = P;
      P = LK['aksam lafzi'] || []; L = bank(L, true);
      P = LK['aksam kamy'] || []; K = bank(K, true);
      P = own;
      var D = { v: D0.v, pw: D0.pw, secs: L.secs, ps: L.ps || [], qs: L.qs, qq: K.qs.map(function (a) { return [a[0], a[1], a[6]]; }), qh: {} }, src = {};
      K.qs.forEach(function (a) { if (a[7]) D.qh[a[0]] = a[7]; var m = /\/api\/exam\/img\/\d+/.exec(a[4] || ''); if (m) src[a[0]] = m[0]; });
      window.__bwQSrc = src;
      return D;
    } catch (e) { if (window.console) console.error('bw-linked', e); return D0; }
  };
  // بنك مقرر آخر محمَّل من /api/exam/data مع تعديلات المعلمين عليه (لاختبار تحديد المستوى)
  window.__bwBank = function (slug) {
    var D = (window.__BWD || {})[slug]; if (!D || !D.qs) return null;
    var own = P; P = (X.linked || {})[slug] || [];
    try { return bank(D, true); } catch (e) { if (window.console) console.error('bw-bank', e); return D; } finally { P = own; }
  };
  window.__bwApply = function (model, data) {
    try {
      if (model === 'bank') return bank(data);
      if (model === 'raw') return raw(data);
      if (model === 'key') return key(data);
    } catch (e) { if (window.console) console.error('bw-content', e); }
    return data;
  };
  function bank(D, linkedMode) {
    if (!linkedMode) window.__bwBase = { q: D.qs.map(function (a) { return a[0]; }), s: D.secs.map(function (s) { return s.id; }), p: (D.ps || []).length, qq: (D.qq || []).map(function (a) { return a[0]; }) };
    if (!P.length) return D;
    rows('s').forEach(function (r) {
      var id = +r[1], i = D.secs.findIndex(function (s) { return s.id === id; });
      if (r[2] === null) { if (i >= 0) D.secs.splice(i, 1); }
      else if (i >= 0) D.secs[i].name = r[2].name;
      else D.secs.push({ id: id, name: r[2].name });
    });
    rows('p').forEach(function (r) { if (r[2] !== null) { D.ps = D.ps || []; D.ps[+r[1]] = r[2]; } });
    rows('q').forEach(function (r) {
      var id = +r[1], i = D.qs.findIndex(function (a) { return a[0] === id; });
      if (r[2] === null) { if (i >= 0) D.qs.splice(i, 1); return; }
      if (i >= 0) { D.qs[i] = r[2]; return; }
      var last = -1; D.qs.forEach(function (a, k) { if (a[1] === r[2][1]) last = k; });
      if (last < 0) D.qs.push(r[2]); else D.qs.splice(last + 1, 0, r[2]);
    });
    // الأسئلة التي نُقلت لقسم آخر تُعاد بجانب أسئلة قسمها الجديد
    rows('o').forEach(function (r) {
      if (!r[2]) return;
      var sec = +r[1], pos = [], items = [];
      D.qs.forEach(function (a, k) { if (a[1] === sec) { pos.push(k); items.push(a); } });
      var rank = {}; r[2].forEach(function (id, k) { rank[id] = k; });
      items.sort(function (a, b) { var x = rank[a[0]], y = rank[b[0]]; return (x === undefined ? 1e9 : x) - (y === undefined ? 1e9 : y); });
      pos.forEach(function (k, j) { D.qs[k] = items[j]; });
    });
    var secIds = {}; D.secs.forEach(function (s) { secIds[s.id] = 1; });
    D.qs = D.qs.filter(function (a) { return secIds[a[1]]; });
    if (D.qq) rows('qq').forEach(function (r) {
      var n = +r[1], i = D.qq.findIndex(function (a) { return a[0] === n; });
      if (r[2] === null) { if (i >= 0) D.qq.splice(i, 1); } else if (i >= 0) D.qq[i] = r[2];
    });
    if (rows('qh').length) { D.qh = D.qh || {}; rows('qh').forEach(function (r) { if (r[2]) D.qh[r[1]] = r[2]; else delete D.qh[r[1]]; }); }
    return D;
  }
  function raw(R) {
    var keys = R.map(function (_, i) { return String(i); });
    window.__bwBase = { n: R.length };
    if (P.length) {
      var list = R.map(function (q, i) { return { k: String(i), q: q }; }), at = {};
      list.forEach(function (x, i) { at[x.k] = i; });
      rows('r').forEach(function (r) {
        if (at[r[1]] !== undefined) list[at[r[1]]].q = r[2];
        else if (r[2] !== null) { at[r[1]] = list.length; list.push({ k: r[1], q: r[2] }); }
      });
      list = list.filter(function (x) { return x.q !== null; });
      R.length = 0; list.forEach(function (x) { R.push(x.q); });
      keys = list.map(function (x) { return x.k; });
    }
    window.__bwRawKeys = keys;
    return R;
  }
  function key(K) {
    var a = Array.from(K);
    window.__bwBase = { n: a.length, key: K };
    rows('k').forEach(function (r) { var i = +r[1] - 1; if (i >= 0 && i < a.length && r[2]) a[i] = r[2]; });
    return a.join('');
  }
})();
