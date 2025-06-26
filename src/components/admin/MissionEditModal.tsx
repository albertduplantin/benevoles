'use client'

import { useState } from 'react'
import type { PlanningMission, UserProfile } from '@/lib/types'
import { updateMissionAction } from '@/app/admin/actions'

interface MissionEditModalProps {
  mission: PlanningMission
  users: UserProfile[]
  onClose: () => void
  onMissionUpdated?: () => void
}

export default function MissionEditModal({ mission, users, onClose, onMissionUpdated }: MissionEditModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [volunteers, setVolunteers] = useState(mission.volunteers)
  const [search, setSearch] = useState('')
  const [searchResult, setSearchResult] = useState<UserProfile[]>([])
  const [actionLoading, setActionLoading] = useState(false)

  // Filtrer les bénévoles non inscrits pour la recherche
  const nonInscrits = users.filter(u => !volunteers.some(v => v.user_id === u.id))

  // Recherche dynamique
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    if (e.target.value.length > 1) {
      setSearchResult(
        nonInscrits.filter(u =>
          (u.first_name + ' ' + u.last_name).toLowerCase().includes(e.target.value.toLowerCase())
        )
      )
    } else {
      setSearchResult([])
    }
  }

  // Handler inscription
  const handleInscrire = async (user: UserProfile) => {
    setActionLoading(true)
    // TODO: Appeler l'action serveur pour inscrire
    // Simule l'ajout local pour l'instant
    setVolunteers([...volunteers, {
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || null,
    }])
    setSearch('')
    setSearchResult([])
    setActionLoading(false)
    // TODO: Afficher message de succès/erreur
  }

  // Handler désinscription
  const handleDesinscrire = async (user_id: string) => {
    setActionLoading(true)
    // TODO: Appeler l'action serveur pour désinscrire
    // Simule la suppression locale pour l'instant
    setVolunteers(volunteers.filter(v => v.user_id !== user_id))
    setActionLoading(false)
    // TODO: Afficher message de succès/erreur
  }

  const handleSave = async (formData: FormData) => {
    setIsLoading(true)
    setMessage('')
    try {
      await updateMissionAction(mission.id, formData)
      setMessage('Mission mise à jour avec succès !')
      
      // Appeler le callback de rafraîchissement
      onMissionUpdated?.()
      
      // Fermer la modale après un délai
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      setMessage('Erreur lors de la mise à jour de la mission')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Éditer la mission</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form action={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                name="title"
                defaultValue={mission.title}
                required
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
              <input
                type="text"
                name="location"
                defaultValue={mission.location || ''}
                required
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
              <input
                type="datetime-local"
                name="start_time"
                defaultValue={new Date(mission.start_time).toISOString().slice(0, 16)}
                required
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
              <input
                type="datetime-local"
                name="end_time"
                defaultValue={new Date(mission.end_time).toISOString().slice(0, 16)}
                required
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max bénévoles</label>
              <input
                type="number"
                name="max_volunteers"
                defaultValue={mission.max_volunteers}
                min="1"
                required
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable (optionnel)</label>
              <select
                name="manager_id"
                defaultValue={mission.manager_id || ''}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Aucun responsable assigné</option>
                {users?.filter(user => user.role === 'responsable' || user.role === 'admin').map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.role})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Le responsable sera identifié dans la liste des bénévoles ci-dessous
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              defaultValue={mission.description || ''}
              rows={3}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Section des bénévoles inscrits */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                Bénévoles participants
              </h3>
              <div className="text-sm text-gray-600">
                {volunteers.length} / {mission.max_volunteers} 
                <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {Math.round((volunteers.length / mission.max_volunteers) * 100)}% de couverture
                </span>
              </div>
            </div>

            {/* Barre de recherche pour inscription */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Inscrire un bénévole</label>
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Nom du bénévole..."
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={volunteers.length >= mission.max_volunteers}
              />
              {searchResult.length > 0 && (
                <ul className="border rounded bg-white mt-1 max-h-40 overflow-y-auto">
                  {searchResult.map(user => (
                    <li key={user.id} className="flex items-center justify-between px-3 py-2 hover:bg-blue-50">
                      <span>{user.first_name} {user.last_name}</span>
                      <button
                        className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                        onClick={() => handleInscrire(user)}
                        disabled={actionLoading || volunteers.length >= mission.max_volunteers}
                        type="button"
                      >
                        Inscrire
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {volunteers.length >= mission.max_volunteers && (
                <div className="text-xs text-red-600 mt-1">Nombre maximum de bénévoles atteint</div>
              )}
            </div>

            {/* Liste des bénévoles inscrits avec bouton désinscrire */}
            {/* Affichage du responsable de mission en haut de la liste, s'il y en a un */}
            {mission.manager_id && (() => {
              const manager = users.find(u => u.id === mission.manager_id);
              if (!manager) return null;
              return (
                <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-medium">👑</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{manager.first_name} {manager.last_name}</div>
                      <div className="text-sm text-gray-600">Rôle : {manager.role}</div>
                      {manager.phone && (
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <span>📞</span>
                          <a href={`tel:${manager.phone}`} className="text-purple-600 hover:text-purple-800 transition-colors" title="Cliquer pour appeler">{manager.phone}</a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">ID: {manager.id.slice(0, 8)}...</div>
                </div>
              );
            })()}

            {volunteers.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {volunteers.map((volunteer, index) => (
                  <div 
                    key={volunteer.user_id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {volunteer.first_name} {volunteer.last_name}
                        </div>
                        {volunteer.phone && (
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <span>📞</span>
                            <a 
                              href={`tel:${volunteer.phone}`}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Cliquer pour appeler"
                            >
                              {volunteer.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                      onClick={() => handleDesinscrire(volunteer.user_id)}
                      disabled={actionLoading}
                      type="button"
                    >
                      Désinscrire
                    </button>
                    <div className="text-xs text-gray-500">
                      ID: {volunteer.user_id.slice(0, 8)}...
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <div className="text-2xl mb-2">👥</div>
                <p>Aucun bénévole inscrit pour le moment</p>
                <p className="text-xs mt-1">Les bénévoles peuvent s'inscrire depuis la page d'accueil ou via l'admin</p>
              </div>
            )}
            
            {/* Barre de progression */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    volunteers.length >= mission.max_volunteers
                      ? 'bg-green-500'
                      : volunteers.length >= mission.max_volunteers * 0.7
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (volunteers.length / mission.max_volunteers) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded text-sm ${message.includes('succès') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 