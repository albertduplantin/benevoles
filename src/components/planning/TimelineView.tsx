'use client'

import { useState, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { PlanningMission, UserProfile } from '@/lib/types'
import MissionEditModal from '@/components/admin/MissionEditModal'
import MissionDetailsModal from '@/components/MissionDetailsModal'

interface TimelineViewProps {
  missions: PlanningMission[]
  users: UserProfile[]
  isAdmin: boolean
  currentUser: User
  onMissionUpdated?: () => void
}

export default function TimelineView({ missions, users, isAdmin, currentUser, onMissionUpdated }: TimelineViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedMission, setSelectedMission] = useState<PlanningMission | null>(null)

  // Grouper les missions par date
  const missionsByDate = useMemo(() => {
    const groups: Record<string, PlanningMission[]> = {}
    
    missions.forEach(mission => {
      const date = new Date(mission.start_time).toISOString().split('T')[0]
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(mission)
    })
    
    // Trier les missions de chaque jour par heure de début
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
    })
    
    return groups
  }, [missions])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return `${diffHours.toFixed(1)}h`
  }

  const getMissionColor = (mission: PlanningMission) => {
    // Vérifier si l'utilisateur actuel est inscrit à cette mission
    const isUserRegistered = mission.volunteers.some(volunteer => volunteer.user_id === currentUser.id)
    
    if (isUserRegistered) {
      // Couleur spéciale pour les missions auxquelles l'utilisateur est inscrit
      return 'border-l-purple-500 bg-purple-50 ring-2 ring-purple-200'
    }
    
    const coverage = mission.inscriptions_count / mission.max_volunteers
    if (coverage >= 1) return 'border-l-green-500 bg-green-50'
    if (coverage >= 0.7) return 'border-l-yellow-500 bg-yellow-50'
    return 'border-l-red-500 bg-red-50'
  }

  const getAvailableDates = () => {
    return Object.keys(missionsByDate).sort()
  }

  const selectedMissions = missionsByDate[selectedDate] || []

  return (
    <div className="p-6">
      {/* Sélecteur de date */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Vue Timeline</h2>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {getAvailableDates().length > 0 ? (
              getAvailableDates().map(date => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </option>
              ))
            ) : (
              <option value="">Aucune mission trouvée</option>
            )}
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          {selectedMissions.length} mission{selectedMissions.length > 1 ? 's' : ''} ce jour
        </div>
      </div>

      {selectedMissions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📅</div>
          <p className="text-lg font-medium">Aucune mission ce jour</p>
          <p className="text-sm">Sélectionnez une autre date dans la liste</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Légende */}
          <div className="flex items-center gap-6 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-50 border-l-4 border-purple-500 ring-1 ring-purple-200"></div>
              <span className="text-gray-600">Mes missions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-50 border-l-4 border-green-500"></div>
              <span className="text-gray-600">Complet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-50 border-l-4 border-yellow-500"></div>
              <span className="text-gray-600">Partiellement couvert</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-50 border-l-4 border-red-500"></div>
              <span className="text-gray-600">Places disponibles</span>
            </div>
          </div>

          {selectedMissions.map((mission) => (
            <div
              key={mission.id}
              className={`border-l-4 p-4 rounded-lg shadow-sm ${getMissionColor(mission)} cursor-pointer hover:shadow-md transition-shadow relative group`}
              onClick={() => setSelectedMission(mission)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {mission.title}
                    </h3>
                    {isAdmin && (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 text-sm">✏️ Cliquer pour éditer</span>
                    )}
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {formatTime(mission.start_time)} - {formatTime(mission.end_time)}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                      {formatDuration(mission.start_time, mission.end_time)}
                    </span>
                  </div>
                  
                  {mission.description && (
                    <p className="text-gray-600 mb-3 text-sm">{mission.description}</p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    {mission.location && (
                      <div className="flex items-center gap-1">
                        <span>📍</span>
                        <span>{mission.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-2xl font-bold mb-1 ${
                    mission.inscriptions_count >= mission.max_volunteers
                      ? 'text-green-600'
                      : mission.inscriptions_count >= mission.max_volunteers * 0.7
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {mission.inscriptions_count}/{mission.max_volunteers}
                  </div>
                  <div className="text-xs text-gray-500">bénévoles</div>
                  <div className="mt-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          mission.inscriptions_count >= mission.max_volunteers
                            ? 'bg-green-500'
                            : mission.inscriptions_count >= mission.max_volunteers * 0.7
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (mission.inscriptions_count / mission.max_volunteers) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Liste des bénévoles */}
              {mission.volunteers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Bénévoles participants ({mission.volunteers.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {mission.volunteers.map((volunteer) => (
                      <span
                        key={volunteer.user_id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {volunteer.first_name} {volunteer.last_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Affichage du responsable */}
              {mission.manager && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <span>👑</span>
                    Responsable de mission
                  </h4>
                  <div className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                    {mission.manager.first_name} {mission.manager.last_name}
                  </div>
                </div>
              )}
              
              {/* Places restantes */}
              {mission.inscriptions_count < mission.max_volunteers && (
                <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                  <span className="text-orange-700 font-medium">
                    {mission.max_volunteers - mission.inscriptions_count} place{mission.max_volunteers - mission.inscriptions_count > 1 ? 's' : ''} disponible{mission.max_volunteers - mission.inscriptions_count > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Résumé de la journée */}
      {selectedMissions.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Résumé de la journée</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{selectedMissions.length}</div>
              <div className="text-sm text-blue-700">Mission{selectedMissions.length > 1 ? 's' : ''}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {selectedMissions.reduce((sum, m) => sum + m.max_volunteers, 0)}
              </div>
              <div className="text-sm text-green-700">Places totales</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {selectedMissions.reduce((sum, m) => sum + m.inscriptions_count, 0)}
              </div>
              <div className="text-sm text-orange-700">Places occupées</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(
                  (selectedMissions.reduce((sum, m) => sum + m.inscriptions_count, 0) /
                   selectedMissions.reduce((sum, m) => sum + m.max_volunteers, 0)) * 100
                ) || 0}%
              </div>
              <div className="text-sm text-purple-700">Taux de couverture</div>
            </div>
          </div>
        </div>
      )}

      {/* Modale de détails */}
      {selectedMission && !isAdmin && (
        <MissionDetailsModal
          mission={selectedMission}
          currentUser={currentUser}
          onClose={() => setSelectedMission(null)}
          onMissionUpdated={onMissionUpdated}
          showVolunteerDetails={true}
        />
      )}

      {/* Modale d'édition pour admin */}
      {selectedMission && isAdmin && (
        <MissionEditModal
          mission={selectedMission}
          users={users}
          onClose={() => setSelectedMission(null)}
          onMissionUpdated={() => {
            setSelectedMission(null)
            onMissionUpdated?.()
          }}
        />
      )}
    </div>
  )
} 