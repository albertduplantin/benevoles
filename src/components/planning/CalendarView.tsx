'use client'

import { useState, useMemo } from 'react'
import { PlanningMission, UserProfile } from '@/lib/types'
import MissionEditModal from '@/components/admin/MissionEditModal'

interface CalendarViewProps {
  missions: PlanningMission[]
  users: UserProfile[]
  isAdmin: boolean
  onMissionUpdated?: () => void
}

export default function CalendarView({ missions, users, isAdmin, onMissionUpdated }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
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
    
    return groups
  }, [missions])

  // Calculer le calendrier du mois
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    const endDate = new Date(lastDay)
    
    // Commencer au lundi de la semaine contenant le 1er
    startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7))
    
    // Finir au dimanche de la semaine contenant la fin du mois
    endDate.setDate(endDate.getDate() + (7 - endDate.getDay()) % 7)
    
    const days = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }, [currentDate])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMissionColor = (mission: PlanningMission) => {
    const coverage = mission.inscriptions_count / mission.max_volunteers
    if (coverage >= 1) return 'bg-green-100 border-green-300 text-green-800'
    if (coverage >= 0.7) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    return 'bg-red-100 border-red-300 text-red-800'
  }

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  return (
    <div className="p-6">
      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentDate.toLocaleDateString('fr-FR', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Aujourd'hui
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-gray-600">Complet</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
          <span className="text-gray-600">Partiellement couvert</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
          <span className="text-gray-600">Places disponibles</span>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const dateString = date.toISOString().split('T')[0]
          const dayMissions = missionsByDate[dateString] || []
          const isCurrentMonthDay = isCurrentMonth(date)
          const isTodayDay = isToday(date)

          return (
            <div
              key={index}
              className={`min-h-[120px] p-2 border border-gray-200 bg-white ${
                !isCurrentMonthDay ? 'bg-gray-50 text-gray-400' : ''
              } ${
                isTodayDay ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className={`text-sm font-medium mb-2 ${
                isTodayDay ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {date.getDate()}
              </div>
              
              <div className="space-y-1">
                {dayMissions.slice(0, 3).map((mission) => (
                  <div
                    key={mission.id}
                    className={`text-xs p-1 rounded border ${getMissionColor(mission)} ${isAdmin ? 'cursor-pointer hover:opacity-80 transition-opacity relative group' : ''}`}
                    title={`${mission.title} - ${formatTime(mission.start_time)} à ${formatTime(mission.end_time)} - ${mission.inscriptions_count}/${mission.max_volunteers} bénévoles`}
                    onClick={isAdmin ? () => setSelectedMission(mission) : undefined}
                  >
                    <div className="font-medium truncate">{mission.title}</div>
                    <div className="text-xs opacity-75">
                      {formatTime(mission.start_time)} - {mission.inscriptions_count}/{mission.max_volunteers}
                    </div>
                    {isAdmin && (
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-blue-600">✏️</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {dayMissions.length > 3 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{dayMissions.length - 3} autre{dayMissions.length - 3 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Résumé du mois */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(missionsByDate).length}
            </div>
            <div className="text-gray-600">Jours avec missions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {missions.length}
            </div>
            <div className="text-gray-600">Total missions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {missions.reduce((sum, m) => sum + m.max_volunteers, 0)}
            </div>
            <div className="text-gray-600">Places totales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {missions.reduce((sum, m) => sum + m.inscriptions_count, 0)}
            </div>
            <div className="text-gray-600">Places occupées</div>
          </div>
        </div>
      </div>

      {/* Modale d'édition */}
      {selectedMission && (
        <MissionEditModal
          mission={selectedMission}
          users={users}
          onClose={() => setSelectedMission(null)}
          onMissionUpdated={() => {
            // Rafraîchir les données sans recharger la page
            onMissionUpdated?.()
          }}
        />
      )}
    </div>
  )
} 