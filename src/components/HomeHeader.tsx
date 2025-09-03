'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from './Header'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'

export default function HomeHeader() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null)
      if (data.user) {
        // Vérifier le rôle côté client
        const { data: profile } = await supabase
          .from('users')
          .select('role, first_name, last_name')
          .eq('id', data.user.id)
          .single()
        setIsAdmin(profile?.role === 'admin')
        setUserProfile(profile)
      }
    })
  }, [])

  return (
    <>
      <Header user={user} isAdmin={isAdmin} />
      {user && userProfile && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                👋 Bonjour {userProfile.first_name} !
              </h1>
              <p className="text-gray-600">
                {isAdmin 
                  ? "🛠️ Bienvenue dans votre tableau de bord administrateur" 
                  : "🎬 Prêt à contribuer au Festival du Film Court ?"
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 