/* Офлайн-кеш. Сторінка береться з мережі (щоб оновлення доходили), а якщо мережі
   немає — з кешу. Іконки й маніфест — одразу з кешу. */
var CACHE = 'lunchbox-v1';
var ASSETS = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png',
              'apple-touch-icon.png', 'favicon-32.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){
    return self.skipWaiting();
  }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; })
                           .map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  if(req.mode === 'navigate' || (req.destination === 'document')){
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put('index.html', copy); });
        return res;
      }).catch(function(){
        return caches.match('index.html').then(function(r){ return r || caches.match('./'); });
      })
    );
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){
    return hit || fetch(req).then(function(res){
      if(res && res.status === 200 && res.type === 'basic'){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return res;
    });
  }));
});
