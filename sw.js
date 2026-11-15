/* BoardBank service worker: keeps the app installable and caches pictures. Account data and Supabase always come from the network. */
const CACHE = 'boardbank-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;              // Supabase and CDNs go straight to the network
  if (req.mode === 'navigate') {                                                   // page: always try the network first so updates show immediately
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(ch => ch.put('./', c)); return r; }).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async ch => {                              // pictures and icons: show the saved copy, refresh it in the background
    const hit = await ch.match(req);
    const net = fetch(req).then(r => { if (r.ok) ch.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
