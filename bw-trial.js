(function () {
  var end = window.__bwTrialEnd; if (!end) return;
  var d = document.createElement('div');
  d.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:2147483000;background:#12345a;color:#fff;padding:9px 14px;border-radius:99px;font:700 13px Cairo,Tahoma,Arial,sans-serif;box-shadow:0 4px 16px #0005;direction:rtl;display:flex;gap:10px;align-items:center';
  document.body.appendChild(d);
  function fmt(ms) { var m = Math.max(0, Math.ceil(ms / 60000)); if (m >= 1440) return Math.floor(m / 1440) + ' يوم'; if (m >= 60) return Math.floor(m / 60) + ' ساعة'; return m + ' دقيقة'; }
  function tick() { d.innerHTML = '🎁 تجربة مجانية — متبقي ' + fmt(end - Date.now()) + ' <a href="/login?next=' + encodeURIComponent(location.pathname) + '" style="background:#f2b705;color:#12345a;padding:4px 10px;border-radius:99px;text-decoration:none">سجّل بكودك</a>'; }
  tick(); setInterval(tick, 30000);
})();
