// Cuba Watch PWA Service Worker
const CACHE = 'cuba-watch-v3';
const SHELL = ['/', '/style.css', '/app.js', '/manifest.json'];
const OFFLINE_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · Cuba Watch</title><style>body{font-family:monospace;background:#000;color:#00ff41;display:grid;place-items:center;min-height:100vh;margin:0}.card{border:1px solid #008f11;padding:24px;max-width:520px;background:#050805}</style></head><body><div class="card"><h1>Cuba Watch offline</h1><p>The shell is cached. Live OSINT feeds and map tiles need network access.</p><a style="color:#00ffff" href="/">Retry</a></div></body></html>`;
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') e.respondWith(fetch(e.request).catch(() => caches.match('/').then(r => r || new Response(OFFLINE_HTML, {headers:{'Content-Type':'text/html'}}))));
  else e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => r)));
});
