// Service Worker — الاختبار المحوسب (الإصدار 1.3.1)
const V='1.3.1',SHELL='bw-shell-'+V,IMG='bw-img-v1';
const CORE=['./','index.html','manifest.json','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('bw-shell-')&&k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);if(u.origin!==location.origin)return;
  // طلبات الخادم (التقدم، الأسئلة، الدخول) لا تُخزَّن أبدًا
  if(u.pathname.startsWith('/api/'))return;
  // الصور: من الذاكرة أولًا (الصور لا تتغير بعد نشرها)
  if(u.pathname.indexOf('/img/')>-1){
    e.respondWith(caches.open(IMG).then(async c=>{
      const m=await c.match(r);if(m)return m;
      try{const n=await fetch(r);if(n.ok)c.put(r,n.clone());return n}catch(_){return new Response('',{status:504})}
    }));return;
  }
  // الصفحة: من الشبكة أولًا لتصل التحديثات، ومن الذاكرة عند انقطاع الإنترنت
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(n=>{const cp=n.clone();caches.open(SHELL).then(c=>c.put('index.html',cp));return n})
      .catch(()=>caches.match('index.html',{ignoreSearch:true}).then(m=>m||caches.match('./'))));return;
  }
  // باقي الملفات: من الذاكرة مع تحديث في الخلفية
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>{
    const f=fetch(r).then(n=>{if(n.ok){const cp=n.clone();caches.open(SHELL).then(c=>c.put(r,cp))}return n}).catch(()=>m);
    return m||f;
  }));
});
