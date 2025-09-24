// Service Worker pour PWA - Festival Bénévoles
const CACHE_NAME = 'festival-benevoles-v1.0.0'
const STATIC_CACHE = 'static-v1.0.0'
const DYNAMIC_CACHE = 'dynamic-v1.0.0'

// Assets à mettre en cache statique
const STATIC_ASSETS = [
  '/',
  '/login',
  '/signup',
  '/profile',
  '/mes-missions',
  '/planning',
  '/admin',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/festival-logo.svg'
]

// Installer le Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installation en cours...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Cache statique créé')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('✅ Service Worker: Installation terminée')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('❌ Service Worker: Erreur lors de l\'installation', error)
      })
  )
})

// Activer le Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activation en cours...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE
            })
            .map((cacheName) => {
              console.log('🗑️ Service Worker: Suppression ancien cache', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        console.log('✅ Service Worker: Activation terminée')
        return self.clients.claim()
      })
  )
})

// Intercepter les requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Stratégie de cache pour les pages
  if (request.method === 'GET') {
    // Pages HTML - Cache First
    if (request.headers.get('accept')?.includes('text/html')) {
      event.respondWith(
        caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('📄 Service Worker: Page servie depuis le cache', url.pathname)
              return cachedResponse
            }
            
            return fetch(request)
              .then((response) => {
                // Mettre en cache les pages réussies
                if (response.status === 200) {
                  const responseClone = response.clone()
                  caches.open(DYNAMIC_CACHE)
                    .then((cache) => {
                      cache.put(request, responseClone)
                    })
                }
                return response
              })
              .catch(() => {
                // Page hors ligne - retourner la page d'accueil
                if (url.pathname.startsWith('/')) {
                  return caches.match('/')
                }
              })
          })
      )
    }
    
    // Assets statiques - Cache First
    else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
      event.respondWith(
        caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('🎨 Service Worker: Asset servi depuis le cache', url.pathname)
              return cachedResponse
            }
            
            return fetch(request)
              .then((response) => {
                if (response.status === 200) {
                  const responseClone = response.clone()
                  caches.open(STATIC_CACHE)
                    .then((cache) => {
                      cache.put(request, responseClone)
                    })
                }
                return response
              })
          })
      )
    }
    
    // API Supabase - Network First
    else if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/')) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            // Mettre en cache les réponses API réussies
            if (response.status === 200) {
              const responseClone = response.clone()
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone)
                })
            }
            return response
          })
          .catch(() => {
            // Retourner depuis le cache si hors ligne
            return caches.match(request)
          })
      )
    }
  }
})

// Gérer les notifications push
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Notification push reçue')
  
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
        missionId: data.missionId
      },
      actions: [
        {
          action: 'open',
          title: 'Ouvrir',
          icon: '/icons/action-open.png'
        },
        {
          action: 'dismiss',
          title: 'Ignorer',
          icon: '/icons/action-dismiss.png'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Service Worker: Clic sur notification', event.action)
  
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/'
    
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          // Ouvrir dans un onglet existant si possible
          for (const client of clientList) {
            if (client.url === url && 'focus' in client) {
              return client.focus()
            }
          }
          
          // Ouvrir un nouvel onglet
          if (clients.openWindow) {
            return clients.openWindow(url)
          }
        })
    )
  }
})

// Gérer les messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

console.log('🎬 Service Worker: Festival Bénévoles PWA chargé')
