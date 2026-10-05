"use strict";

const CACHE_NAME = "dork-ops-terminal-v47";
const APP_FILES = [
  "./",
  "./index.html",
  "./dork-ops.html",
  "./dork-ops-desktop.js",
  "./terminal.html",
  "./dork-ops-terminal.js",
  "./terminal.css",
  "./add-web.html",
  "./add-web.js",
  "./dork-engine.html",
  "./lab-learning.js",
  "./field-guide.html",
  "./field-guide.css",
  "./field-guide.js",
  "./styles.css",
  "./script.js",
  "./password-tools.js",
  "./recommendations.js",
  "./dorkops-ui.js",
  "./manifest.webmanifest",
  "./icons/dork-ops.png",
  "./icons/LUCIDE-LICENSE.txt",
  "./search-operators.html",
  "./operators.js",
  "./nmap-reference.html",
  "./nmap.js",
  "./password-tools.html",
  "./kali-tools.html",
  "./kali-tools.js",
  "./about.html",
  "./terms.html"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
  )));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(request, { ignoreSearch: true }).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        return caches.open(CACHE_NAME)
          .then(cache => cache.put(request, copy))
          .then(() => response)
          .catch(error => {
            console.error("Could not cache a Dork Ops resource.", error);
            return response;
          });
      }
      return response;
    }).catch(error => {
      if (request.mode === "navigate") {
        return caches.match("./dork-ops.html", { ignoreSearch: true }).then(fallback => {
          if (fallback) return fallback;
          throw error;
        });
      }
      throw error;
    });
  }));
});
