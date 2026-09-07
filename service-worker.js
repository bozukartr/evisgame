"use strict";

const CACHE_VERSION = "evisgame-v2.1.0";
const APP_SHELL = [
  "./",
  "./index.html",
  "./playground.js",
  "./touch-art.js",
  "./sensory.js",
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
