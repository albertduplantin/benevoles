'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { joinMission, leaveMission } from '@/app/mission/actions'
import type { UserProfile } from '@/lib/types'

interface Mission {
  id: string | number
  title: string
  description?: string | null
  location: string | null
  start_time: string
  end_time: string
  max_volunteers: number
  manager_id?: string | null
  inscriptions_count: number
  manager?: {
    first_name?: string | null
    last_name?: string | null
    phone?: string
  } | null
  volunteers: {
    user_id: string
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
  }[]
}

interface MissionDetailsModalProps {
  mission: Mission
  currentUser?: User
  userProfile?: UserProfile | null
  onClose: () => void
  onMissionUpdated?: () => void
  isPersonalView?: boolean
  showVolunteerDetails?: boolean
}

export default function MissionDetailsModal({ 
  mission, 
  currentUser, 
  userProfile, 
  onClose, 
  onMissionUpdated,
  isPersonalView = false,
  showVolunteerDetails = false
}: MissionDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isPastMission = (endTime: string) => {
    return new Date(endTime) < new Date()
  }

  const isUserRegistered = currentUser ? mission.volunteers.some(volunteer => volunteer.user_id === currentUser.id) : false
  const isMissionFull = mission.inscriptions_count >= mission.max_volunteers

  const handleJoinMission = async () => {
    if (!currentUser) return
    
    setIsLoading(true)
    setMessage('')

    try {
      const result = await joinMission(Number(mission.id))
      
      if (result) {
        setMessage(`❌ ${result}`)
      } else {
        setMessage('✅ Vous avez été inscrit(e) avec succès !')
        // Fermer la modale après 2 secondes et actualiser les données
        setTimeout(() => {
          onClose()
          onMissionUpdated?.()
        }, 2000)
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      setMessage('❌ Erreur lors de l\'inscription. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveMission = async () => {
    if (!currentUser) return
    
    if (!confirm('Êtes-vous sûr(e) de vouloir vous désinscrire de cette mission ?')) {
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const result = await leaveMission(Number(mission.id))
      
      if (result) {
        setMessage(`❌ ${result}`)
      } else {
        setMessage('✅ Vous avez été désinscrit(e) avec succès !')
        // Fermer la modale après 2 secondes et actualiser les données
        setTimeout(() => {
          onClose()
          onMissionUpdated?.()
        }, 2000)
      }
    } catch (error) {
      console.error('Erreur lors de la désinscription:', error)
      setMessage('❌ Erreur lors de la désinscription. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-white rounded-lg shadow-xl">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{mission.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${isPastMission(mission.end_time)
                  ? 'bg-gray-200 text-gray-600'
                  : 'bg-green-100 text-green-800'
                }
              `}>
                {isPastMission(mission.end_time) ? '✅ Terminée' : '🗓️ À venir'}
              </span>
              {currentUser && isUserRegistered && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  👤 Vous êtes inscrit(e)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Informations principales */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <span className="mr-3 text-lg">📍</span>
                <div>
                  <span className="font-medium">Lieu :</span>
                  <p className="text-gray-600">{mission.location || 'Non spécifié'}</p>
                </div>
              </div>

              <div className="flex items-center text-gray-700">
                <span className="mr-3 text-lg">📅</span>
                <div>
                  <span className="font-medium">Date :</span>
                  <p className="text-gray-600">{formatDate(mission.start_time)}</p>
                </div>
              </div>

              <div className="flex items-center text-gray-700">
                <span className="mr-3 text-lg">⏰</span>
                <div>
                  <span className="font-medium">Horaires :</span>
                  <p className="text-gray-600">
                    {formatTime(mission.start_time)} - {formatTime(mission.end_time)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <span className="mr-3 text-lg">👥</span>
                <div>
                  <span className="font-medium">Bénévoles :</span>
                  <p className="text-gray-600">
                    {mission.inscriptions_count}/{mission.max_volunteers}
                    {isMissionFull && (
                      <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Complet
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {mission.manager && (
                <div className="flex items-center text-gray-700">
                  <span className="mr-3 text-lg">👤</span>
                  <div>
                    <span className="font-medium">Responsable :</span>
                    <p className="text-gray-600">
                      {mission.manager.first_name} {mission.manager.last_name}
                      {mission.manager.phone && (
                        <span className="block text-sm">📞 {mission.manager.phone}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {mission.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Description :</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
              {mission.description}
            </p>
          </div>
        )}

        {/* Liste des bénévoles */}
        {mission.volunteers && mission.volunteers.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Bénévoles inscrits ({mission.volunteers.length}) :
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {mission.volunteers.map((volunteer, index) => (
                <div
                  key={`${volunteer.user_id}-${index}`}
                  className={`
                    p-2 rounded-md text-sm
                    ${currentUser && volunteer.user_id === currentUser.id
                      ? 'bg-purple-100 border border-purple-200 font-medium'
                      : 'bg-gray-50'
                    }
                  `}
                >
                  <span className="mr-2">
                    {currentUser && volunteer.user_id === currentUser.id ? '👤' : '👥'}
                  </span>
                  {volunteer.first_name} {volunteer.last_name}
                  {showVolunteerDetails && volunteer.phone && (
                    <span className="block text-xs text-gray-500">📞 {volunteer.phone}</span>
                  )}
                  {currentUser && volunteer.user_id === currentUser.id && (
                    <span className="ml-2 text-purple-600">(Vous)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">{message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Fermer
          </button>

          {/* Boutons d'inscription/désinscription pour les utilisateurs non-admin */}
          {currentUser && !isPastMission(mission.end_time) && (
            <div className="flex gap-2">
              {isUserRegistered ? (
                <button
                  onClick={handleLeaveMission}
                  disabled={isLoading}
                  className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? '⏳ Désinscription...' : '🚪 Se désinscrire'}
                </button>
              ) : (
                <button
                  onClick={handleJoinMission}
                  disabled={isLoading || isMissionFull}
                  className={`px-4 py-2 text-white rounded-md transition-colors ${
                    isMissionFull
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {isLoading ? '⏳ Inscription...' : isMissionFull ? '❌ Mission complète' : '✅ S\'inscrire'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 