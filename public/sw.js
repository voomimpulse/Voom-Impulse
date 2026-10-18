const NOM_CACHE = "voom-impulse-v1";
const FICHIERS_ESSENTIELS = ["/", "/manifest.json", "/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(NOM_CACHE).then((cache) => cache.addAll(FICHIERS_ESSENTIELS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(noms.filter((n) => n !== NOM_CACHE).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // On ne met en cache que des requêtes GET de même origine.
  // Jamais les requêtes authentifiées (jeton Bearer), ni les appels d'API (/api/),
  // ni les requêtes externes (ex : Supabase), dont les données sont personnelles ou dynamiques.
  if (event.request.method !== "GET") return;
  if (event.request.headers.has("authorization")) return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((reponse) => {
        // Seules les réponses réussies et de même origine sont mises en cache
        if (reponse.ok && reponse.type === "basic") {
          const copie = reponse.clone();
          caches.open(NOM_CACHE).then((cache) => cache.put(event.request, copie));
        }
        return reponse;
      })
      .catch(() => caches.match(event.request))
  );
});
