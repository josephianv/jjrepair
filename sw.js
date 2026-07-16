// Service Worker de JJ Electronic Repair
// Solo cachea el "shell" estático (HTML, manifest, íconos) para que la app
// abra aunque no haya conexión. NUNCA intercepta llamadas a Firebase/Firestore
// ni a ningún dominio externo — esas las maneja la persistencia offline de
// Firestore, que ya está activada en la app (enablePersistence).

const CACHE_NAME = 'jjrepair-shell-v1';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Solo manejamos peticiones a nuestro propio origen (el shell estático).
  // Todo lo demás (Firebase, Firestore, Google APIs, WhatsApp, etc.) pasa
  // directo a la red, sin pasar por el cache.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cachea silenciosamente nuevos recursos del mismo origen
        // (por ejemplo, si se agregan más íconos en el futuro).
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
