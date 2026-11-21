// City Arena no longer opens from a copy kept on the device (owner, 21 November: "do not fucking let the page only open" — a counter's
// screen opened and took six hours of changes while it could not reach the server). This worker only takes the place of the one that
// kept the page: it removes what that one kept and lets every opening come from the network, so without internet the page does not open.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))).then(() => self.clients.claim())));
