const CACHE_NAME = 'campo-4-0-cache-v1';
const ASSETS_TO_CACHE = [
  './index_menu.html',
  './home.html',
  './login.html',
  './offline.html',
  './manifest.json',
  './css/app-base.css',
  './css/style_home.css',
  './css/style_Menu.css',
  './css/estilo.css',
  './Img/tecnologia-campo5.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => {
        console.log('SW installed and cached assets:', ASSETS_TO_CACHE);
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('SW install cache error:', err);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key)))
    ).then(() => {
      console.log('SW activated and old caches removed.');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.ok && event.request.url.startsWith(self.location.origin)) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(err => {
        console.warn('SW fetch failed, trying cache for', event.request.url, err);
        return caches.match(event.request).then(cached => {
          if (cached) {
            return cached;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('offline.html');
          }
          return Promise.reject(err);
        });
      })
  );
});
