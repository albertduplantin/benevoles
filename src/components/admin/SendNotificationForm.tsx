'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotificationInsert } from '@/lib/types'

interface SendNotificationFormProps {
  missions?: Array<{ id: number; title: string }>
}

export default function SendNotificationForm({ missions = [] }: SendNotificationFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    recipient: 'all', // 'all' | 'mission-specific'
    missionId: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      let recipients: string[] = []

      if (formData.recipient === 'all') {
        // Récupérer tous les bénévoles
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'benevole')

        if (usersError) throw usersError
        recipients = users.map(u => u.id)
      } else if (formData.recipient === 'mission-specific' && formData.missionId) {
        // Récupérer les bénévoles inscrits à cette mission
        const { data: inscriptions, error: inscriptionsError } = await supabase
          .from('inscriptions')
          .select('user_id')
          .eq('mission_id', parseInt(formData.missionId))

        if (inscriptionsError) throw inscriptionsError
        recipients = inscriptions.map(i => i.user_id)
      }

      // Créer les notifications
      const notifications: NotificationInsert[] = recipients.map(userId => ({
        user_id: userId,
        title: formData.title,
        message: formData.message,
        type: formData.type,
        mission_id: formData.recipient === 'mission-specific' && formData.missionId 
          ? parseInt(formData.missionId) 
          : null,
      }))

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (insertError) throw insertError

      setSuccessMessage(`Notification envoyée à ${recipients.length} bénévole${recipients.length > 1 ? 's' : ''}`)
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'info',
        recipient: 'all',
        missionId: '',
      })
      
      setTimeout(() => {
        setIsOpen(false)
        setSuccessMessage('')
      }, 2000)

    } catch (error) {
      setErrorMessage('Erreur lors de l\'envoi de la notification')
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const notificationTypes = [
    { value: 'info', label: 'Information', icon: 'ℹ️', color: 'text-blue-600' },
    { value: 'success', label: 'Succès', icon: '✅', color: 'text-green-600' },
    { value: 'warning', label: 'Attention', icon: '⚠️', color: 'text-yellow-600' },
    { value: 'error', label: 'Erreur', icon: '❌', color: 'text-red-600' },
  ]

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Envoyer une notification
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Envoyer une notification
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {successMessage && (
                <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-800 text-sm">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 text-sm">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Destinataires */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destinataires
                  </label>
                  <select
                    value={formData.recipient}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="all">Tous les bénévoles</option>
                    <option value="mission-specific">Bénévoles d'une mission spécifique</option>
                  </select>
                </div>

                {/* Mission spécifique */}
                {formData.recipient === 'mission-specific' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mission concernée
                    </label>
                    <select
                      value={formData.missionId}
                      onChange={(e) => setFormData(prev => ({ ...prev, missionId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Sélectionner une mission</option>
                      {missions.map((mission) => (
                        <option key={mission.id} value={mission.id.toString()}>
                          {mission.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Type de notification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de notification
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {notificationTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.value as any }))}
                        className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                          formData.type === type.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg mr-2">{type.icon}</span>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Titre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Titre de la notification"
                    required
                    maxLength={100}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Votre message..."
                    required
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.message.length}/500 caractères
                  </p>
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                    disabled={isLoading}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Envoi...
                      </>
                    ) : (
                      'Envoyer'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 