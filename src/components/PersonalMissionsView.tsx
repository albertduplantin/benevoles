'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/lib/types'
import MissionDetailsModal from './MissionDetailsModal'

interface PersonalMission {
  id: string
  title: string
  description?: string
  location: string
  start_time: string
  end_time: string
  max_volunteers: number
  manager_id?: string
  inscriptions_count: number
  manager?: {
    first_name?: string
    last_name?: string
    phone?: string
  }
  volunteers: {
    user_id: string
    first_name?: string
    last_name?: string
    phone?: string
  }[]
}

interface PersonalMissionsViewProps {
  missions: PersonalMission[]
  currentUser: User
  userProfile: UserProfile | null
}

export default function PersonalMissionsView({ missions, currentUser, userProfile }: PersonalMissionsViewProps) {
  const [selectedMission, setSelectedMission] = useState<PersonalMission | null>(null)

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

  const getUpcomingMissions = () => {
    return missions.filter(mission => !isPastMission(mission.end_time))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }

  const getPastMissions = () => {
    return missions.filter(mission => isPastMission(mission.end_time))
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
  }

  const upcomingMissions = getUpcomingMissions()
  const pastMissions = getPastMissions()

  if (missions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Aucune mission pour le moment
        </h3>
        <p className="text-gray-500 mb-6">
          Vous n'êtes inscrit(e) à aucune mission actuellement.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          🔍 Découvrir les missions disponibles
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Missions à venir */}
      {upcomingMissions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            🗓️ Missions à venir ({upcomingMissions.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                isPast={false}
                onClick={() => setSelectedMission(mission)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Missions passées */}
      {pastMissions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            ✅ Missions terminées ({pastMissions.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pastMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                isPast={true}
                onClick={() => setSelectedMission(mission)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modale de détails */}
      {selectedMission && (
        <MissionDetailsModal
          mission={selectedMission}
          currentUser={currentUser}
          userProfile={userProfile}
          onClose={() => setSelectedMission(null)}
          isPersonalView={true}
        />
      )}
    </div>
  )
}

interface MissionCardProps {
  mission: PersonalMission
  isPast: boolean
  onClick: () => void
}

function MissionCard({ mission, isPast, onClick }: MissionCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div
      onClick={onClick}
      className={`
        p-6 rounded-lg border cursor-pointer transition-all duration-200
        ${isPast 
          ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' 
          : 'bg-white border-blue-200 hover:border-blue-300 hover:shadow-md'
        }
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className={`font-semibold text-lg ${isPast ? 'text-gray-600' : 'text-gray-900'}`}>
          {mission.title}
        </h3>
        <span className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${isPast 
            ? 'bg-gray-200 text-gray-600' 
            : 'bg-blue-100 text-blue-800'
          }
        `}>
          {isPast ? 'Terminée' : 'À venir'}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center text-gray-600">
          <span className="mr-2">📍</span>
          {mission.location}
        </div>
        
        <div className="flex items-center text-gray-600">
          <span className="mr-2">📅</span>
          {formatDate(mission.start_time)}
        </div>
        
        <div className="flex items-center text-gray-600">
          <span className="mr-2">⏰</span>
          {formatTime(mission.start_time)} - {formatTime(mission.end_time)}
        </div>



        <div className="flex items-center text-gray-600">
          <span className="mr-2">👥</span>
          {mission.inscriptions_count}/{mission.max_volunteers} bénévoles
        </div>

        {mission.manager && (
          <div className="flex items-center text-gray-600">
            <span className="mr-2">👤</span>
            Responsable : {mission.manager.first_name} {mission.manager.last_name}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <span className="text-xs text-gray-500">
          Cliquez pour voir les détails {!isPast && 'et vous désinscrire'}
        </span>
      </div>
    </div>
  )
} 