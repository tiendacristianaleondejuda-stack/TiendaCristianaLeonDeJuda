// ================================================================
//  OneSignalSDKWorker.js
//  ⚠️  Este archivo DEBE estar en /OneSignalSDKWorker.js
//  (en la misma carpeta que index.html)
//
//  Combina dos responsabilidades en un mismo scope ("/"),
//  porque el navegador solo permite UN service worker activo
//  por scope:
//    1) PWA: cachea el app shell y responde a 'fetch'.
//       (Chrome exige esto para disparar beforeinstallprompt)
//    2) OneSignal: push notifications (importScripts al final).
// ================================================================

const CACHE_NAME = 'leon-de-juda-shell-v1';

// Ajustá esta lista a los archivos reales de tu app shell
// (CSS/JS/imagenes críticas para que cargue offline).
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn('[SW] No se pudo precachear todo el app shell:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Requisito de Chrome: un service worker con manejador 'fetch'
// activo en el scope de tu start_url ("/") para que la app
// sea considerada instalable.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Dejamos pasar sin interceptar las llamadas a Supabase / APIs externas
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // sin conexión → devolvemos lo cacheado si existe
      return cached || fetchPromise;
    })
  );
});

// ── OneSignal (push notifications) — no tocar ──
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
