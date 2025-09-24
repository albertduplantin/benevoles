// Configuration PWA et Service Worker
export const registerServiceWorker = async () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      console.log('✅ Service Worker enregistré avec succès:', registration.scope)
      
      // Vérifier les mises à jour
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nouvelle version disponible
              console.log('🔄 Nouvelle version PWA disponible')
              // Optionnel: notifier l'utilisateur
            }
          })
        }
      })
      
      return registration
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du Service Worker:', error)
    }
  }
}

// Fonction pour demander les permissions de notification
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}

// Fonction pour vérifier si l'app est installée
export const isAppInstalled = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Vérifier le mode standalone
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }
  
  // Vérifier si l'app est dans la liste des apps installées
  if ('getInstalledRelatedApps' in navigator) {
    // @ts-ignore
    return navigator.getInstalledRelatedApps().then((apps) => apps.length > 0)
  }
  
  return false
}

// Fonction pour détecter le type d'appareil
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// Fonction pour détecter si c'est iOS
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

// Fonction pour détecter si c'est Android
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return /Android/.test(navigator.userAgent)
}

// Configuration des couleurs PWA
export const PWA_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#1f2937',
  textSecondary: '#6b7280'
} as const

// Configuration des tailles d'icônes
export const PWA_ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512] as const
