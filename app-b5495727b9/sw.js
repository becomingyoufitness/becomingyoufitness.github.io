/* Offline-first service worker for BECOMING YOU FITNESS.
 * App data stays in browser storage; this worker only caches the app shell/assets.
 */
'use strict';

const CACHE_NAME = 'by-fitness-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];
const APP_PATH = new URL('./', self.location.href).pathname;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Cache assets independently so one missing optional icon cannot prevent
    // the actual app from being available offline.
    await Promise.allSettled(APP_SHELL.map(async path => {
      const request = new Request(path, { cache: 'reload' });
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('by-fitness-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Keep the installed app shell usable offline, even if a navigation request
  // is made while the network is unavailable.
  if (request.mode === 'navigate' && url.pathname.startsWith(APP_PATH)) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('./index.html', response.clone());
        }
        return response;
      } catch (_) {
        return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Static app resources use a cache-first strategy with network refresh and
  // an offline fallback. Do not cache API-like requests or failed responses.
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (_) {
      return Response.error();
    }
  })());
});
