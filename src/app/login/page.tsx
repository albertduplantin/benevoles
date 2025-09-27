'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage('Erreur de connexion : ' + error.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white text-2xl">🎬</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connexion
          </h1>
          <p className="text-gray-600">
            Festival du Film Court - Portail Bénévoles
          </p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200">
          <button
            type="button"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
                },
              })
              if (error) setMessage('Erreur Google: ' + error.message)
            }}
            className="w-full mb-6 px-4 py-3 flex items-center justify-center gap-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 533.5 544.3"><path fill="#4285f4" d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.4H272v95.3h146.9c-6.4 34.4-25.2 63.6-53.7 83.2v68h86.9c50.9-46.8 81.4-115.7 81.4-196.1z"/><path fill="#34a853" d="M272 544.3c72.9 0 134.2-24.1 178.9-65.6l-86.9-68c-24.2 16.2-55.2 25.8-92 25.8-70.7 0-130.6-47.7-152-111.4h-90.2v69.9C72.2 486.7 165.4 544.3 272 544.3z"/><path fill="#fbbc04" d="M120 325.1c-10.8-32.3-10.8-67.8 0-100.1v-69.9H29.8c-28.6 57.1-28.6 124.8 0 181.9L120 325.1z"/><path fill="#ea4335" d="M272 214.5c37.8-.6 73.1 13.8 100.4 39.4l75.1-75.1C403.5 105.1 342.1 80.4 272 81.1 165.4 81.1 72.2 138.7 29.8 224.9l90.2 69.9C141.4 262.2 201.3 214.5 272 214.5z"/></svg>
            <span>Continuer avec Google</span>
          </button>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Adresse e-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 placeholder-gray-400 border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 placeholder-gray-400 border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Se connecter
            </button>
            {message && (
              <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-lg">
                {message}
              </div>
            )}
          </form>
          <p className="mt-6 text-sm text-center text-gray-600">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 