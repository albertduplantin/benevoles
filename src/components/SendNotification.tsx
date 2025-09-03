'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ButtonSpinner } from '@/components/ui/Spinner'
import { MissionWithCounts } from '@/lib/types'

interface SendNotificationProps {
  missions: Array<Omit<MissionWithCounts, 'inscriptions_count'> & { inscriptions_count: number }> | null
  userRole?: string
}

interface NotificationForm {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  targetType: 'all' | 'mission' | 'role'
  targetMission: string
  targetRole: string
}

export default function SendNotification({ missions, userRole }: SendNotificationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all',
    targetMission: '',
    targetRole: 'benevole'
  })

  // Vérifier si l'utilisateur peut envoyer des notifications
  if (userRole !== 'admin' && userRole !== 'responsable') {
    return null
  }

  // Envoyer la notification
  const sendNotification = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      alert('Veuillez remplir le titre et le message')
      return
    }

    setIsSending(true)
    try {
      const supabase = createClient()

      // Déterminer les destinataires
      let targetUsers: string[] = []

      if (form.targetType === 'all') {
        // Tous les utilisateurs
        const { data: allUsers } = await supabase
          .from('users')
          .select('id')
        targetUsers = allUsers?.map(u => u.id) || []
      } else if (form.targetType === 'mission' && form.targetMission) {
        // Utilisateurs inscrits à une mission spécifique
        const { data: inscriptions } = await supabase
          .from('inscriptions')
          .select('user_id')
          .eq('mission_id', form.targetMission)
        targetUsers = inscriptions?.map(i => i.user_id) || []
      } else if (form.targetType === 'role' && form.targetRole) {
        // Utilisateurs avec un rôle spécifique
        const { data: roleUsers } = await supabase
          .from('users')
          .select('id')
          .eq('role', form.targetRole)
        targetUsers = roleUsers?.map(u => u.id) || []
      }

      if (targetUsers.length === 0) {
        alert('Aucun destinataire trouvé pour cette notification')
        return
      }

      // Créer les notifications
      const notifications = targetUsers.map(userId => ({
        user_id: userId,
        title: form.title,
        message: form.message,
        type: form.type,
        read: false,
        mission_id: form.targetType === 'mission' ? form.targetMission : null
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) {
        console.error('Erreur lors de l\'envoi de la notification:', error)
        alert('Erreur lors de l\'envoi de la notification')
        return
      }

      // Réinitialiser le formulaire
      setForm({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all',
        targetMission: '',
        targetRole: 'benevole'
      })
      setIsOpen(false)

      alert(`Notification envoyée à ${targetUsers.length} utilisateur(s)`)
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error)
      alert('Erreur lors de l\'envoi de la notification')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      {/* Bouton pour ouvrir le modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828zM4.828 17l2.586-2.586a2 2 0 012.828 0L12.828 17H4.828z" />
        </svg>
        Envoyer une notification
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📢 Envoyer une notification
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

            <div className="space-y-4">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Titre de la notification"
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
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Message de la notification"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="info">ℹ️ Information</option>
                  <option value="success">✅ Succès</option>
                  <option value="warning">⚠️ Avertissement</option>
                  <option value="error">❌ Erreur</option>
                </select>
              </div>

              {/* Destinataires */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destinataires
                </label>
                <select
                  value={form.targetType}
                  onChange={(e) => setForm({ ...form, targetType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">👥 Tous les utilisateurs</option>
                  <option value="mission">🎯 Mission spécifique</option>
                  <option value="role">👤 Rôle spécifique</option>
                </select>
              </div>

              {/* Mission spécifique */}
              {form.targetType === 'mission' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mission
                  </label>
                  <select
                    value={form.targetMission}
                    onChange={(e) => setForm({ ...form, targetMission: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner une mission</option>
                    {missions?.map(mission => (
                      <option key={mission.id} value={mission.id}>
                        {mission.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Rôle spécifique */}
              {form.targetType === 'role' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rôle
                  </label>
                  <select
                    value={form.targetRole}
                    onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="benevole">👤 Bénévoles</option>
                    <option value="responsable">👨‍💼 Responsables</option>
                    <option value="admin">👑 Administrateurs</option>
                  </select>
                </div>
              )}
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
                onClick={sendNotification}
                disabled={isSending}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
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
