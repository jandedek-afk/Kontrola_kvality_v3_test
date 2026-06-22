const CACHE_NAME = 'foto-poznamky-cache-v3.1.0-test';
const NETWORK_TIMEOUT = 2500; // ms – po této době při pomalé síti naskočí cache
const urlsToCache = [
  './',
  './index.html',
  './manifest.json?v=3.1.0-test',
  './icon192.png',
  './icon512.png',
  './icon2.png'
];
// Cizí (cross-origin) domény, které smíme ukládat do cache kvůli offline běhu.
// Supabase a mapové dlaždice zde NEJSOU – ty jdou vždy přímo na síť.
const CACHEABLE_CDN = ['unpkg.com', 'cdn.jsdelivr.net'];

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

// "Nejdřív síť" s časovým limitem; když síť do limitu nestihne (nebo selže), použij cache.
function networkFirst(request, cache) {
  return new Promise(resolve => {
    let settled = false;
    const done = (res) => { if (!settled) { settled = true; resolve(res); } };

    const timer = setTimeout(async () => {
      const cached = await cache.match(request);
      if (cached) done(cached); // pomalá síť → naskočí cache; síť případně doběhne a cache se aktualizuje
    }, NETWORK_TIMEOUT);

    fetch(request).then(async res => {
      clearTimeout(timer);
      try { await cache.put(request, res.clone()); } catch (e) { /* ignore */ }
      done(res.clone());
    }).catch(async () => {
      clearTimeout(timer);
      const cached = await cache.match(request);
      done(cached || new Response('', { status: 504, statusText: 'Gateway Timeout' }));
    });
  });
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return; // POST apod. (Supabase zápisy) neřešíme

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const cacheableCDN = CACHEABLE_CDN.includes(url.hostname);

  // Cizí domény mimo povolené CDN (Supabase, mapové dlaždice) → vždy přímo na síť, nic neukládáme
  if (!sameOrigin && !cacheableCDN) return;

  // Stránka / app shell → nejdřív síť (rychlé aktualizace), offline záloha z cache
  const isShell = req.mode === 'navigate'
    || url.pathname.endsWith('/')
    || url.pathname.endsWith('index.html')
    || url.pathname.endsWith('manifest.json');

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    if (sameOrigin && isShell) {
      return networkFirst(req, cache);
    }

    // Ikony a knihovny z CDN → stale-while-revalidate (rychlé z cache, aktualizace na pozadí)
    const cached = await cache.match(req);
    const networkFetch = fetch(req).then(async res => {
      try { await cache.put(req, res.clone()); } catch (e) { /* ignore */ }
      return res.clone();
    }).catch(() => null);
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