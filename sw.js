const C = "lid-v2";
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(["./", "./index.html", "./manifest.json", "./icon.png"])));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const isPage = e.request.mode === "navigate" || e.request.destination === "document";
  if (isPage) {
    // network-first: always try to get the latest app, fall back to cache offline
    e.respondWith(
      fetch(e.request).then(res => {
        const cl = res.clone();
        caches.open(C).then(c => c.put(e.request, cl));
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
    );
  } else {
    // assets: cache-first, refresh in background
    e.respondWith(
      caches.match(e.request).then(r => {
        const f = fetch(e.request).then(res => {
          const cl = res.clone();
          caches.open(C).then(c => c.put(e.request, cl));
          return res;
        }).catch(() => r);
        return r || f;
      })
    );
  }
});
