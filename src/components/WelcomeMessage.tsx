'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface WelcomeMessageProps {
  user: User | null
  page?: string
}

export default function WelcomeMessage({ user, page = 'home' }: WelcomeMessageProps) {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    supabase
      .from('users')
      .select('first_name, last_name, role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setUserProfile(data)
        setIsLoading(false)
      })
  }, [user])

  if (isLoading || !user || !userProfile) {
    return null
  }

  const getWelcomeMessage = () => {
    const firstName = userProfile.first_name || 'Bénévole'
    const isAdmin = userProfile.role === 'admin'
    
    switch (page) {
      case 'profile':
        return {
          title: `👤 Bonjour ${firstName} !`,
          subtitle: isAdmin 
            ? "🛠️ Gérez votre profil administrateur" 
            : "⚙️ Personnalisez votre profil bénévole"
        }
      case 'missions':
        return {
          title: `📋 Mes Missions`,
          subtitle: isAdmin 
            ? "🎯 Gérez toutes les missions du festival" 
            : "🎬 Voici vos missions assignées"
        }
      case 'planning':
        return {
          title: `📅 Planning Global`,
          subtitle: isAdmin 
            ? "📊 Vue d'ensemble complète des missions" 
            : "🎯 Consultez le planning des missions"
        }
      case 'admin':
        return {
          title: `🛠️ Tableau de Bord Admin`,
          subtitle: "⚡ Gérez le festival et les bénévoles"
        }
      default:
        return {
          title: `👋 Bonjour ${firstName} !`,
          subtitle: isAdmin 
            ? "🛠️ Bienvenue dans votre tableau de bord administrateur" 
            : "🎬 Prêt à contribuer au Festival du Film Court ?"
        }
    }
  }

  const message = getWelcomeMessage()

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {message.title}
          </h1>
          <p className="text-gray-600">
            {message.subtitle}
          </p>
        </div>
      </div>
    </div>
  )
}
