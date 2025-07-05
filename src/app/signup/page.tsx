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
        </form>
        <div className="relative my-4">
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
            const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: `${location.origin}/auth/callback`,
              },
            })
            if (error) setErrorMsg('Erreur OAuth : ' + error.message)
          }}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <span className="inline-flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.42 0 6.51 1.19 8.93 3.11l6.64-6.64C35.27 2.54 29.93 0 24 0 14.89 0 7.11 5.4 3.43 13.15l7.71 5.99C13.58 13.14 18.63 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.1 24.54c0-1.57-.14-3.04-.39-4.49H24v8.48h12.2c-.5 2.66-1.92 4.92-3.96 6.45l6.39 4.95C42.9 36.12 46.1 30.83 46.1 24.54z"/>
              <path fill="#FBBC05" d="M10.42 28.13c-1.01-2.99-1.01-6.28 0-9.27L2.71 12.87C.53 17.07-.3 21.73.09 26.81c.4 5.22 2.48 9.97 5.66 13.76l7.71-5.99c-2.13-2.24-3.62-5.16-3.62-8.45z"/>
              <path fill="#34A853" d="M24 48c6.5 0 11.97-2.15 15.96-5.85l-7.71-5.99c-2.05 1.38-4.59 2.19-8.25 2.19-5.37 0-10.42-3.64-12.16-8.76l-7.71 5.99C7.11 42.6 14.89 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            S'inscrire avec Google
          </span>
        </button>
      </div>
    </div>
  )
} 