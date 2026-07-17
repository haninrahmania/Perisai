const CACHE_NAME = 'perisai-static-shell-v2';
const APP_ROUTES = ['/', '/triage/', '/dashboard/', '/vault/', '/takedown/', '/pendamping/', '/sertifikat/', '/pengaturan/'];

function routeKey(pathname) {
  return pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

async function cacheApplicationShell() {
  const cache = await caches.open(CACHE_NAME);
  const assets = new Set();
  const pages = [];

  for (const route of APP_ROUTES) {
    const response = await fetch(route, { cache: 'reload' });
    if (!response.ok) throw new Error(`Static route unavailable: ${route}`);

    pages.push([route, response.clone()]);
    const html = await response.text();
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const url = new URL(match[1], self.location.origin);
      if (url.origin === self.location.origin && url.pathname.startsWith('/_next/')) {
        assets.add(url.href);
      }
    }
  }

  await cache.addAll([...assets]);
  await Promise.all(pages.map(([route, response]) => cache.put(routeKey(route), response)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheApplicationShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith('perisai-static-shell-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'REFRESH_SHELL') {
    event.waitUntil(cacheApplicationShell());
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) await (await caches.open(CACHE_NAME)).put(routeKey(url.pathname), response.clone());
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match(routeKey(url.pathname))) ?? (await cache.match('/'));
        }),
    );
    return;
  }

  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
  }
});
