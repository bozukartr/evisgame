"use strict";

const CACHE_VERSION = "evisgame-v2.4.0";
const APP_SHELL = [
  "./",
  "./index.html",
  "./playground.js",
  "./touch-art.js",
  "./sensory.js",
  "./studios.js",
  "./personality.js",
  "./tower.js",
  "./ambience.js",
  "./vendor/matter-0.20.0.min.js",
  "./assets/play/palette.svg",
  "./assets/play/blocks.svg",
  "./assets/play/apple.svg",
  "./assets/play/bell.svg",
  "./assets/play/bubble.svg",
  "./assets/play/butterfly.svg",
  "./assets/play/drum.svg",
  "./assets/play/fish.svg",
  "./assets/play/flower.svg",
  "./assets/play/orange.svg",
  "./assets/play/pear.svg",
  "./assets/play/rocket.svg",
  "./assets/play/turtle.svg",
  "./assets/play/xylophone.svg",
  "./assets/play/live-apple.svg",
  "./assets/play/live-bell.svg",
  "./assets/play/live-bubble.svg",
  "./assets/play/live-drum.svg",
  "./assets/play/live-fish.svg",
  "./assets/play/live-flower.svg",
  "./assets/play/live-orange.svg",
  "./assets/play/live-pear.svg",
  "./assets/play/live-rocket.svg",
  "./assets/play/live-turtle.svg",
  "./assets/play/live-xylophone.svg",
  "./assets/play/plush-ball-0.svg",
  "./assets/play/plush-ball-1.svg",
  "./assets/play/plush-ball-2.svg",
  "./assets/play/plush-ball-3.svg",
  "./assets/play/plush-ball-4.svg",
  "./assets/play/plush-ball-5.svg",
  "./assets/play/plush-block-0.svg",
  "./assets/play/plush-block-1.svg",
  "./assets/play/plush-block-2.svg",
  "./assets/play/plush-block-3.svg",
  "./assets/play/plush-block-4.svg",
  "./assets/play/plush-block-5.svg",
  "./manifest.webmanifest",
  "./icons/favicon-32.png",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
