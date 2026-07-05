/* Espanhol de Sobrevivência · service-worker.js
   Estratégia: precache do shell na instalação; runtime "stale-while-revalidate".
   Suba o número da versão para invalidar o cache antigo. */
const VERSAO = 'fluencia-v7';
const SHELL = [
  './',
  './index.html',
  './app.html',
  './styles.css',
  './app.js',
  './prompts.js',
  './content/es/viagem.json',
  './content/es/negocios.json',
  './manifest.json',
  './privacy.html',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;               // não interceptar POST (motor)
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;         // deixa fontes/CDN passarem direto

  e.respondWith(
    caches.match(request).then((cached) => {
      const rede = fetch(request).then((res) => {
        const copia = res.clone();
        caches.open(VERSAO).then((c) => c.put(request, copia));
        return res;
      }).catch(() => cached || caches.match('./index.html'));
      return cached || rede;                          // stale-while-revalidate
    })
  );
});
