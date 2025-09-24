'use client'

import { useState, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { PlanningMission, UserProfile } from '@/lib/types'

interface VolunteerViewProps {
  missions: PlanningMission[]
  users: UserProfile[]
  isAdmin: boolean
  currentUser: User
  onMissionUpdated?: () => void
}

export default function VolunteerView({ missions, users, isAdmin, currentUser, onMissionUpdated }: VolunteerViewProps) {
  const [expandedVolunteer, setExpandedVolunteer] = useState<string | null>(null)

  // Grouper les missions par bénévole
  const missionsByVolunteer = useMemo(() => {
    const groups: Record<string, { volunteer: UserProfile; missions: PlanningMission[] }> = {}
    
    missions.forEach(mission => {
      mission.volunteers.forEach(volunteer => {
        const volunteerId = volunteer.user_id
        
        if (!groups[volunteerId]) {
          const volunteerProfile = users.find(u => u.id === volunteerId)
          if (volunteerProfile) {
            groups[volunteerId] = {
              volunteer: volunteerProfile,
              missions: []
            }
          }
        }
        
        if (groups[volunteerId]) {
          groups[volunteerId].missions.push(mission)
        }
      })
    })
    
    // Trier les missions de chaque bénévole par date
    Object.values(groups).forEach(group => {
      group.missions.sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
    })
    
    return groups
  }, [missions, users])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateTotalHours = (missions: PlanningMission[]) => {
    return missions.reduce((total, mission) => {
      const start = new Date(mission.start_time)
      const end = new Date(mission.end_time)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return total + hours
    }, 0)
  }

  const toggleVolunteer = (volunteerId: string) => {
    setExpandedVolunteer(expandedVolunteer === volunteerId ? null : volunteerId)
  }

  const volunteerList = Object.entries(missionsByVolunteer)
    .sort(([, a], [, b]) => b.missions.length - a.missions.length)

  if (volunteerList.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-lg font-medium">Aucun bénévole inscrit</p>
          <p className="text-sm">Les missions n'ont pas encore de bénévoles assignés</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Vue par Bénévole</h2>
        <div className="text-sm text-gray-600">
          {volunteerList.length} bénévole{volunteerList.length > 1 ? 's' : ''} assigné{volunteerList.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{volunteerList.length}</div>
          <div className="text-sm text-blue-700">Bénévoles actifs</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {volunteerList.reduce((sum, [, group]) => sum + group.missions.length, 0)}
          </div>
          <div className="text-sm text-green-700">Inscriptions totales</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(volunteerList.reduce((sum, [, group]) => sum + calculateTotalHours(group.missions), 0))}h
          </div>
          <div className="text-sm text-orange-700">Heures totales</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(volunteerList.reduce((sum, [, group]) => sum + group.missions.length, 0) / volunteerList.length)}
          </div>
          <div className="text-sm text-purple-700">Missions / bénévole</div>
        </div>
      </div>

      {/* Liste des bénévoles */}
      <div className="space-y-3">
        {volunteerList.map(([volunteerId, group]) => {
          const isExpanded = expandedVolunteer === volunteerId
          const totalHours = calculateTotalHours(group.missions)
          
          return (
            <div key={volunteerId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleVolunteer(volunteerId)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">
                        {group.volunteer.first_name?.[0]}{group.volunteer.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {group.volunteer.first_name} {group.volunteer.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {group.missions.length} mission{group.missions.length > 1 ? 's' : ''} • {Math.round(totalHours)}h total
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {Math.round(totalHours)}h
                      </div>
                      <div className="text-xs text-gray-500">
                        {group.missions.length} mission{group.missions.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ↓
                    </div>
                  </div>
                </div>
              </button>
              
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="space-y-3">
                    {group.missions.map((mission) => (
                      <div
                        key={mission.id}
                        className="bg-white rounded-lg p-3 border border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {mission.title}
                            </h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>🕐 {formatTime(mission.start_time)}</div>
                              {mission.location && (
                                <div>📍 {mission.location}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <div>
                              {Math.round(
                                (new Date(mission.end_time).getTime() - 
                                 new Date(mission.start_time).getTime()) / (1000 * 60 * 60)
                              )}h
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Informations supplémentaires */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Email :</span>
                        <span className="ml-2 text-gray-900">{group.volunteer.id}</span>
                      </div>
                      {group.volunteer.phone && (
                        <div>
                          <span className="text-gray-600">Téléphone :</span>
                          <span className="ml-2 text-gray-900">{group.volunteer.phone}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">Rôle :</span>
                        <span className="ml-2 text-gray-900 capitalize">{group.volunteer.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bénévoles non assignés */}
      {users.filter(u => u.role === 'benevole' && !missionsByVolunteer[u.id]).length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Bénévoles non assignés ({users.filter(u => u.role === 'benevole' && !missionsByVolunteer[u.id]).length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {users
              .filter(u => u.role === 'benevole' && !missionsByVolunteer[u.id])
              .map(volunteer => (
                <div key={volunteer.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-bold text-xs">
                        {volunteer.first_name?.[0]}{volunteer.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {volunteer.first_name} {volunteer.last_name}
                      </div>
                      <div className="text-xs text-gray-500">Disponible</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
} 