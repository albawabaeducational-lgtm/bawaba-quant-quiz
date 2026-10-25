// بنك الأسئلة الموحد في لوحة التحكم: تصفّح وتعديل وتصنيف، وإضافة الأسئلة بطرق متعددة
// (ملف مودل XML، صور بالجملة، إكسيل/CSV، لصق نص، سؤال واحد) مع معاينة وكشف التكرار قبل الحفظ، والتصدير.
// يعتمد على دوال لوحة التحكم: api, esc, toast, dialog, confirmBox, can.
(function () {
  'use strict';
  var LT = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'], DIFF = ['غير محدد', 'سهل', 'متوسط', 'صعب'];
  var B = window.BWBANK = { tab: 'browse', f: { subject: 'kamy', skill: '', source: '', status: '', issue: '', q: '', page: 0 }, sel: {}, imp: null, meta: null, list: null };
  var $b = function (id) { return document.getElementById(id); };
  function root() { return $b('bwbank'); }
  function E(s) { return window.esc ? window.esc(s) : String(s == null ? '' : s); }
  function T(m, k) { if (window.toast) window.toast(m, k); }
  function skillsOf(sub) { return ((B.meta && B.meta.skills) || []).filter(function (x) { return x.subject === sub; }); }
  function skillName(id) { var s = ((B.meta && B.meta.skills) || []).filter(function (x) { return x.id === id; })[0]; return s ? s.name : ''; }
  function norm(t) { return String(t || '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ً-ْـ]/g, '').replace(/[()–\-]/g, ' ').replace(/\s+/g, ' ').trim(); }

  // ===== أدوات الصور: ضغط إلى webp بعرض ≤ ١٠٠٠، وبصمة (dHash) لكشف التكرار =====
  function loadImg(src) { return new Promise(function (ok, no) { var i = new Image(); i.crossOrigin = 'anonymous'; i.onload = function () { ok(i); }; i.onerror = no; i.src = src; }); }
  function dhash(img) {
    var c = document.createElement('canvas'); c.width = 9; c.height = 8; var x = c.getContext('2d'); x.drawImage(img, 0, 0, 9, 8);
    var d = x.getImageData(0, 0, 9, 8).data, bits = '', h = '';
    for (var r = 0; r < 8; r++) for (var k = 0; k < 8; k++) { var a = (r * 9 + k) * 4, b = a + 4; bits += (d[a] * .3 + d[a + 1] * .59 + d[a + 2] * .11) > (d[b] * .3 + d[b + 1] * .59 + d[b + 2] * .11) ? '1' : '0'; }
    for (var i = 0; i < 64; i += 4) h += parseInt(bits.slice(i, i + 4), 2).toString(16);
    return h;
  }
  function compress(src) {
    return loadImg(src).then(function (img) {
      var w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, 1000 / w), c = document.createElement('canvas');
      c.width = Math.round(w * s); c.height = Math.round(h * s); var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      var data = c.toDataURL('image/webp', .78); if (data.indexOf('data:image/webp') !== 0) data = c.toDataURL('image/jpeg', .85);
      return { data: data, hash: dhash(img) };
    });
  }
  function fileData(f) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = no; r.readAsDataURL(f); }); }

  // ===== القسم =====
  B.draw = function () { return '<div id="bwbank"><div class="card"><div class="empty">جارٍ تحميل بنك الأسئلة…</div></div></div>'; };
  B.after = function () { loadMeta().then(render); };
  function loadMeta() { return window.api('bank/meta').then(function (r) { B.meta = r; }).catch(function (e) { if (e) T(e.message, 'err'); }); }
  function render() {
    var r = root(); if (!r || !B.meta) return;
    var P = B.meta.perms, h = '<div class="row" style="margin-bottom:12px">' + [['browse', 'الأسئلة'], P.import ? ['add', '+ إضافة أسئلة'] : null, ['export', 'تصدير']].filter(Boolean).map(function (t) { return '<button class="' + (B.tab === t[0] ? '' : 'g') + '" data-bk="tab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    if (B.tab === 'browse') h += browseHtml(); else if (B.tab === 'add') h += addHtml(); else h += exportHtml();
    var fq = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.bkf === 'q';
    r.innerHTML = h;
    if (fq) { var qi = r.querySelector('[data-bkf="q"]'); if (qi) { qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); } }
    if (B.tab === 'browse' && !B.list) loadList();
  }

  // ===== تصفّح البنك =====
  function counts(sub) { var n = 0, a = 0; (B.meta.counts || []).forEach(function (c) { if (c.subject === sub) { n += c.n; a += c.unskilled; } }); return { n: n, un: a }; }
  function browseHtml() {
    var f = B.f, M = B.meta, h = '<div class="card"><div class="row">' + Object.keys(M.subjects).map(function (s) { var c = counts(s); return '<button class="' + (f.subject === s ? '' : 'g') + '" data-bk="subj" data-v="' + s + '">' + E(M.subjects[s]) + ' <span class="b in" style="margin-inline-start:6px">' + c.n + '</span></button>'; }).join('') + '</div>';
    var srcs = (M.sources || []).filter(function (x) { return x.subject === f.subject; });
    h += '<div class="row" style="margin-top:12px;gap:8px">'
      + '<select data-bkf="skill" style="max-width:240px"><option value="">كل المهارات</option><option value="none"' + (f.skill === 'none' ? ' selected' : '') + '>غير مصنفة</option>' + skillsOf(f.subject).map(function (x) { return '<option value="' + x.id + '"' + (String(f.skill) === String(x.id) ? ' selected' : '') + '>' + E(x.name) + '</option>'; }).join('') + '</select>'
      + '<select data-bkf="source" style="max-width:260px"><option value="">كل المصادر</option>' + srcs.map(function (x) { return '<option' + (f.source === x.source ? ' selected' : '') + ' value="' + E(x.source) + '">' + E(x.source) + ' (' + x.n + ')</option>'; }).join('') + '</select>'
      + '<select data-bkf="issue"><option value="">كل الأسئلة</option><option value="nocorrect"' + (f.issue === 'nocorrect' ? ' selected' : '') + '>بلا إجابة صحيحة</option><option value="short"' + (f.issue === 'short' ? ' selected' : '') + '>اختيارات ناقصة (أقل من ٤)</option><option value="multi"' + (f.issue === 'multi' ? ' selected' : '') + '>أكثر من إجابة صحيحة</option></select>'
      + '<select data-bkf="status"><option value="">نشطة ومسودات</option><option value="active"' + (f.status === 'active' ? ' selected' : '') + '>نشطة</option><option value="draft"' + (f.status === 'draft' ? ' selected' : '') + '>مسودات</option></select>'
      + '<input data-bkf="q" placeholder="بحث في النص أو رقم السؤال" value="' + E(f.q) + '" style="max-width:220px"></div></div>';
    if (M.perms.legacy) h += legacyHtml();
    var L = B.list, ids = Object.keys(B.sel);
    if (ids.length) h += '<div class="card" style="position:sticky;top:8px;z-index:5;border-color:var(--navy)"><div class="row"><b>تم تحديد ' + ids.length + ' سؤالًا</b>'
      + (M.perms.edit ? '<select id="bkBulkSkill" style="max-width:240px"><option value="">— نقل لمهارة —</option><option value="0">إلغاء التصنيف</option>' + skillsOf(B.f.subject).map(function (x) { return '<option value="' + x.id + '">' + E(x.name) + '</option>'; }).join('') + '</select><select id="bkBulkDiff"><option value="">— الصعوبة —</option>' + DIFF.map(function (d, i) { return '<option value="' + i + '">' + d + '</option>'; }).join('') + '</select><button class="g sm" data-bk="bulkSrc">تغيير المصدر</button><button class="g sm" data-bk="bulkStatus" data-v="draft">مسودة</button><button class="g sm" data-bk="bulkStatus" data-v="active">تفعيل</button>' : '')
      + (M.perms.del ? '<button class="r sm" data-bk="bulkDel">حذف</button>' : '') + '<button class="g sm" data-bk="selNone">إلغاء التحديد</button></div></div>';
    if (!L) return h + '<div class="card"><div class="empty">جارٍ التحميل…</div></div>';
    var pages = Math.ceil(L.total / L.size);
    h += '<div class="card"><div class="row" style="justify-content:space-between"><b>' + L.total + ' سؤالًا</b><div class="row">' + (L.items.length ? '<button class="g sm" data-bk="selPage">تحديد الصفحة</button>' : '') + (M.perms.import ? '<button class="sm" data-bk="new">+ سؤال جديد</button>' : '') + '</div></div>';
    if (!L.items.length) h += '<div class="empty">لا توجد أسئلة بهذه التصفية.' + (M.perms.legacy && !counts(B.f.subject).n ? ' ابدأ بنقل أسئلة الصفحات الحالية من الأعلى.' : '') + '</div>';
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin-top:12px">' + L.items.map(cardHtml).join('') + '</div>';
    if (pages > 1) h += '<div class="row" style="justify-content:center;margin-top:14px"><button class="g sm" data-bk="page" data-v="' + (L.page - 1) + '"' + (L.page ? '' : ' disabled') + '>→ السابق</button><span class="m">صفحة ' + (L.page + 1) + ' من ' + pages + '</span><button class="g sm" data-bk="page" data-v="' + (L.page + 1) + '"' + (L.page < pages - 1 ? '' : ' disabled') + '>التالي ←</button></div>';
    return h + '</div>';
  }
  function cardHtml(q) {
    var bad = !q.correct.length, on = !!B.sel[q.id];
    return '<div class="kq" style="border:1.5px solid ' + (on ? 'var(--navy)' : bad ? '#f0b9ae' : 'var(--line)') + ';border-radius:14px;overflow:hidden;background:#fff;display:flex;flex-direction:column">'
      + '<div data-bk="open" data-v="' + q.id + '" style="cursor:pointer;flex:1">' + (q.img ? '<img src="' + E(q.img) + '" loading="lazy" alt="" style="width:100%;aspect-ratio:3/2;object-fit:contain;background:#f6f9fc;display:block">' : '<div style="padding:10px 12px;min-height:90px;font-size:13.5px;line-height:1.8">' + E(String(q.stem || '').slice(0, 160)) + '</div>') + '</div>'
      + '<div style="padding:8px 10px;font-size:12px;border-top:1px solid var(--line);display:grid;gap:4px"><div class="row" style="gap:6px;justify-content:space-between"><label class="m"><input type="checkbox" data-bksel="' + q.id + '"' + (on ? ' checked' : '') + '> #' + q.id + '</label><span>' + (bad ? '<span class="b no">بلا إجابة</span>' : 'الإجابة: <b>' + q.correct.map(function (i) { return LT[i]; }).join(' و') + '</b>') + (q.options.length < 4 ? ' <span class="b wn">' + q.options.length + ' اختيارات</span>' : '') + (q.status === 'draft' ? ' <span class="b mu">مسودة</span>' : '') + '</span></div>'
      + '<div class="m" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (q.skill_id ? '◈ ' + E(skillName(q.skill_id)) : '<span style="color:#b4321f">غير مصنف</span>') + '</div><div class="m" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + E(q.source || '') + '</div></div></div>';
  }
  function loadList() {
    var f = B.f, qs = 'bank/list?subject=' + f.subject + '&skill=' + encodeURIComponent(f.skill) + '&source=' + encodeURIComponent(f.source) + '&status=' + f.status + '&issue=' + f.issue + '&q=' + encodeURIComponent(f.q) + '&page=' + f.page + '&size=40';
    return window.api(qs).then(function (r) { B.list = r; render(); }).catch(function (e) { if (e) T(e.message, 'err'); });
  }
  function reload() { B.list = null; return loadMeta().then(function () { render(); }); }

  // ===== نقل أسئلة الصفحات الحالية =====
  function legacyHtml() {
    var c = counts(B.f.subject).n;
    var banks = B.f.subject === 'kamy' ? [['aksam kamy', 'أقسام الكمي'], ['aktar kamy', 'الأكثر تكرارًا – كمي']] : [['aksam lafzi', 'أقسام اللفظي']];
    var nohash = ((B.meta.issues || []).filter(function (x) { return x.subject === B.f.subject; })[0] || {}).nohash || 0;
    return '<details class="card"' + (c ? '' : ' open') + '><summary style="cursor:pointer;font-weight:700">نقل أسئلة الصفحات الحالية إلى البنك</summary><p class="m" style="margin:8px 0">يُنقل كل سؤال مرة واحدة ومعه تصنيف مهارته. التكرار يُتجاهل، فيمكنك إعادة النقل بأمان بعد أي تعديل في الصفحات.</p><div class="row">' + banks.map(function (b) { return '<button class="g" data-bk="legacy" data-v="' + b[0] + '">نقل ' + b[1] + '</button>'; }).join('') + '</div>'
      + (nohash ? '<p class="m" style="margin:10px 0 4px">' + nohash + ' سؤالًا بالصور بلا بصمة لكشف التكرار.</p><button class="g sm" data-bk="hashes">تجهيز كشف التكرار لها</button>' : '') + '<div id="bkLegacyMsg" class="m" style="margin-top:8px"></div></details>';
  }
  function runLegacy(slug) {
    var msg = $b('bkLegacyMsg'), from = 0, added = 0;
    var step = function () { return window.api('bank/legacy', { course: slug, from: from }).then(function (r) { added += r.added; from = r.done; if (msg) msg.textContent = 'جارٍ النقل… ' + r.done + ' من ' + r.total + ' (أُضيف ' + added + ')'; if (r.done < r.total) return step(); T('تم نقل ' + added + ' سؤالًا جديدًا', 'ok'); return reload(); }); };
    return step().catch(function (e) { if (e) T(e.message, 'err'); });
  }
  function runHashes() {
    var msg = $b('bkLegacyMsg'), done = 0, buf = [];
    fetchAll({ subject: B.f.subject }).then(function (all) {
      var todo = all.filter(function (q) { return !q.hash && q.img; }), idx = 0;
      var flush = function () { if (!buf.length) return Promise.resolve(); var part = buf.splice(0); return window.api('bank/sethash', { items: part }); };
      var worker = async function () { while (idx < todo.length) { var q = todo[idx++]; try { var img = await loadImg(q.img); buf.push({ id: q.id, hash: dhash(img) }); } catch (e) { } done++; if (msg) msg.textContent = 'تجهيز البصمات… ' + done + ' من ' + todo.length; if (buf.length >= 200) await flush(); } };
      return Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]).then(flush);
    }).then(function () { T('تم تجهيز كشف التكرار', 'ok'); reload(); }).catch(function (e) { if (e) T(e.message, 'err'); });
  }
  function fetchAll(f) {
    var out = [], page = 0, q = 'bank/list?subject=' + (f.subject || '') + '&skill=' + encodeURIComponent(f.skill || '') + '&source=' + encodeURIComponent(f.source || '') + '&status=' + (f.status || '') + '&issue=' + (f.issue || '') + '&q=' + encodeURIComponent(f.q || '') + '&size=100&page=';
    var step = function () { return window.api(q + page).then(function (r) { out = out.concat(r.items); page++; if (page * r.size < r.total) return step(); return out; }); };
    return step();
  }

  // ===== محرر السؤال (يُستخدم للتعديل وللإضافة ولتعديل سؤال قبل الاستيراد) =====
  function editor(q, onSave, opts) {
    opts = opts || {};
    q = JSON.parse(JSON.stringify(q || { subject: B.f.subject, options: ['أ', 'ب', 'ج', 'د'], correct: [], multi: false, difficulty: 0, status: 'active' }));
    var o = window.dialog('<div id="bkEd"></div>');
    var dlg = o.querySelector('.dlg'); if (dlg) dlg.style.width = 'min(980px,100%)';
    var box = o.querySelector('#bkEd');
    function draw() {
      var sk = skillsOf(q.subject), srcs = ((B.meta && B.meta.sources) || []).filter(function (x) { return x.subject === q.subject; });
      box.innerHTML = '<h3 style="margin-top:0">' + (opts.title || (q.id ? 'تعديل السؤال #' + q.id : 'سؤال جديد')) + '</h3>'
        + '<div style="display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:16px">'
        + '<div><div style="border:1.5px dashed var(--line);border-radius:12px;padding:10px;text-align:center;background:#f8fbfd">' + (q.img || q.img_data ? '<img src="' + E(q.img_data || q.img) + '" style="max-width:100%;border-radius:8px;display:block;margin:0 auto 8px">' : '<p class="m" style="margin:14px 0">لا توجد صورة · يمكنك لصق صورة (Ctrl+V)</p>') + '<label class="btn sm" style="display:inline-flex;background:#e3ebf3;color:var(--navy);cursor:pointer">📷 ' + (q.img || q.img_data ? 'استبدال الصورة' : 'إضافة صورة') + '<input type="file" accept="image/*" data-ed="img" style="display:none"></label>' + (q.img || q.img_data ? ' <button class="g sm" data-ed="noimg">إزالة الصورة</button>' : '') + '</div>'
        + '<label style="display:block;margin-top:10px;font-weight:700">نص السؤال</label><textarea data-ed="stem" rows="3" style="width:100%">' + E(q.stem || '') + '</textarea>'
        + '<details' + (q.passage ? ' open' : '') + '><summary class="m" style="cursor:pointer;margin-top:6px">نص مرافق (قطعة استيعاب)</summary><textarea data-ed="passage" rows="4" style="width:100%">' + E(q.passage || '') + '</textarea></details>'
        + '<label style="display:block;margin-top:10px;font-weight:700">شرح الإجابة (اختياري)</label><textarea data-ed="explanation" rows="2" style="width:100%">' + E(q.explanation || '') + '</textarea></div>'
        + '<div><label style="display:block;font-weight:700">الاختيارات والإجابة الصحيحة</label><label class="m" style="display:block;margin:4px 0 8px"><input type="checkbox" data-ed="multi"' + (q.multi ? ' checked' : '') + '> أكثر من إجابة صحيحة (مثل: إجابة صحيحة وإجابة أصح)</label>'
        + q.options.map(function (op, i) { var on = q.correct.indexOf(i) >= 0; return '<div class="row" style="gap:6px;flex-wrap:nowrap;margin-bottom:6px;padding:4px 6px;border-radius:10px;' + (on ? 'background:#e1f4ea' : '') + '"><label style="display:flex;align-items:center;gap:4px;white-space:nowrap"><input type="' + (q.multi ? 'checkbox' : 'radio') + '" name="bkc" data-ed="c" data-i="' + i + '"' + (on ? ' checked' : '') + '><b>' + LT[i] + '</b></label><input data-ed="opt" data-i="' + i + '" value="' + E(op) + '" style="flex:1;min-width:0">' + (q.options.length > 2 ? '<button class="g sm" data-ed="rm" data-i="' + i + '" title="حذف الاختيار">✕</button>' : '') + '</div>'; }).join('')
        + (q.options.length < 6 ? '<button class="g sm" data-ed="add">+ اختيار</button>' : '') + '<p class="m" style="margin:6px 0 0">لو الاختيارات مكتوبة داخل الصورة، اترك الحروف كما هي (أ، ب، ج، د). ولو بعضها ناقص احذف الزائد.</p>'
        + '<label style="display:block;margin-top:12px;font-weight:700">المادة</label><select data-ed="subject">' + Object.keys(B.meta.subjects).map(function (s) { return '<option value="' + s + '"' + (q.subject === s ? ' selected' : '') + '>' + E(B.meta.subjects[s]) + '</option>'; }).join('') + '</select>'
        + '<label style="display:block;margin-top:10px;font-weight:700">المهارة</label><input data-ed="skq" placeholder="ابحث عن المهارة…" value=""><div data-ed="skres" style="margin-top:4px"></div><div class="m" style="margin-top:4px">الحالية: <b>' + (q.skill_id ? E(skillName(q.skill_id)) : '—') + '</b>' + (q.skill_id ? ' <button class="g sm" data-ed="noskill">إلغاء</button>' : '') + '</div>'
        + '<div class="row" style="margin-top:10px;gap:8px"><label class="m">الصعوبة <select data-ed="difficulty">' + DIFF.map(function (d, i) { return '<option value="' + i + '"' + (+q.difficulty === i ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select></label><label class="m">الحالة <select data-ed="status"><option value="active"' + (q.status !== 'draft' ? ' selected' : '') + '>نشط</option><option value="draft"' + (q.status === 'draft' ? ' selected' : '') + '>مسودة</option></select></label></div>'
        + '<label style="display:block;margin-top:10px;font-weight:700">المصدر</label><input data-ed="source" list="bkSrcList" value="' + E(q.source || '') + '" placeholder="مثل: الأكثر تكرارًا – النموذج ٥" style="width:100%"><datalist id="bkSrcList">' + srcs.map(function (x) { return '<option value="' + E(x.source) + '">'; }).join('') + '</datalist></div></div>'
        + '<div class="acts" style="margin-top:16px"><button data-ed="save">' + (opts.saveLabel || 'حفظ') + '</button><button class="g" data-ed="close">إلغاء</button>' + (q.id && B.meta.perms.del && !opts.noDelete ? '<button class="r" data-ed="del" style="margin-inline-start:auto">حذف السؤال</button>' : '') + '</div>';
    }
    function skRes() { var v = box.querySelector('[data-ed="skq"]'), r = box.querySelector('[data-ed="skres"]'); if (!v || !r) return; var w = norm(v.value).split(' ').filter(Boolean); if (!w.length) { r.innerHTML = ''; return; } r.innerHTML = skillsOf(q.subject).filter(function (x) { var n = norm(x.name); return w.every(function (k) { return n.indexOf(k) >= 0; }); }).slice(0, 10).map(function (x) { return '<button class="g sm" style="margin:2px" data-ed="sk" data-i="' + x.id + '">' + E(x.name) + '</button>'; }).join('') || '<span class="m">لا توجد مهارة بهذا الاسم</span>'; }
    function setImg(f) { compress(URL.createObjectURL(f)).then(function (r) { q.img_data = r.data; q.hash = r.hash; q.image_id = null; q.image_url = null; q.img = null; draw(); }).catch(function () { T('تعذّر قراءة الصورة', 'err'); }); }
    draw();
    box.addEventListener('input', function (e) { var t = e.target, k = t.dataset.ed; if (k === 'stem' || k === 'passage' || k === 'explanation' || k === 'source') q[k] = t.value; else if (k === 'opt') q.options[+t.dataset.i] = t.value; else if (k === 'skq') skRes(); });
    box.addEventListener('change', function (e) {
      var t = e.target, k = t.dataset.ed;
      if (k === 'img' && t.files[0]) setImg(t.files[0]);
      else if (k === 'multi') { q.multi = t.checked; if (!q.multi) q.correct = q.correct.slice(0, 1); draw(); }
      else if (k === 'c') { var i = +t.dataset.i; if (q.multi) { q.correct = t.checked ? q.correct.concat(i) : q.correct.filter(function (x) { return x !== i; }); } else q.correct = [i]; draw(); }
      else if (k === 'subject') { q.subject = t.value; q.skill_id = null; draw(); }
      else if (k === 'difficulty') q.difficulty = +t.value; else if (k === 'status') q.status = t.value;
    });
    box.addEventListener('paste', function (e) { var it = [].slice.call((e.clipboardData || {}).items || []).filter(function (i) { return /^image\//.test(i.type); })[0]; if (it) { e.preventDefault(); setImg(it.getAsFile()); } });
    box.addEventListener('keydown', function (e) { if (e.target.dataset.ed === 'skq' && e.key === 'Enter') { e.preventDefault(); var b = box.querySelector('[data-ed="sk"]'); if (b) b.click(); } });
    box.addEventListener('click', async function (e) {
      var b = e.target.closest('[data-ed]'); if (!b || b.tagName === 'INPUT' || b.tagName === 'TEXTAREA' || b.tagName === 'SELECT') return; var k = b.dataset.ed;
      if (k === 'close') o.remove();
      else if (k === 'noimg') { q.img = q.img_data = null; q.image_id = null; q.image_url = null; q.hash = null; draw(); }
      else if (k === 'add') { q.options.push(q.img || q.img_data ? LT[q.options.length] : ''); draw(); }
      else if (k === 'rm') { var i = +b.dataset.i; q.options.splice(i, 1); q.correct = q.correct.filter(function (x) { return x !== i; }).map(function (x) { return x > i ? x - 1 : x; }); draw(); }
      else if (k === 'sk') { q.skill_id = +b.dataset.i; draw(); }
      else if (k === 'noskill') { q.skill_id = null; draw(); }
      else if (k === 'del') { if (await window.confirmBox('حذف السؤال #' + q.id + ' من البنك نهائيًا؟', true)) { try { await window.api('bank/delete', { ids: [q.id] }); o.remove(); T('تم الحذف', 'ok'); B.list = null; reload(); } catch (er) { if (er) T(er.message, 'err'); } } }
      else if (k === 'save') {
        if (!q.correct.length && q.status !== 'draft' && !(await window.confirmBox('لم تحدد الإجابة الصحيحة. يُحفظ السؤال كمسودة؟'))) return;
        if (!q.correct.length) q.status = 'draft';
        b.disabled = true;
        try { await onSave(q); o.remove(); } catch (er) { b.disabled = false; if (er) T(er.message, 'err'); }
      }
    });
    return o;
  }
  async function saveToBank(q) {
    if (q.img_data) { var up = await window.api('bank/image', { data: q.img_data }); q.image_id = up.id; q.image_url = null; q.img_data = null; }
    var r = await window.api('bank/save', q); T('تم الحفظ', 'ok'); B.list = null; reload(); return r;
  }

  // ===== إضافة أسئلة =====
  function addHtml() {
    var I = B.imp;
    if (I && I.items) return previewHtml();
    return '<div class="card"><h2>اختر طريقة الإضافة</h2><p class="m">كل الطرق تعرض لك الأسئلة للمراجعة قبل الحفظ، مع تنبيه للأسئلة المكررة أو الناقصة.</p>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin-top:12px">'
      + [['moodle', '📦 ملف مودل (XML)', 'صدّر الأسئلة من مودل ثم ارفع الملف هنا. تدخل بصورها وإجاباتها.'], ['images', '🖼️ صور بالجملة', 'ارفع مجموعة سكرين شوت مرة واحدة، ثم اكتب مفتاح الإجابات سطرًا واحدًا.'], ['excel', '📊 إكسيل / CSV', 'للأسئلة النصية: عمود للسؤال وأعمدة للاختيارات والإجابة والمهارة.'], ['paste', '📋 لصق نص', 'الصق أسئلة من Word أو أي مكان بصيغة بسيطة.'], ['single', '✏️ سؤال واحد', 'أضف سؤالًا بنفسك بصورة أو نص.']].map(function (m) { return '<button class="g" data-bk="method" data-v="' + m[0] + '" style="text-align:start;padding:16px;display:block;height:auto;white-space:normal"><b style="font-size:16px;display:block">' + m[1] + '</b><span class="m" style="display:block;margin-top:4px;font-weight:500">' + m[2] + '</span></button>'; }).join('') + '</div></div>'
      + (I && I.method ? methodHtml(I.method) : '');
  }
  function commonFields() {
    var I = B.imp, M = B.meta;
    return '<div class="row" style="gap:10px;margin-top:10px"><label class="m">المادة <select id="bkImpSub">' + Object.keys(M.subjects).map(function (s) { return '<option value="' + s + '"' + (I.subject === s ? ' selected' : '') + '>' + E(M.subjects[s]) + '</option>'; }).join('') + '</select></label>'
      + '<label class="m">المصدر <input id="bkImpSrc" value="' + E(I.source || '') + '" placeholder="مثل: تجميعات أكتوبر ٢٠٢٦" style="width:240px"></label>'
      + '<label class="m">مهارة لكل الأسئلة (اختياري) <select id="bkImpSkill" style="max-width:220px"><option value="">— بدون —</option>' + skillsOf(I.subject).map(function (x) { return '<option value="' + x.id + '"' + (+I.skill_id === x.id ? ' selected' : '') + '>' + E(x.name) + '</option>'; }).join('') + '</select></label></div>';
  }
  function methodHtml(m) {
    var h = '<div class="card">';
    if (m === 'moodle') h += '<h2>📦 ملف مودل (XML)</h2><p class="m">من مودل: بنك الأسئلة ← تصدير ← صيغة Moodle XML. يدعم أسئلة الاختيار من متعدد بالصور والنصوص، وأي عدد من الإجابات الصحيحة. التصنيفات في الملف تصبح «المصدر».</p>' + commonFields() + '<label class="btn" style="display:inline-flex;margin-top:12px;cursor:pointer">اختر ملف XML<input type="file" accept=".xml,text/xml" id="bkFileXml" style="display:none"></label>';
    else if (m === 'images') h += '<h2>🖼️ صور بالجملة</h2><p class="m">اختر الصور مرة واحدة (أو اسحبها هنا). تُرتب حسب الأرقام في أسمائها (1، 2، 3…). كل صورة = سؤال، والاختيارات أ ب ج د داخل الصورة.</p>' + commonFields() + '<div id="bkDrop" style="margin-top:12px;border:2px dashed var(--line);border-radius:14px;padding:26px;text-align:center"><label class="btn" style="display:inline-flex;cursor:pointer">اختر الصور<input type="file" accept="image/*" multiple id="bkFileImgs" style="display:none"></label><p class="m" style="margin-top:8px">أو اسحب الصور وأفلتها هنا</p></div>';
    else if (m === 'excel') h += '<h2>📊 إكسيل / CSV</h2><p class="m">نزّل القالب واملأه: سطر لكل سؤال. عمود «الإجابة» بالحرف (ب)، ولو أكثر من إجابة صحيحة اكتبها هكذا: أ،ج. المهارة تُكتب باسمها كما في القائمة.</p>' + commonFields() + '<div class="row" style="margin-top:12px"><button class="g" data-bk="tpl">⬇ تنزيل القالب</button><label class="btn" style="display:inline-flex;cursor:pointer">اختر ملف إكسيل أو CSV<input type="file" accept=".xlsx,.xls,.csv" id="bkFileXls" style="display:none"></label></div>';
    else if (m === 'paste') h += '<h2>📋 لصق نص</h2><p class="m">سطر فاضي بين كل سؤال والتاني. الاختيارات تبدأ بـ أ) ب) ج) د) (أو A) B) أو 1) 2))، والإجابة في سطر «الإجابة: ب». ممكن بدلها تحط * قبل الاختيار الصحيح.</p>' + commonFields()
      + '<textarea id="bkPaste" rows="12" style="width:100%;margin-top:10px;font-family:inherit" placeholder="ما ناتج ٢٥ × ٤ ؟\nأ) ٨٠\nب) ١٠٠\nج) ١٢٠\nد) ٩٠\nالإجابة: ب\n\nبحر : ملح\nأ) حبر : زرقة\n*ب) ليمون : حامض\nج) نهر : رمل\nد) ماء : عذب"></textarea><div class="row" style="margin-top:10px"><button data-bk="parsePaste">معاينة الأسئلة</button></div>';
    else if (m === 'single') { setTimeout(function () { editor(null, saveToBank); B.imp = null; render(); }, 0); return ''; }
    return h + '<div id="bkProg" class="m" style="margin-top:10px"></div></div>';
  }
  function readCommon() { var I = B.imp; var s = $b('bkImpSub'), r = $b('bkImpSrc'), k = $b('bkImpSkill'); if (s) I.subject = s.value; if (r) I.source = r.value.trim(); if (k) I.skill_id = k.value ? +k.value : null; }
  function prog(t) { var p = $b('bkProg'); if (p) p.textContent = t; }

  // --- مودل XML (يُقرأ داخل المتصفح سؤالًا سؤالًا، حتى الملفات الكبيرة) ---
  function strip(h) { var d = document.createElement('div'); d.innerHTML = String(h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n'); return d.textContent.replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim(); }
  function cdata(x) { return String(x || '').replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, ''); }
  function between(s, a, b, from) { var i = s.indexOf(a, from || 0); if (i < 0) return null; var j = s.indexOf(b, i + a.length); if (j < 0) return null; return { v: s.slice(i + a.length, j), end: j + b.length, start: i }; }
  async function parseMoodle(file) {
    readCommon(); prog('جارٍ قراءة الملف…');
    var s = await file.text(), pos = 0, cat = '', items = [], n = 0, skipped = 0;
    while (true) {
      var i = s.indexOf('<question type="', pos); if (i < 0) break;
      var j = s.indexOf('</question>', i); if (j < 0) break;
      var blk = s.slice(i, j); pos = j + 11;
      var type = /^<question type="([^"]+)"/.exec(blk)[1];
      if (type === 'category') { var c = between(blk, '<text>', '</text>'); if (c) cat = c.v.replace(/^\$[^$]*\$\//, '').split('/').filter(Boolean).pop() || ''; continue; }
      if (type !== 'multichoice') { skipped++; continue; }
      var qt = between(blk, '<questiontext', '</questiontext>'), qh = qt ? cdata((between(qt.v, '<text>', '</text>') || { v: '' }).v) : '';
      var files = {}; (qt ? qt.v : '').replace(/<file name="([^"]+)"[^>]*>([\s\S]*?)<\/file>/g, function (_, nm, b64) { files[nm] = b64.replace(/\s+/g, ''); return ''; });
      var im = /<img[^>]*src="([^"]+)"/i.exec(qh), src = null;
      if (im) { var u = im[1]; if (/^data:image/.test(u)) src = u.replace(/\s+/g, ''); else { var nm = decodeURIComponent(u.replace('@@PLUGINFILE@@/', '').split('?')[0]); var key = files[nm] ? nm : Object.keys(files)[0]; if (key) src = 'data:image/' + (/\.png$/i.test(key) ? 'png' : 'jpeg') + ';base64,' + files[key]; } }
      var opts = [], corr = [], k = 0;
      blk.replace(/<answer fraction="([^"]+)"[^>]*>([\s\S]*?)<\/answer>/g, function (_, fr, body) { var t = between(body, '<text>', '</text>'); opts.push(strip(cdata(t ? t.v : ''))); if (parseFloat(fr) > 0) corr.push(k); k++; return ''; });
      var single = !/<single>false<\/single>/.test(blk), gf = between(blk, '<generalfeedback', '</generalfeedback>');
      var name = (between(blk, '<name>', '</name>') || { v: '' }).v; name = strip(cdata((between(name, '<text>', '</text>') || { v: '' }).v));
      items.push({ subject: B.imp.subject, source: B.imp.source || cat || file.name.replace(/\.xml$/i, ''), skill_id: B.imp.skill_id, stem: strip(qh.replace(/<img[^>]*>/gi, '')), src: src, options: opts.length ? opts : ['أ', 'ب', 'ج', 'د'], correct: single ? corr.slice(0, 1) : corr, multi: !single || corr.length > 1, explanation: gf ? strip(cdata((between(gf.v, '<text>', '</text>') || { v: '' }).v)) : '', status: 'active', label: name });
      if (++n % 25 === 0) { prog('قراءة الأسئلة… ' + n); await new Promise(function (r) { setTimeout(r, 0); }); }
    }
    s = null;
    if (!items.length) { prog('لم يُعثر على أسئلة اختيار من متعدد في الملف.'); return; }
    await prepImages(items, 'تجهيز الصور');
    B.imp.items = items; B.imp.note = skipped ? 'تم تجاهل ' + skipped + ' سؤالًا ليس اختيارًا من متعدد.' : '';
    await check();
  }
  async function prepImages(items, label) {
    var done = 0, list = items.filter(function (x) { return x.src; }), idx = 0;
    var worker = async function () { while (idx < list.length) { var it = list[idx++]; try { var r = await compress(it.src); it.img_data = r.data; it.hash = r.hash; } catch (e) { it.imgError = true; } it.src = null; done++; if (done % 10 === 0) prog(label + '… ' + done + ' من ' + list.length); } };
    await Promise.all([worker(), worker(), worker(), worker()]);
  }
  // --- صور بالجملة ---
  async function readImages(files) {
    readCommon();
    files = [].slice.call(files).filter(function (f) { return /^image\//.test(f.type); });
    if (!files.length) return;
    var num = function (n) { var m = /(\d+)(?!.*\d)/.exec(n); return m ? +m[1] : 0; };
    files.sort(function (a, b) { return num(a.name) - num(b.name) || a.name.localeCompare(b.name); });
    var items = files.map(function (f) { return { subject: B.imp.subject, source: B.imp.source || 'صور مرفوعة', skill_id: B.imp.skill_id, stem: '', src: URL.createObjectURL(f), options: ['أ', 'ب', 'ج', 'د'], correct: [], multi: false, status: 'active', label: f.name }; });
    prog('تجهيز ' + items.length + ' صورة…'); await prepImages(items, 'تجهيز الصور');
    B.imp.items = items; B.imp.keyMode = true; await check();
  }
  // --- إكسيل / CSV ---
  var COLS = ['السؤال', 'النص المرافق', 'أ', 'ب', 'ج', 'د', 'هـ', 'و', 'الإجابة', 'المهارة', 'الصعوبة', 'المصدر', 'الشرح'];
  function letterIdx(t) { t = String(t || '').trim().replace(/^ه$/, 'هـ'); var m = { 'أ': 0, 'ا': 0, 'ب': 1, 'ج': 2, 'د': 3, 'هـ': 4, 'و': 5, a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5 }; var k = t.toLowerCase(); return m[k] !== undefined ? m[k] : -1; }
  function loadXlsx() { return window.XLSX ? Promise.resolve() : new Promise(function (ok, no) { var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = ok; s.onerror = function () { no(new Error('تعذّر تحميل قارئ الإكسيل. جرّب ملف CSV.')); }; document.head.appendChild(s); }); }
  function parseCsv(t) { var rows = [], row = [], f = '', q = false; for (var i = 0; i < t.length; i++) { var c = t[i]; if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; } else if (c === '"') q = true; else if (c === ',' || c === '\t' || c === '؛') { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += c; } if (f || row.length) { row.push(f); rows.push(row); } return rows; }
  async function readSheet(file) {
    readCommon(); var rows;
    if (/\.csv$/i.test(file.name)) rows = parseCsv((await file.text()).replace(/^﻿/, ''));
    else { await loadXlsx(); var wb = window.XLSX.read(await file.arrayBuffer(), { type: 'array' }); rows = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' }); }
    var head = (rows.shift() || []).map(function (x) { return norm(x); }), col = function (n) { return head.indexOf(norm(n)); };
    var ci = COLS.map(col), items = [];
    rows.forEach(function (r) {
      var g = function (k) { var i = ci[COLS.indexOf(k)]; return i >= 0 ? String(r[i] == null ? '' : r[i]).trim() : ''; };
      var stem = g('السؤال'); if (!stem) return;
      var opts = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'].map(g); while (opts.length && !opts[opts.length - 1]) opts.pop();
      var ans = g('الإجابة').split(/[،,\s]+/).map(letterIdx).filter(function (x) { return x >= 0; }), d = { 'سهل': 1, 'متوسط': 2, 'صعب': 3 }[g('الصعوبة')] || 0;
      items.push({ subject: B.imp.subject, source: g('المصدر') || B.imp.source || file.name.replace(/\.\w+$/, ''), skill_id: B.imp.skill_id, skill_name: g('المهارة'), stem: stem, passage: g('النص المرافق'), options: opts, correct: ans, multi: ans.length > 1, difficulty: d, explanation: g('الشرح'), status: 'active' });
    });
    if (!items.length) { prog('لم أجد أسئلة. تأكد أن أول سطر فيه أسماء الأعمدة كما في القالب.'); return; }
    items.forEach(function (it) { if (!it.skill_id && it.skill_name) { var s = skillsOf(it.subject).filter(function (x) { return norm(x.name) === norm(it.skill_name); })[0]; if (s) it.skill_id = s.id; else it.skillMissing = true; } });
    B.imp.items = items; await check();
  }
  function template() {
    var rows = [COLS, ['ما ناتج ٢٥ × ٤ ؟', '', '٨٠', '١٠٠', '١٢٠', '٩٠', '', '', 'ب', 'جمع وطرح الأعداد', 'سهل', '', 'نضرب ٢٥ في ٤ = ١٠٠'], ['بحر : ملح', '', 'حبر : زرقة', 'ليمون : حامض', 'نهر : رمل', 'ماء : عذب', '', '', 'ب', 'التناظر اللفظي', 'متوسط', '', '']];
    var csv = '﻿' + rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'قالب-أسئلة-البوابة.csv'; a.click();
  }
  // --- لصق نص ---
  function parsePaste(t) {
    readCommon();
    var blocks = String(t || '').replace(/\r/g, '').split(/\n\s*\n/), items = [], re = /^\s*(\*)?\s*([أابجدهـو]|هـ|[a-fA-F]|[1-6١-٦])\s*[)\-.:\]]\s*(.+)$/;
    blocks.forEach(function (b) {
      var lines = b.split('\n').map(function (l) { return l.trim(); }).filter(Boolean); if (!lines.length) return;
      var stem = [], opts = [], corr = [], ans = null;
      lines.forEach(function (l) {
        var am = /^(\*?\s*)?(الإجابة|الاجابة|الجواب|answer)\s*[:：]\s*(.+)$/i.exec(l); if (am) { ans = am[3]; return; }
        var m = re.exec(l); if (m && (opts.length || stem.length)) { if (m[1]) corr.push(opts.length); opts.push(m[3].trim()); return; }
        if (opts.length) opts[opts.length - 1] += ' ' + l; else stem.push(l);
      });
      if (ans) corr = ans.split(/[،,\s]+/).map(function (x) { return letterIdx(x.replace(/[١-٦]/g, function (d) { return '١٢٣٤٥٦'.indexOf(d) + 1; })); }).filter(function (x) { return x >= 0; });
      if (!stem.length) return;
      items.push({ subject: B.imp.subject, source: B.imp.source || 'نص ملصوق', skill_id: B.imp.skill_id, stem: stem.join('\n'), options: opts.length >= 2 ? opts : ['أ', 'ب', 'ج', 'د'], correct: corr, multi: corr.length > 1, status: 'active' });
    });
    return items;
  }

  // --- التحقق وكشف التكرار ---
  async function check() {
    var I = B.imp; prog('فحص التكرار…');
    var seen = {};
    I.items.forEach(function (it, i) { var k = it.hash || ('t' + norm(it.stem) + '|' + it.options.map(norm).join('|')); it.dupBatch = seen[k] !== undefined ? seen[k] + 1 : 0; if (seen[k] === undefined) seen[k] = i; });
    try {
      var res = [], imgs = null, hasImg = I.items.some(function (it) { return it.hash; });
      for (var i = 0; i < I.items.length; i += 1000) { var part = I.items.slice(i, i + 1000).map(function (it) { return it.hash ? { hash: it.hash } : { stem: it.stem, options: it.options }; }); var rr = await window.api('bank/check', { subject: I.subject, items: part, withImages: hasImg && !imgs }); if (rr.images) imgs = rr.images; res = res.concat(rr.results); }
      var bits = function (h) { return [parseInt(h.slice(0, 8), 16) >>> 0, parseInt(h.slice(8), 16) >>> 0]; }, pc = function (v) { v = v - ((v >>> 1) & 0x55555555); v = (v & 0x33333333) + ((v >>> 2) & 0x33333333); return (((v + (v >>> 4)) & 0xF0F0F0F) * 0x1010101) >>> 24; };
      var bank = (imgs || []).map(function (r) { var x = bits(r[1]); return [r[0], x[0], x[1]]; });
      I.items.forEach(function (it, i) {
        var r = res[i]; it.dupBank = r && r.id ? r : null; if (r && r.hash && !it.hash) it.thash = r.hash;
        if (it.hash && bank.length) { var x = bits(it.hash), best = null; for (var k = 0; k < bank.length; k++) { var d = pc(x[0] ^ bank[k][1]) + pc(x[1] ^ bank[k][2]); if (d <= 6 && (!best || d < best.d)) best = { id: bank[k][0], d: d }; } it.dupBank = best; }
      });
    } catch (e) { if (e) T(e.message, 'err'); }
    I.skipDup = I.skipDup !== false; render();
  }
  function issues(it) { var x = []; if (it.imgError) x.push('<span class="b no">صورة تالفة</span>'); if (!it.correct.length) x.push('<span class="b no">بلا إجابة</span>'); if (it.options.length < 2) x.push('<span class="b no">اختيارات أقل من ٢</span>'); else if (it.options.length < 4) x.push('<span class="b wn">' + it.options.length + ' اختيارات</span>'); if (it.dupBank) x.push('<span class="b wn">مكرر في البنك #' + it.dupBank.id + '</span>'); if (it.dupBatch) x.push('<span class="b wn">مكرر في الملف (مع ' + it.dupBatch + ')</span>'); if (it.skillMissing) x.push('<span class="b wn">مهارة «' + E(it.skill_name) + '» غير موجودة</span>'); return x.join(' '); }
  function willAdd(it) { return !(B.imp.skipDup && (it.dupBank || it.dupBatch)) && !it.removed && !it.imgError && it.options.length >= 2; }
  function previewHtml() {
    var I = B.imp, its = I.items, add = its.filter(willAdd), noAns = add.filter(function (x) { return !x.correct.length; }).length, dups = its.filter(function (x) { return x.dupBank || x.dupBatch; }).length;
    var h = '<div class="card"><div class="row" style="justify-content:space-between"><div><h2 style="margin:0">مراجعة قبل الإضافة</h2><p class="m" style="margin:4px 0 0">' + its.length + ' سؤالًا في الملف · سيُضاف <b>' + add.length + '</b>' + (dups ? ' · ' + dups + ' مكرر' : '') + (noAns ? ' · <span style="color:#b4321f">' + noAns + ' بلا إجابة (تُحفظ مسودات)</span>' : '') + (I.note ? ' · ' + E(I.note) : '') + '</p></div><div class="row"><button class="g" data-bk="impCancel">إلغاء</button><button data-bk="impGo"' + (add.length ? '' : ' disabled') + '>إضافة ' + add.length + ' سؤال للبنك</button></div></div>'
      + '<div class="row" style="margin-top:10px;gap:14px"><label class="m"><input type="checkbox" id="bkSkipDup"' + (I.skipDup ? ' checked' : '') + '> تجاهل الأسئلة المكررة</label><span class="m">المادة: <b>' + E(B.meta.subjects[I.subject]) + '</b></span></div>';
    if (I.keyMode) h += '<div style="margin-top:12px;padding:12px;background:#f6f9fc;border-radius:12px"><b>مفتاح الإجابات بالترتيب</b><p class="m" style="margin:2px 0 6px">اكتب الإجابات متتالية: أبجدد… أو abcd… أو 1234…  (والمسافات مسموحة). أو اضغط الحرف تحت كل صورة.</p><div class="row"><input id="bkKey" style="flex:1;min-width:240px;font-size:18px;letter-spacing:3px" value="' + E(I.key || '') + '"><button class="g" data-bk="applyKey">تطبيق</button></div></div>';
    h += '<div id="bkProg" class="m" style="margin-top:8px"></div></div>';
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">' + its.map(function (it, i) {
      var on = willAdd(it);
      return '<div style="border:1.5px solid ' + (on ? 'var(--line)' : '#e3e7ec') + ';opacity:' + (on ? 1 : .55) + ';border-radius:14px;background:#fff;overflow:hidden"><div data-bk="impEdit" data-v="' + i + '" style="cursor:pointer">' + (it.img_data ? '<img src="' + it.img_data + '" style="width:100%;aspect-ratio:3/2;object-fit:contain;background:#f6f9fc;display:block">' : '<div style="padding:10px 12px;min-height:80px;font-size:13.5px;line-height:1.8">' + E(String(it.stem).slice(0, 180)) + (it.options.length && !it.img_data ? '<div class="m">' + it.options.map(function (o, k) { return LT[k] + ') ' + E(String(o).slice(0, 40)); }).join(' · ') + '</div>' : '') + '</div>') + '</div>'
        + '<div style="padding:8px 10px;font-size:12px;border-top:1px solid var(--line)"><div class="row" style="justify-content:space-between;gap:6px"><span>' + (i + 1) + (it.label ? ' · <span class="m">' + E(String(it.label).slice(0, 26)) + '</span>' : '') + '</span><button class="g sm" data-bk="impRm" data-v="' + i + '">' + (it.removed ? 'إرجاع' : 'استبعاد') + '</button></div>'
        + '<div class="row" style="gap:4px;margin-top:6px">' + it.options.map(function (o, k) { var c = it.correct.indexOf(k) >= 0; return '<button class="sm' + (c ? '' : ' g') + '" style="min-width:34px' + (c ? ';background:#1d8a58' : '') + '" data-bk="impAns" data-v="' + i + '" data-k="' + k + '">' + LT[k] + '</button>'; }).join('') + '</div><div style="margin-top:6px">' + issues(it) + '</div>' + (it.skill_id ? '<div class="m" style="margin-top:4px">◈ ' + E(skillName(it.skill_id)) + '</div>' : '') + '</div></div>';
    }).join('') + '</div>';
    return h;
  }
  function applyKey(v) {
    var I = B.imp, chars = String(v || '').replace(/[\s,،\-]+/g, '').replace(/هـ/g, 'ه'), arr = [];
    for (var i = 0; i < chars.length; i++) { var c = chars[i] === 'ه' ? 'هـ' : chars[i], k = letterIdx(c.replace(/[١-٦]/, function (d) { return '١٢٣٤٥٦'.indexOf(d) + 1; })); if (k >= 0) arr.push(k); }
    var j = 0; I.items.forEach(function (it) { if (it.removed) return; if (j < arr.length) { it.correct = [arr[j]]; it.multi = false; } j++; });
    I.key = v; T('تم تطبيق ' + Math.min(arr.length, I.items.length) + ' إجابة', 'ok'); render();
  }
  async function doImport() {
    var I = B.imp, list = I.items.filter(willAdd), done = 0, added = 0, errs = 0;
    var btn = root().querySelector('[data-bk="impGo"]'); if (btn) btn.disabled = true;
    // ١) رفع الصور (أربع في نفس الوقت)
    var withImg = list.filter(function (x) { return x.img_data && !x.image_id; }), idx = 0;
    var up = async function () { while (idx < withImg.length) { var it = withImg[idx++]; try { var r = await window.api('bank/image', { data: it.img_data }); it.image_id = r.id; } catch (e) { it.upErr = true; errs++; } done++; prog('رفع الصور… ' + done + ' من ' + withImg.length); } };
    await Promise.all([up(), up(), up(), up()]);
    // ٢) حفظ الأسئلة على دفعات
    var ready = list.filter(function (x) { return !x.upErr; });
    for (var i = 0; i < ready.length; i += 40) {
      var part = ready.slice(i, i + 40).map(function (it) { return { subject: it.subject, skill_id: it.skill_id || null, skill_name: it.skill_id ? '' : it.skill_name, difficulty: it.difficulty || 0, source: it.source, stem: it.stem, passage: it.passage || '', image_id: it.image_id || null, options: it.options, correct: it.correct, multi: it.multi, explanation: it.explanation || '', status: it.correct.length ? it.status : 'draft', hash: it.hash || it.thash || null }; });
      try { var r = await window.api('bank/import', { items: part }); added += r.added; errs += r.errors.length; } catch (e) { errs += part.length; if (e) T(e.message, 'err'); }
      prog('حفظ الأسئلة… ' + Math.min(i + 40, ready.length) + ' من ' + ready.length);
    }
    T('أُضيف ' + added + ' سؤالًا للبنك' + (errs ? ' · تعذّر ' + errs : ''), errs ? 'err' : 'ok');
    B.imp = null; B.tab = 'browse'; B.f.subject = I.subject; B.f.source = ''; B.f.page = 0; B.list = null; reload();
  }

  // ===== التصدير =====
  function exportHtml() {
    var f = B.f;
    return '<div class="card"><h2>تصدير الأسئلة</h2><p class="m">يُصدَّر ما يطابق التصفية الحالية في تبويب «الأسئلة»: <b>' + E(B.meta.subjects[f.subject]) + '</b>' + (f.skill ? ' · مهارة محددة' : '') + (f.source ? ' · ' + E(f.source) : '') + (f.q ? ' · بحث «' + E(f.q) + '»' : '') + '.</p>'
      + '<div class="row" style="margin-top:12px"><button data-bk="expXml">📦 ملف مودل XML (بالصور)</button><button class="g" data-bk="expCsv">📊 ملف CSV للإكسيل</button></div><div id="bkProg" class="m" style="margin-top:10px"></div><p class="m" style="margin-top:10px">ملف مودل يمكن رفعه في مودل مباشرة (بنك الأسئلة ← استيراد)، ويصلح كنسخة احتياطية كاملة.</p></div>';
  }
  function dl(name, data, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  function x(s) { return String(s == null ? '' : s).replace(/]]>/g, ']]]]><![CDATA[>'); }
  async function exportXml() {
    prog('تجميع الأسئلة…'); var all = await fetchAll(B.f), out = ['<?xml version="1.0" encoding="UTF-8"?>\n<quiz>'], lastSrc = null, done = 0;
    for (var i = 0; i < all.length; i++) {
      var q = all[i], src = q.source || 'بنك البوابة';
      if (src !== lastSrc) { out.push('<question type="category"><category><text>$course$/top/' + x(src).replace(/</g, '') + '</text></category></question>'); lastSrc = src; }
      var img = '';
      if (q.img) { try { var bl = await (await fetch(q.img)).blob(); var b64 = await fileData(bl); img = '<p><img src="' + b64 + '" alt=""></p>'; } catch (e) { } }
      var stem = (q.passage ? '<p>' + E(q.passage).replace(/\n/g, '<br>') + '</p>' : '') + (q.stem ? '<p>' + E(q.stem).replace(/\n/g, '<br>') + '</p>' : '') + img;
      var frac = q.correct.length ? Math.round(100 / q.correct.length * 1e5) / 1e5 : 0;
      out.push('<question type="multichoice"><name><text>' + E((q.stem || 'سؤال').slice(0, 60)) + ' #' + q.id + '</text></name><questiontext format="html"><text><![CDATA[' + x(stem) + ']]></text></questiontext><generalfeedback format="html"><text><![CDATA[' + x(q.explanation ? E(q.explanation) : '') + ']]></text></generalfeedback><defaultgrade>1</defaultgrade><penalty>0.3333333</penalty><hidden>0</hidden><single>' + (q.multi ? 'false' : 'true') + '</single><shuffleanswers>false</shuffleanswers><answernumbering>none</answernumbering>'
        + q.options.map(function (o, k) { return '<answer fraction="' + (q.correct.indexOf(k) >= 0 ? frac : 0) + '" format="html"><text><![CDATA[' + x(E(o)) + ']]></text><feedback format="html"><text></text></feedback></answer>'; }).join('') + '</question>');
      if (++done % 20 === 0) prog('تجهيز الملف… ' + done + ' من ' + all.length);
    }
    out.push('</quiz>'); dl('بنك-البوابة-' + B.f.subject + '.xml', out.join('\n'), 'text/xml'); prog('تم تصدير ' + all.length + ' سؤالًا.');
  }
  async function exportCsv() {
    prog('تجميع الأسئلة…'); var all = await fetchAll(B.f), head = ['رقم'].concat(COLS, ['الصورة', 'الحالة']);
    var rows = [head].concat(all.map(function (q) { var o = q.options.concat(['', '', '', '', '', '']).slice(0, 6); return [q.id, q.stem || '', q.passage || ''].concat(o, [q.correct.map(function (i) { return LT[i]; }).join('،'), skillName(q.skill_id), DIFF[q.difficulty] === 'غير محدد' ? '' : DIFF[q.difficulty], q.source || '', q.explanation || '', q.img ? location.origin + q.img : '', q.status === 'draft' ? 'مسودة' : 'نشط']); }));
    dl('بنك-البوابة-' + B.f.subject + '.csv', '﻿' + rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n'), 'text/csv;charset=utf-8');
    prog('تم تصدير ' + all.length + ' سؤالًا.');
  }

  // ===== الأحداث =====
  document.addEventListener('click', async function (e) {
    var r = root(); if (!r || !r.contains(e.target)) return;
    var b = e.target.closest('[data-bk]'); if (!b || b.disabled) return; var a = b.dataset.bk, v = b.dataset.v;
    if (a === 'tab') { B.tab = v; if (v === 'add' && B.imp && !B.imp.items) B.imp = null; render(); }
    else if (a === 'subj') { B.f.subject = v; B.f.skill = ''; B.f.source = ''; B.f.page = 0; B.sel = {}; B.list = null; render(); }
    else if (a === 'page') { B.f.page = +v; B.list = null; render(); window.scrollTo(0, 0); }
    else if (a === 'open') { var it = (B.list.items || []).filter(function (q) { return q.id === +v; })[0]; if (it) editor(it, saveToBank, { noDelete: !B.meta.perms.del }); }
    else if (a === 'new') editor(null, saveToBank);
    else if (a === 'selPage') { B.list.items.forEach(function (q) { B.sel[q.id] = 1; }); render(); }
    else if (a === 'selNone') { B.sel = {}; render(); }
    else if (a === 'bulkStatus') bulk({ status: v });
    else if (a === 'bulkSrc') { var s = prompt('المصدر الجديد للأسئلة المحددة:'); if (s !== null) bulk({ source: s }); }
    else if (a === 'bulkDel') { var n = Object.keys(B.sel).length; if (await window.confirmBox('حذف ' + n + ' سؤالًا من البنك نهائيًا؟', true)) { try { await window.api('bank/delete', { ids: Object.keys(B.sel).map(Number) }); B.sel = {}; T('تم الحذف', 'ok'); B.list = null; reload(); } catch (er) { if (er) T(er.message, 'err'); } } }
    else if (a === 'legacy') runLegacy(v);
    else if (a === 'hashes') runHashes();
    else if (a === 'method') { B.imp = { method: v, subject: B.f.subject, source: '', skill_id: null }; render(); }
    else if (a === 'tpl') template();
    else if (a === 'parsePaste') { var items = parsePaste(($b('bkPaste') || {}).value); if (!items.length) { prog('لم أتعرف على أسئلة. راجع الصيغة في المثال.'); return; } B.imp.items = items; await check(); }
    else if (a === 'impCancel') { B.imp = null; render(); }
    else if (a === 'impGo') doImport();
    else if (a === 'impRm') { var it2 = B.imp.items[+v]; it2.removed = !it2.removed; render(); }
    else if (a === 'impAns') { var it3 = B.imp.items[+v], k = +b.dataset.k; if (it3.multi) it3.correct = it3.correct.indexOf(k) >= 0 ? it3.correct.filter(function (z) { return z !== k; }) : it3.correct.concat(k); else it3.correct = it3.correct[0] === k ? [] : [k]; render(); }
    else if (a === 'impEdit') { var i = +v, it4 = B.imp.items[i]; editor(it4, function (q) { B.imp.items[i] = Object.assign(it4, q); render(); return Promise.resolve(); }, { title: 'تعديل قبل الإضافة', saveLabel: 'تم', noDelete: true }); }
    else if (a === 'applyKey') applyKey(($b('bkKey') || {}).value);
    else if (a === 'expXml') exportXml().catch(function (er) { if (er) T(er.message, 'err'); });
    else if (a === 'expCsv') exportCsv().catch(function (er) { if (er) T(er.message, 'err'); });
  });
  async function bulk(set) { try { await window.api('bank/bulk', { ids: Object.keys(B.sel).map(Number), set: set }); T('تم التحديث', 'ok'); B.list = null; reload(); } catch (e) { if (e) T(e.message, 'err'); } }
  document.addEventListener('change', function (e) {
    var r = root(); if (!r || !r.contains(e.target)) return; var t = e.target;
    if (t.dataset.bkf && t.dataset.bkf !== 'q') { B.f[t.dataset.bkf] = t.value; B.f.page = 0; B.list = null; render(); }
    else if (t.dataset.bksel) { if (t.checked) B.sel[t.dataset.bksel] = 1; else delete B.sel[t.dataset.bksel]; render(); }
    else if (t.id === 'bkBulkSkill' && t.value !== '') bulk({ skill_id: +t.value || null });
    else if (t.id === 'bkBulkDiff' && t.value !== '') bulk({ difficulty: +t.value });
    else if (t.id === 'bkImpSub') { B.imp.subject = t.value; B.imp.skill_id = null; render(); }
    else if (t.id === 'bkFileXml' && t.files[0]) parseMoodle(t.files[0]).catch(function (er) { prog('تعذّر قراءة الملف: ' + er.message); });
    else if (t.id === 'bkFileImgs' && t.files.length) readImages(t.files).catch(function (er) { prog('تعذّر قراءة الصور: ' + er.message); });
    else if (t.id === 'bkFileXls' && t.files[0]) readSheet(t.files[0]).catch(function (er) { prog('تعذّر قراءة الملف: ' + er.message); });
    else if (t.id === 'bkSkipDup') { B.imp.skipDup = t.checked; render(); }
  });
  var qTimer = null;
  document.addEventListener('input', function (e) { var r = root(); if (!r || !r.contains(e.target)) return; if (e.target.dataset.bkf === 'q') { clearTimeout(qTimer); var v = e.target.value; qTimer = setTimeout(function () { B.f.q = v; B.f.page = 0; B.list = null; loadList(); }, 450); } });
  document.addEventListener('keydown', function (e) { if (e.target && e.target.id === 'bkKey' && e.key === 'Enter') applyKey(e.target.value); });
  document.addEventListener('dragover', function (e) { var d = $b('bkDrop'); if (d && d.contains(e.target)) { e.preventDefault(); d.style.borderColor = 'var(--navy)'; } });
  document.addEventListener('drop', function (e) { var d = $b('bkDrop'); if (d && d.contains(e.target)) { e.preventDefault(); readImages(e.dataTransfer.files); } });
})();
