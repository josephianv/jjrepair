// JJ Electronic Repair — Service Worker
// Sube CACHE_VERSION cada vez que publiques cambios importantes
// para forzar que los usuarios reciban la nueva versión.
const CACHE_VERSION = 'jj-repair-v7';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Instala la nueva versión y precachea los archivos base.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  // No esperar a que se cierren las pestañas viejas: activar de inmediato.
  self.skipWaiting();
});

// Al activar, borra cachés de versiones anteriores.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Tomar control de las pestañas abiertas sin esperar recarga.
  self.clients.claim();
});

// Estrategia: network-first para HTML (siempre intenta la versión más
// reciente del servidor primero); cache-first para el resto de assets.
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then((res) => res || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
          return res;
        })
      );
    })
  );
});

// Permite forzar la actualización desde la app (opcional) enviando
// navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'})
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
