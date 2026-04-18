const CACHE_NAME = 'skin-condition-analyzer-v3'
const CORE_FILES = ['/manifest.webmanifest']

const isNavigationRequest = (request) => {
  return request.mode === 'navigate'
}

const isCacheableStaticAsset = (url) => {
  const sameOrigin = url.origin === self.location.origin
  if (!sameOrigin) {
    return false
  }

  const path = url.pathname
  return (
    path.includes('/assets/') ||
    path.startsWith('/mediapipe/') ||
    path.endsWith('.css') ||
    path.endsWith('.js') ||
    path.endsWith('.wasm') ||
    path.endsWith('.data') ||
    path.endsWith('.tflite') ||
    path.endsWith('.binarypb') ||
    path.endsWith('.png') ||
    path.endsWith('.svg') ||
    path.endsWith('.jpg') ||
    path.endsWith('.jpeg') ||
    path.endsWith('.webp') ||
    path.endsWith('.ico')
  )
}

const networkFirst = async (request) => {
  const cache = await caches.open(CACHE_NAME)
  try {
    const networkResponse = await fetch(request, { cache: 'no-store' })
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' })
  }
}

const cacheFirst = async (request) => {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  const networkResponse = await fetch(request)
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone())
  }
  return networkResponse
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_FILES))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request))
    return
  }

  if (!isCacheableStaticAsset(url)) {
    return
  }

  event.respondWith(cacheFirst(request))
})
