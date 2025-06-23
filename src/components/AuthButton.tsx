'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'

export default function AuthButton({ user }: { user: User | null }) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm">Bonjour, {user.email}</span>
      <button
        onClick={handleSignOut}
        className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
      >
        Déconnexion
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="px-4 py-2 text-sm text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300"
      >
        Connexion
      </Link>
      <Link
        href="/signup"
        className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        S'inscrire
      </Link>
    </div>
  )
} 