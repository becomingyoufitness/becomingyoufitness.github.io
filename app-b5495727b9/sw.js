const V='by-fitness-v3';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./fonts/archivo.woff','./fonts/inter-Regular.woff','./fonts/inter-Medium.woff','./fonts/inter-SemiBold.woff','./fonts/inter-Bold.woff'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
function timeout(ms,p){return new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('timeout')),ms);p.then(v=>{clearTimeout(t);res(v)},e=>{clearTimeout(t);rej(e)})})}
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
 if(r.mode==='navigate'){ // page: try network fast, fall back to cached copy instantly on weak signal or offline
  e.respondWith(timeout(3500,fetch(r)).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put('./index.html',cp))}return res}).catch(()=>caches.match('./index.html').then(m=>m||fetch(r))));return}
 // static files: cache first, refresh in background
 e.respondWith(caches.match(r).then(m=>{const net=fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>m);return m||net}))});
