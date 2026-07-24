/* sw.js — Service worker for offline PWA support.
   Cache-first for same-origin app shell; network passthrough for the rest. */
const CACHE = 'toio-twin-v2';
const ASSETS = [
  './',
  './index.html',
  './css/style.css?v=1',
  './js/i18n.js?v=1',
  './js/toio.js?v=1',
  './js/twin.js?v=1',
  './js/control.js?v=1',
  './js/app.js?v=1',
  './js/vendor/three.min.js',
  './js/vendor/OrbitControls.js',
  './js/vendor/GLTFLoader.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // let cross-origin (fonts) hit network
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
