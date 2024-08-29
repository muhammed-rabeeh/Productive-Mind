const CACHE_NAME = 'tron-productivity-v1';
const urlsToCache = [
  '/Productive-Mind/',
  '/Productive-Mind//index.html',
  '/Productive-Mind//signin.html',
  '/Productive-Mind//styles.css',
  '/Productive-Mind//script.js',
  '/Productive-Mind//manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
