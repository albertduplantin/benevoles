'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ButtonSpinner } from '@/components/ui/Spinner'

interface ContactVolunteersProps {
  missionId: number
  missionTitle: string
  volunteers: Array<{
    user_id: string
    users: {
      first_name: string
      last_name: string
      phone?: string
      email?: string
    }
  }>
  userRole?: string
}

interface ContactForm {
  subject: string
  message: string
  contactMethod: 'notification' | 'email' | 'both'
}

export default function ContactVolunteers({ missionId, missionTitle, volunteers, userRole }: ContactVolunteersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [form, setForm] = useState<ContactForm>({
    subject: '',
    message: '',
    contactMethod: 'notification'
  })

  // Vérifier si l'utilisateur peut contacter les bénévoles
  if (userRole !== 'admin' && userRole !== 'responsable') {
    return null
  }

  const sendMessage = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      alert('Veuillez remplir le sujet et le message')
      return
    }

    if (volunteers.length === 0) {
      alert('Aucun bénévole inscrit à cette mission')
      return
    }

    setIsSending(true)
    try {
      const supabase = createClient()

      if (form.contactMethod === 'notification' || form.contactMethod === 'both') {
        // Créer des notifications pour tous les bénévoles
        const notifications = volunteers.map(volunteer => ({
          user_id: volunteer.user_id,
          title: `[${missionTitle}] ${form.subject}`,
          message: form.message,
          type: 'info' as const,
          read: false,
          mission_id: missionId
        }))

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications)

        if (notificationError) {
          console.error('Erreur lors de l\'envoi des notifications:', notificationError)
          alert('Erreur lors de l\'envoi des notifications')
          return
        }
      }

      if (form.contactMethod === 'email' || form.contactMethod === 'both') {
        // Ici, vous pourriez intégrer un service d'email comme SendGrid, Resend, etc.
        // Pour l'instant, on simule l'envoi d'emails
        console.log('Envoi d\'emails aux bénévoles:', volunteers.map(v => v.users.email))
        alert('Fonctionnalité d\'envoi d\'emails à implémenter')
      }

      // Réinitialiser le formulaire
      setForm({
        subject: '',
        message: '',
        contactMethod: 'notification'
      })
      setIsOpen(false)

      alert(`Message envoyé à ${volunteers.length} bénévole(s)`)
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      alert('Erreur lors de l\'envoi du message')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      {/* Bouton pour ouvrir le modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
      >
        Contacter bénévoles
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                💬 Contacter les bénévoles
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Mission:</strong> {missionTitle}
              </p>
              <p className="text-sm text-blue-600">
                <strong>Bénévoles:</strong> {volunteers.length} personne(s)
              </p>
            </div>

            <div className="space-y-4">
              {/* Sujet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sujet *
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Sujet du message"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Votre message aux bénévoles..."
                />
              </div>

              {/* Méthode de contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Méthode de contact
                </label>
                <select
                  value={form.contactMethod}
                  onChange={(e) => setForm({ ...form, contactMethod: e.target.value as 'notification' | 'email' | 'both' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="notification">🔔 Notification in-app</option>
                  <option value="email">📧 Email (à implémenter)</option>
                  <option value="both">🔔📧 Les deux</option>
                </select>
              </div>
            </div>

            {/* Liste des bénévoles */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destinataires ({volunteers.length})
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {volunteers.map((volunteer, index) => (
                  <div key={volunteer.user_id} className="text-sm text-gray-600 py-1">
                    {index + 1}. {volunteer.users.first_name} {volunteer.users.last_name}
                    {volunteer.users.phone && ` (${volunteer.users.phone})`}
                  </div>
                ))}
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isSending}
              >
                Annuler
              </button>
              <button
                onClick={sendMessage}
                disabled={isSending}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <ButtonSpinner size="sm" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
