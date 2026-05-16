const STATIC = 'fpbi-static-v1';
const RUNTIME = 'fpbi-runtime-v1';
const ALL_CACHES = [STATIC, RUNTIME];

const PRECACHE = ['/', '/manifest.json', '/logo.svg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept Supabase or external requests
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML — always get a fresh app shell
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          caches.open(RUNTIME).then(c => c.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request).then(r => r || caches.match('/')))
    );
    return;
  }

  // Cache-first for everything else (JS, CSS, images)
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (res.ok) caches.open(RUNTIME).then(c => c.put(request, res.clone()));
        return res;
      });
    })
  );
});
