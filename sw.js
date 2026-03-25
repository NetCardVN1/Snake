const CACHE_NAME = 'snake-v-pwa';
const assets = ['./', './index.html', './style.css', './game.js', './manifest.json', './192x192.jpeg', './512x512.jpeg'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(assets)));
});

self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});

self.addEventListener('notificationclick', e => {
    e.notification.close();
    e.waitUntil(clients.openWindow('./'));
});
