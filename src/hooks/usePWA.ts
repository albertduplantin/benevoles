'use client'

import { useState, useEffect } from 'react'
import { registerServiceWorker, requestNotificationPermission, isAppInstalled, getDeviceType, isIOS, isAndroid } from '@/lib/pwa'

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [isIOSDevice, setIsIOSDevice] = useState(false)
  const [isAndroidDevice, setIsAndroidDevice] = useState(false)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Enregistrer le Service Worker
    registerServiceWorker().then((registration) => {
      if (registration) {
        setSwRegistration(registration)
      }
    })

    // Vérifier si l'app est installée
    const checkInstalled = async () => {
      const installed = await isAppInstalled()
      setIsInstalled(installed)
    }
    checkInstalled()

    // Détecter le type d'appareil
    setDeviceType(getDeviceType())
    setIsIOSDevice(isIOS())
    setIsAndroidDevice(isAndroid())

    // Écouter les changements de connectivité
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Écouter les changements de taille d'écran
    const handleResize = () => setDeviceType(getDeviceType())
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const requestNotifications = async () => {
    return await requestNotificationPermission()
  }

  const isMobile = deviceType === 'mobile'
  const isTablet = deviceType === 'tablet'
  const isDesktop = deviceType === 'desktop'

  return {
    isInstalled,
    isOnline,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isIOSDevice,
    isAndroidDevice,
    swRegistration,
    requestNotifications
  }
}
