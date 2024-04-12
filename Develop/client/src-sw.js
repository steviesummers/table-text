const { offlineFallback, warmStrategyCache } = require('workbox-recipes');
const { CacheFirst } = require('workbox-strategies');
const { registerRoute } = require('workbox-routing');
const { CacheableResponsePlugin } = require('workbox-cacheable-response');
const { ExpirationPlugin } = require('workbox-expiration');
const { precacheAndRoute } = require('workbox-precaching/precacheAndRoute');

precacheAndRoute(self.__WB_MANIFEST);

const pageCache = new CacheFirst({
  cacheName: 'page-cache',
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
    new ExpirationPlugin({
      maxAgeSeconds: 30 * 24 * 60 * 60,
    }),
  ],
});

warmStrategyCache({
  urls: ['/index.html', '/'],
  strategy: pageCache,
});

registerRoute(({ request }) => request.mode === 'navigate', pageCache);

// TODO: Implement asset caching
// Define the cache name
const CACHE_NAME = 'assets-cache-v1';

// Add event listener for 'install' event
self.addEventListener('install', event => {
  event.waitUntil(
    // Open the cache and add assets to cache
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll([
          '/',
          '/index.html',
          '/styles/main.css',
          '/scripts/main.js',
          // Add more URLs of assets you want to cache
        ]);
      })
  );
});

// Add event listener for 'fetch' event
self.addEventListener('fetch', event => {
  event.respondWith(
    // Try to fetch the resource from the cache first
    caches.match(event.request)
      .then(response => {
        // If found in cache, return the cached response
        if (response) {
          return response;
        }

        // If not found in cache, fetch from the network
        return fetch(event.request)
          .then(networkResponse => {
            // Cache the fetched response
            return caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
          })
          .catch(error => {
            // Handle fetch errors
            console.error('Error fetching:', error);
            // Optionally, you can respond with a custom offline page
            // return caches.match('/offline.html');
          });
      })
  );
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/src-sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope:', registration.scope);
      })
      .catch(error => {
        console.error('ServiceWorker registration failed:', error);
      });
  });
}


registerRoute();
