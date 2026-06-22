const CACHE_NAME = 'foto-poznamky-cache-v3.0.1-test';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json?v=3.0.1-test',
  './icon192.png',
  './icon512.png',
  './icon2.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('Opened cache');
      await cache.addAll(urlsToCache);
    })()
  );
  // Do not force clients to immediately use the new SW; allow prompt via client
  // The SW will wait in 'waiting' state until client requests skipWaiting.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
    // notify all clients that a new service worker is active
    const allClients = await self.clients.matchAll({includeUncontrolled: true});
    for (const client of allClients) {
      client.postMessage({ type: 'SW_ACTIVATED', cacheName: CACHE_NAME });
    }
  })());
});

self.addEventListener('fetch', event => {
  // Stale-while-revalidate: respond with cache if available, and update cache in background
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    const networkFetch = fetch(event.request).then(async res => {
      try { await cache.put(event.request, res.clone()); } catch (e) { /* ignore put errors */ }
      return res.clone();
    }).catch(() => null);

    // Return cached if it exists, otherwise wait for network
    return cached || (await networkFetch) || new Response('', { status: 504, statusText: 'Gateway Timeout' });
  })());
});

// Listen for messages from clients (e.g., to skip waiting)
self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});