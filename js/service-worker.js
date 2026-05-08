const CACHE_NAME = 'campo-4-0-cache-v6';
const ASSETS_TO_CACHE = [
  './homepage.html',
  './index_menu.html',
  './home.html',
  './login.html',
  './offline.html',
  './perfil.html',
  './configuracao.html',
  './entregas.html',
  './perdas.html',
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
  './instalar.html',
  './fertilizantes_corretivos.html',
  './relatorio_fertilizantes.html',
  './manifest.json',
  './css/app-base.css',
  './css/style_home.css',
  './css/estilo.css',
  './css/style_Menu.css',
  './css/style_Abast.css',
  './css/StyleApto.css',
  './css/style_Equip.css',
  './css/style_Ponto.css',
  './css/style_perdas.css',
  './css/styles-entregas.css',
  './css/style2.css',
  './css/dark.css',
  './js/supabase.js',
  './js/offline-sync.js',
  './js/spa-utils.js',
  './js/pwa-installer.js',
  './js/app.js',
  './js/menu.js',
  './js/login.js',
  './js/abastecimento.js',
  './js/apontamento.js',
  './js/colaboradores.js',
  './js/equipamentos.js',
  './js/perdas.js',
  './js/pontodigital.js',
  './js/pulverizacao.js',
  './js/dashboard.js',
  './js/fertilizantes.js',
  './js/perfil.js',
  './Img/tecnologia-campo5.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Cache aberto - v6');
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
  const isExternal = requestUrl.origin !== self.location.origin;
  const isImage = requestUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i);
  const isFont = requestUrl.pathname.match(/\.(woff|woff2|ttf|eot)$/i);

  if (isSupabaseApi || (isExternal && !isImage && !isFont)) {
    return event.respondWith(
      fetch(event.request).catch(() => new Response('', { status: 503 }))
    );
  }

  if (isImage || isFont) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached || new Response('', { status: 404 }));
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(err => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./offline.html').then(offline => {
              return offline || new Response('Offline', { status: 503 });
            });
          }
          return new Response('', { status: 503 });
        });
      })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
