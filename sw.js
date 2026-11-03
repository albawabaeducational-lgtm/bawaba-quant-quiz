// Service Worker — إيقاف نهائي (الإصدار 2.0.0)
// لا توجد صفحة في الموقع تسجّل هذا العامل الآن، لكنه قد يكون باقيًا من نسخة قديمة على أجهزة بعض الزوار
// فيعرض لهم صفحات أو ملفات قديمة من ذاكرته. هذه النسخة تحذف كل ما خزّنه، وتلغي تسجيل نفسها،
// وتعيد تحميل الصفحات المفتوحة لتأتي أحدث نسخة من الخادم مباشرة.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    try { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); } catch (_) { }
    try { await self.registration.unregister(); } catch (_) { }
    try { const cs = await self.clients.matchAll({ type: 'window' }); cs.forEach(c => { try { c.navigate(c.url); } catch (_) { } }); } catch (_) { }
  })());
});
// حتى يكتمل الإلغاء: كل الطلبات تذهب للشبكة مباشرة
self.addEventListener('fetch', () => { });
