// City Arena keeps its page on the device, so it still opens when the network to the page's host is slow or stuck.
// Each opening asks for a fresh copy first (so a release shows at once); if none arrives within three seconds the kept
// page is shown instead, and the fresh copy, when it comes, is kept for the next opening. Only the page itself is kept:
// the venue's data always comes from the server.
const PAGE_CACHE = 'city-arena-page';
const WAIT_MS = 3000;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.mode !== 'navigate' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(PAGE_CACHE).then(async cache => {
    const kept = await cache.match('./');
    const fresh = fetch(request.url, { cache: 'no-store', credentials: 'same-origin' }).then(response => {
      if (response.ok) cache.put('./', response.clone());
      return response;
    });
    event.waitUntil(fresh.catch(() => null));
    if (!kept) return fresh;
    const late = new Promise(resolve => setTimeout(() => resolve(null), WAIT_MS));
    const first = await Promise.race([fresh.catch(() => null), late]);
    return first && first.ok ? first : kept;
  }));
});
