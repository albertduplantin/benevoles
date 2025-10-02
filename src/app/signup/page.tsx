'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [acceptsContactSharing, setAcceptsContactSharing] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')
    setErrorMsg('')
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone,
          accepts_contact_sharing: acceptsContactSharing,
        },
      },
    })

    if (error) {
      setErrorMsg("Erreur lors de l'inscription : " + error.message)
    } else if (data.user) {
      setMessage("Inscription réussie ! Veuillez vérifier vos e-mails pour confirmer votre compte.")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Créer un compte bénévole
        </h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                Prénom
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="w-1/2">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Nom
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Téléphone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
             <p className="mt-1 text-xs text-gray-500">6 caractères minimum.</p>
          </div>
          <div className="flex items-center">
            <input
              id="acceptsContactSharing"
              type="checkbox"
              checked={acceptsContactSharing}
              onChange={(e) => setAcceptsContactSharing(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label
              htmlFor="acceptsContactSharing"
              className="ml-2 block text-sm text-gray-900"
            >
              J&apos;accepte de partager mes coordonnées avec les autres bénévoles.
            </label>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            S&apos;inscrire
          </button>
          {message && (
            <p className="mt-2 text-sm text-center text-green-600">{message}</p>
          )}
          {errorMsg && (
            <p className="mt-2 text-sm text-center text-red-600">{errorMsg}</p>
          )}
          <div className="relative mb-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
              if (error) {
                setErrorMsg('Erreur OAuth : ' + error.message)
              }
            }}
            className="w-full px-4 py-3 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true"><path fill="currentColor" d="M21.35 11.1h-9.18v2.96h5.85c-.25 1.54-1.57 4.52-5.85 4.52-3.52 0-6.38-2.91-6.38-6.5s2.86-6.5 6.38-6.5c2 0 3.34.86 4.11 1.6l2.81-2.7C17.36 3.19 15.15 2 12.17 2 6.74 2 2.39 6.48 2.39 12s4.35 10 9.78 10c5.66 0 9.4-3.98 9.4-9.56 0-.64-.07-1.13-.22-1.34Z"/></svg>
            <span>Continuer avec Google</span>
          </button>
        </form>
      </div>
    </div>
  )
} 