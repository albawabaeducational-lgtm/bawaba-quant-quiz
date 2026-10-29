// المظهر الفاتح/الداكن لصفحات الإدارة والحساب والدخول (صفحات الاختبارات يتولاها bw-shell.js بنفس المفتاح).
// الافتراضي فاتح؛ الداكن فقط حين يختاره المستخدم صراحة. الداكن = عكس ألوان موحّد يحافظ على التباين، والصور تبقى بألوانها.
(function () {
  var KEY = 'bw-user-theme', root = document.documentElement;
  if (!document.getElementById('bw-dark-css')) {
    var st = document.createElement('style'); st.id = 'bw-dark-css';
    st.textContent = 'html.bw-user-dark{filter:invert(.9) hue-rotate(180deg);background:#fff}html.bw-user-dark img,html.bw-user-dark video,html.bw-user-dark canvas,html.bw-user-dark picture,html.bw-user-dark [data-bw-keep]{filter:invert(1) hue-rotate(180deg)}'
      + '.bw-admin-theme{position:fixed;z-index:1000;bottom:14px;left:14px;width:42px;height:42px;border:1px solid #ffffff55;border-radius:50%;background:#12345a;color:#fff;cursor:pointer;font:700 18px/1 Tahoma,Arial,sans-serif;box-shadow:0 4px 14px #0003}'
      + 'body.admin-page .toasts{bottom:66px!important}'
      + '.bw-account-theme{flex:none;width:40px;height:40px;border:1px solid #ffffff55;border-radius:11px;background:#ffffff14;color:#fff;cursor:pointer;font:700 18px/1 Tahoma,Arial,sans-serif}';
    (document.head || root).appendChild(st);
  }
  var mode = 'light'; try { mode = localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch (e) { }
  var btns = document.querySelectorAll('[data-bw-global-theme]');
  function apply() {
    root.classList.toggle('bw-user-dark', mode === 'dark');
    [].forEach.call(btns, function (b) { b.textContent = mode === 'dark' ? '☀' : '☾'; b.title = mode === 'dark' ? 'التبديل إلى المظهر الفاتح' : 'التبديل إلى المظهر الداكن'; b.setAttribute('aria-label', b.title); b.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false'); });
  }
  [].forEach.call(btns, function (b) { b.addEventListener('click', function () { mode = mode === 'dark' ? 'light' : 'dark'; try { localStorage.setItem(KEY, mode); } catch (e) { } apply(); }); });
  apply();
})();
