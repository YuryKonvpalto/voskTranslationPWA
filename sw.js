// sw.js – Service Worker for Vosk + Translation

/* ---------- 1. CACHE NAMES ---------- */
const APP_CACHE = 'vosk-pwa-offline-v1';            // Existing app assets
const MODEL_CACHE = 'translation-models-v1';        // New cache for model files

/* ---------- 2. FILES TO CACHE ---------- */
const urlsToCache = [
    '/',                     // root
    '/index.html',
    '/style.css',
    '/app.js',
    '/translation.js',       // <-- add your new translation script
    '/manifest.json',
    '/assets/js/vosk.js',
    // Cache the Transformers.js library (minified bundle)
    'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.5.0/dist/transformers.min.js'
];

/* ---------- 3. INSTALL ---------- */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(APP_CACHE)
            .then(cache => cache.addAll(urlsToCache.map(url => new Request(url, { mode: 'no-cors' }))))
            .then(() => self.skipWaiting())
    );
});

/* ---------- 4. ACTIVATE ---------- */
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(name => {
                if (name !== APP_CACHE && name !== MODEL_CACHE) {
                    return caches.delete(name);
                }
            })
        ))
    ).then(() => self.clients.claim());
});

/* ---------- 5. FETCH ---------- */
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // 5a️⃣  **App assets** – same‑origin, use APP_CACHE
    if (requestUrl.origin === location.origin) {
        event.respondWith(
            caches.match(event.request).then(cached => cached || fetch(event.request).then(network => {
                // Save fresh copies for future offline loads
                if (network && network.status === 200 && network.type === 'basic') {
                    const copy = network.clone();
                    caches.open(APP_CACHE).then(cache => cache.put(event.request, copy));
                }
                return network;
            }))
        );
        return;
    }

    // 5b️⃣  **Translation model files** – cross‑origin (huggingface.co)
    // These are large binary blobs (ONNX). We cache them in MODEL_CACHE.
    if (requestUrl.hostname.endsWith('huggingface.co')) {
        event.respondWith(
            caches.open(MODEL_CACHE).then(cache => {
                return cache.match(event.request).then(cached => {
                    if (cached) return cached;                 // ✅ Serve from cache

                    // ❌ Not cached → fetch from network, then cache it
                    return fetch(event.request).then(network => {
                        // Only cache successful (200) responses
                        if (network && network.status === 200) {
                            cache.put(event.request, network.clone());
                        }
                        return network;
                    });
                });
            })
        );
        return;
    }

    // 5c️⃣  **All other cross‑origin requests** – let them go straight to network
    // (e.g., analytics, fonts, etc.)
    // No caching here.
});