const CACHE_NAME = "tyrone-ai-v1";

const APP_SHELL = [
    "/",
    "/index.html",
    "/manifest.json",
    "/css/style.css",
    "/js/app.js",
    "/images/tyrone-avatar.png",
    "/images/icon-192.png",
    "/images/icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    const request = event.request;
    const url = new URL(request.url);

    if (
        request.method !== "GET" ||
        url.origin !== self.location.origin
    ) {
        return;
    }

    const isAppShell = url.pathname === "/" ||
                       url.pathname === "/index.html";

    const isStaticAsset = url.pathname.startsWith("/css/") ||
                          url.pathname.startsWith("/js/") ||
                          url.pathname.startsWith("/images/") ||
                          url.pathname === "/manifest.json";

    if (!isAppShell && !isStaticAsset) {
        return;
    }

    event.respondWith(
        fetch(request).then(response => {
            if (response && response.ok) {
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, copy);
                });
            }
            return response;
        }).catch(() => caches.match(request))
    );
});
