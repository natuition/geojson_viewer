const CACHE_NAME = 'geojson-map-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/js/app.js',
    '/manifest.json',
    'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js',
    'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

// Installation du Service Worker
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('Cache ouvert');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activation du Service Worker
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interception des requêtes
self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function (response) {
                // Retourner la ressource depuis le cache si disponible
                if (response) {
                    return response;
                }

                // Sinon, récupérer depuis le réseau
                return fetch(event.request).then(function (response) {
                    // Vérifier que la réponse est valide
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Cloner la réponse
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(function (cache) {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});

// Gestion du partage de fichiers (Web Share Target API)
self.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'SHARE_FILE') {
        // Traiter le fichier partagé
        const file = event.data.file;

        // Envoyer vers l'application principale
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'SHARED_FILE',
                    file: file
                });
            });
        });
    }
});

// Gestion des notifications push (optionnel pour futures fonctionnalités)
self.addEventListener('push', function (event) {
    const options = {
        body: event.data ? event.data.text() : 'Nouvelle notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png'
    };

    event.waitUntil(
        self.registration.showNotification('GeoJSON Map Viewer', options)
    );
});