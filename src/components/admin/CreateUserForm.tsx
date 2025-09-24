'use client'

import { useState, useRef } from 'react'
import { createUserAction } from '@/app/admin/actions'

export default function CreateUserForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    const result = await createUserAction(formData)
    if (result) {
      alert(result)
      if (result.includes('succès')) {
        setIsOpen(false)
        // Reset form
        if (formRef.current) {
          formRef.current.reset()
        }
      }
    }
    setIsLoading(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        Créer un utilisateur
      </button>
    )
  }

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Créer un nouvel utilisateur</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
              Prénom *
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              required
<<<<<<< HEAD
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900"
              style={{ colorScheme: 'light' }}
=======
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
>>>>>>> f04bd292517aef758b35a542c8acbf0c58acef3e
            />
          </div>
          
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
              Nom *
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              required
<<<<<<< HEAD
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900"
              style={{ colorScheme: 'light' }}
=======
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
>>>>>>> f04bd292517aef758b35a542c8acbf0c58acef3e
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
<<<<<<< HEAD
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900"
            style={{ colorScheme: 'light' }}
=======
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
>>>>>>> f04bd292517aef758b35a542c8acbf0c58acef3e
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Mot de passe temporaire *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={6}
<<<<<<< HEAD
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900"
            style={{ colorScheme: 'light' }}
=======
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
>>>>>>> f04bd292517aef758b35a542c8acbf0c58acef3e
          />
          <p className="mt-1 text-sm text-gray-500">
            Minimum 6 caractères. L&apos;utilisateur pourra le changer après connexion.
          </p>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Téléphone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
<<<<<<< HEAD
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900"
            style={{ colorScheme: 'light' }}
=======
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
>>>>>>> f04bd292517aef758b35a542c8acbf0c58acef3e
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Rôle
          </label>
          <select
            id="role"
            name="role"
            defaultValue="benevole"
<<<<<<< HEAD
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900"
            style={{ colorScheme: 'light' }}
=======
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
>>>>>>> f04bd292517aef758b35a542c8acbf0c58acef3e
          >
            <option value="benevole">Bénévole</option>
            <option value="responsable">Responsable</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Création...' : 'Créer l\'utilisateur'}
          </button>
        </div>
      </form>
    </div>
  )
} 