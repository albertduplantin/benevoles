'use client'

import { useState, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { PlanningMission, UserProfile, PlanningView as ViewType, PlanningFilters as PlanningFiltersType, ConflictDetection, PlanningStats as PlanningStatsType } from '@/lib/types'
import PlanningFilters from './PlanningFilters'
import CalendarView from './CalendarView'
import TimelineView from './TimelineView'
import VolunteerView from './VolunteerView'
import SectorView from './SectorView'
import PlanningStats from './PlanningStats'
import ConflictsList from './ConflictsList'

interface PlanningViewProps {
  missions: PlanningMission[]
  users: UserProfile[]
  currentUser: User
}

export default function PlanningView({ missions, users }: PlanningViewProps) {
  const [currentView, setCurrentView] = useState<ViewType>('calendar')
  const [filters, setFilters] = useState<PlanningFiltersType>({})
  const [showStats, setShowStats] = useState(false)
  const [showConflicts, setShowConflicts] = useState(false)

  // Filtrer les missions selon les critères
  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      // Filtre par date
      if (filters.start_date && mission.start_time < filters.start_date) return false
      if (filters.end_date && mission.end_time > filters.end_date) return false
      
      // Filtre par bénévole
      if (filters.volunteer_id) {
        const hasVolunteer = mission.volunteers.some(v => v.user_id === filters.volunteer_id)
        if (!hasVolunteer) return false
      }
      
      // Filtre par responsable
      if (filters.manager_id && mission.manager_id !== filters.manager_id) return false
      
      // Filtre par lieu
      if (filters.location && !mission.location?.toLowerCase().includes(filters.location.toLowerCase())) return false
      
      // Filtre par statut
      if (filters.status && filters.status !== 'all') {
        switch (filters.status) {
          case 'full':
            if (mission.inscriptions_count < mission.max_volunteers) return false
            break
          case 'available':
            if (mission.inscriptions_count >= mission.max_volunteers) return false
            break
          case 'conflicts':
            // Sera implémenté avec la détection de conflits
            break
        }
      }
      
      return true
    })
  }, [missions, filters])

  // Détection des conflits d'horaires
  const conflicts = useMemo(() => {
    const conflictList: ConflictDetection[] = []
    const volunteerMissions: Record<string, PlanningMission[]> = {}
    
    // Grouper les missions par bénévole
    filteredMissions.forEach(mission => {
      mission.volunteers.forEach(volunteer => {
        if (!volunteerMissions[volunteer.user_id]) {
          volunteerMissions[volunteer.user_id] = []
        }
        volunteerMissions[volunteer.user_id].push(mission)
      })
    })
    
    // Détecter les conflits pour chaque bénévole
    Object.entries(volunteerMissions).forEach(([volunteerId, missions]) => {
      const volunteerConflicts: ConflictDetection['conflicts'] = []
      
      for (let i = 0; i < missions.length; i++) {
        for (let j = i + 1; j < missions.length; j++) {
          const mission1 = missions[i]
          const mission2 = missions[j]
          
          // Vérifier si les missions se chevauchent
          const start1 = new Date(mission1.start_time)
          const end1 = new Date(mission1.end_time)
          const start2 = new Date(mission2.start_time)
          const end2 = new Date(mission2.end_time)
          
          if (start1 < end2 && start2 < end1) {
            const overlapStart = start1 > start2 ? start1 : start2
            const overlapEnd = end1 < end2 ? end1 : end2
            
            volunteerConflicts.push({
              mission1,
              mission2,
              overlap_start: overlapStart.toISOString(),
              overlap_end: overlapEnd.toISOString()
            })
          }
        }
      }
      
      if (volunteerConflicts.length > 0) {
        const volunteer = users.find(u => u.id === volunteerId)
        if (volunteer) {
          conflictList.push({
            volunteer_id: volunteerId,
            volunteer_name: `${volunteer.first_name || ''} ${volunteer.last_name || ''}`.trim(),
            conflicts: volunteerConflicts
          })
        }
      }
    })
    
    return conflictList
  }, [filteredMissions, users])

  // Calcul des statistiques
  const stats: PlanningStatsType = useMemo(() => {
    const totalVolunteerSlots = filteredMissions.reduce((sum, m) => sum + m.max_volunteers, 0)
    const filledSlots = filteredMissions.reduce((sum, m) => sum + m.inscriptions_count, 0)
    
    const missionsByDay: Record<string, number> = {}
    filteredMissions.forEach(mission => {
      const date = new Date(mission.start_time).toISOString().split('T')[0]
      missionsByDay[date] = (missionsByDay[date] || 0) + 1
    })
    
    return {
      total_missions: filteredMissions.length,
      total_volunteer_slots: totalVolunteerSlots,
      filled_slots: filledSlots,
      coverage_percentage: totalVolunteerSlots > 0 ? Math.round((filledSlots / totalVolunteerSlots) * 100) : 0,
      conflicts_count: conflicts.length,
      missions_by_day: missionsByDay
    }
  }, [filteredMissions, conflicts])

  const views = [
    { id: 'calendar', name: 'Calendrier', icon: '📅' },
    { id: 'timeline', name: 'Timeline', icon: '📊' },
    { id: 'volunteer', name: 'Par Bénévole', icon: '👥' },
    { id: 'sector', name: 'Par Secteur', icon: '🏷️' }
  ]

  return (
    <div className="space-y-6">
      {/* Barre d'outils */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Onglets de vue */}
          <div className="flex flex-wrap gap-2">
            {views.map(view => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id as ViewType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === view.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{view.icon}</span>
                {view.name}
              </button>
            ))}
          </div>
          
          {/* Boutons d'action */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showStats
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              📊 Stats
            </button>
            <button
              onClick={() => setShowConflicts(!showConflicts)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                showConflicts
                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              ⚠️ Conflits
              {conflicts.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {conflicts.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <PlanningFilters
        filters={filters}
        onFiltersChange={setFilters}
        users={users}
        missions={missions}
      />

      {/* Statistiques */}
      {showStats && (
        <PlanningStats stats={stats} />
      )}

      {/* Liste des conflits */}
      {showConflicts && (
        <ConflictsList conflicts={conflicts} />
      )}

      {/* Vue principale */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {currentView === 'calendar' && (
          <CalendarView missions={filteredMissions} users={users} />
        )}
        {currentView === 'timeline' && (
          <TimelineView missions={filteredMissions} users={users} />
        )}
        {currentView === 'volunteer' && (
          <VolunteerView missions={filteredMissions} users={users} />
        )}
        {currentView === 'sector' && (
          <SectorView missions={filteredMissions} users={users} />
        )}
      </div>

      {/* Message si aucune mission */}
      {filteredMissions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📅</div>
          <p className="text-lg font-medium">Aucune mission trouvée</p>
          <p className="text-sm">Modifiez vos filtres pour voir plus de résultats</p>
        </div>
      )}
    </div>
  )
} 