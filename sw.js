// Diário de Treino · service worker (versão 86c20f514f)
const CACHE = 'treino-vn-86c20f514f';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png',
  './icon-512.png', './maskable-512.png', './apple-touch-icon.png', './favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('treino-vn-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Página: tenta a rede por até 3 s (pega ficha nova) e cai no cache sem sinal.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const rede = await Promise.race([
          fetch(req, {cache: 'no-store'}),
          new Promise((_, rej) => setTimeout(() => rej(new Error('lento')), 3000)),
        ]);
        if (rede && rede.ok) cache.put('./index.html', rede.clone());
        return rede;
      } catch (err) {
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
