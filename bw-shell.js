// الشريط العلوي الموحد لصفحات الاختبارات: ينقل أدوات الصفحة (المؤقت، الأسئلة الخاطئة) إليه.
(function () {
  var sh = document.getElementById('bw-shell'); if (!sh) return;
  var tools = sh.querySelector('.bws-tools');
  var hr = document.querySelector('header.top .hr');
  if (hr && tools) { while (hr.firstChild) tools.appendChild(hr.firstChild); }
})();
