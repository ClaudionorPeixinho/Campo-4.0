const CACHE_NAME = 'campo-4-0-cache-v5';
const ASSETS_TO_CACHE = [
  './homepage.html',
  './index_menu.html',
  './home.html',
  './login.html',
  './offline.html',
  './abastecimentos.html',
  './apontamentos.html',
  './cadastro_colaboradores.html',
  './equipamentos.html',
  './perdas_pragas.html',
  './pontodigital.html',
  './pulverizacao_herbicidas.html',
  './relatorios.html',
  './relatorios_agricolas.html',
  './acesso_externos.html',
  './fertilizantes_corretivos.html',
  './relatorio_fertilizantes.html',
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
  './js/perdas.js',
  './js/pontodigital.js',
  './js/pulverizacao.js',
  './js/dashboard.js',
  './js/fertilizantes.js',
  './js/menu.js',
  './Img/tecnologia-campo5.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Cache aberto');
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(asset => 
            cache.add(asset).catch(err => console.warn('SW: Falha ao cachear', asset, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('SW: Removendo cache antigo', key);
          return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSupabaseApi = requestUrl.hostname.includes('supabase.co');
  const isExternal = !requestUrl.pathname.startsWith('/') && !requestUrl.origin.includes(self.location.origin);

  if (isSupabaseApi || isExternal) {
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
        console.warn('SW: Falha no fetch, tentando cache para', event.request.url);
        return caches.match(event.request).then(cached => {
          if (cached) {
            return cached;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./offline.html').then(offline => {
              return offline || new Response('Offline', { status: 503 });
            });
          }
          return Promise.reject(err);
        });
      })
  );
});
