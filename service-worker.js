const CACHE_VERSION = 'antizionism-detector-v179-working-1';
const APP_SHELL = [
  './',
  './index.html',
  './detector-app.html',
  './offline.html',
  './install.html',
  './history.html',
  './methodology.html',
  './antizionism.html',
  './anti-zionism.html',
  './limits.html',
  './privacy.html',
  './legal.html',
  './resources.html',
  './support.html',
  './image-credits.html',
  './restore.html',
  './restored.html',
  './style.css',
  './access.js',
  './rules.js',
  './discourse-observations.js',
  './app.js',
  './document-scan.js',
  './web-reader.js',
  './url-scan.js',
  './site-crawl.js',
  './report-export.js',
  './config.js',
  './history.js',
  './history-page.js',
  './pwa.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './vendor/pdfjs-bundle.min.js',
  './vendor/mammoth.browser.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.includes('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => response)
        .catch(() => caches.match('./offline.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(hit => {
      if (hit) return hit;
      return fetch(request).then(response => {
        if (response && response.ok && ['script', 'style', 'image', 'font'].includes(request.destination)) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
