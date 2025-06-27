'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

export default function AuthButton({ user, onSignOut }: { user: User | null, onSignOut?: () => Promise<void> }) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    if (onSignOut) return onSignOut()
    
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // Même en cas d'erreur, on redirige vers login
      router.push('/login')
    }
  }

  return user ? (
    <div className="flex items-center gap-4">
      <div className="hidden sm:block text-right">
        <p className="text-sm font-medium text-white/90">Connecté(e)</p>
        <p className="text-xs text-gray-400">{user.email}</p>
      </div>
      <button
        onClick={handleSignOut}
        title="Déconnexion"
        className="group px-2 py-2 sm:px-4 sm:py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-red-500/25 border border-red-500/30 relative overflow-hidden flex items-center justify-center"
      >
        <ArrowRightOnRectangleIcon className="w-6 h-6 sm:hidden" />
        <span className="hidden sm:inline relative z-10">Déconnexion</span>
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="group px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm relative overflow-hidden"
      >
        <span className="relative z-10">Connexion</span>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      </Link>
      <Link
        href="/signup"
        className="group px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-blue-500/25 border border-blue-500/30 relative overflow-hidden"
      >
        <span className="relative z-10">S&apos;inscrire</span>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      </Link>
    </div>
  )
} 