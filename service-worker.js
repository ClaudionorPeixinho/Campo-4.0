const CACHE_NAME = 'campo-4-0-cache-v4';
const ASSETS_TO_CACHE = [
  './index_menu.html',
  './home.html',
  './login.html',
  './offline.html',
  './abastecimentos.html',
  './apontamentos.html',
  './cadastro_colaboradores.html',
  './equipamentos.html',
  './entregas.html',
  './perdas.html',
  './perdas_pragas.html',
  './pontodigital.html',
  './pulverizacao_herbicidas.html',
  './relatorios.html',
  './relatorios_agricolas.html',
  './acesso_externos.html',
  './manifest.json',
  './css/app-base.css',
  './css/style_home.css',
  './css/estilo.css',
  './css/style_Abast.css',
  './css/StyleApto.css',
  './css/style_Equip.css',
  './css/style_Ponto.css',
  './css/style_perdas.css',
  './css/dark.css',
  './js/supabase.js',
  './js/offline-sync.js',
  './js/spa-utils.js',
  './js/app.js',
  './js/abastecimento.js',
  './js/apontamento.js',
  './js/colaboradores.js',
  './js/equipamentos.js',
  './js/entregas.js',
  './js/perdas.js',
  './js/perdas_pragas.js',
  './js/pontodigital.js',
  './js/pulverizacao.js',
  './js/dashboard.js',
  './js/menu.js',
  './Img/tecnologia-campo5.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/apexcharts/dist/apexcharts.min.js',
  'https://cdn.jsdelivr.net/npm/apexcharts/dist/apexcharts.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(ASSETS_TO_CACHE.map(asset => cache.add(asset))))
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

  const requestUrl = new URL(event.request.url);
  const isSupabaseApi = requestUrl.hostname.includes('supabase.co');

  if (isSupabaseApi) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
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
