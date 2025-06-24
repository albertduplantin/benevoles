'use client'

import { useMemo } from 'react'
import { PlanningMission, UserProfile } from '@/lib/types'

interface SectorViewProps {
  missions: PlanningMission[]
  users: UserProfile[]
}

export default function SectorView({ missions }: SectorViewProps) {
  
  // Catégoriser les missions par secteur (basé sur les mots-clés du titre ou lieu)
  const missionsBySector = useMemo(() => {
    const sectors: Record<string, PlanningMission[]> = {}
    
    missions.forEach(mission => {
      let sector = 'Autre'
      const title = mission.title.toLowerCase()
      const location = mission.location?.toLowerCase() || ''
      
      // Logique de catégorisation basée sur les mots-clés
      if (title.includes('accueil') || title.includes('réception') || title.includes('billetterie')) {
        sector = 'Accueil & Billetterie'
      } else if (title.includes('projection') || title.includes('salle') || location.includes('salle')) {
        sector = 'Projections'
      } else if (title.includes('technique') || title.includes('son') || title.includes('éclairage') || title.includes('régie')) {
        sector = 'Technique'
      } else if (title.includes('restauration') || title.includes('bar') || title.includes('buffet') || title.includes('catering')) {
        sector = 'Restauration'
      } else if (title.includes('communication') || title.includes('presse') || title.includes('médias') || title.includes('réseau')) {
        sector = 'Communication'
      } else if (title.includes('transport') || title.includes('logistique') || title.includes('installation')) {
        sector = 'Logistique'
      } else if (title.includes('animation') || title.includes('activité') || title.includes('atelier')) {
        sector = 'Animation'
      } else if (title.includes('sécurité') || title.includes('contrôle')) {
        sector = 'Sécurité'
      } else if (title.includes('nettoyage') || title.includes('entretien') || title.includes('ménage')) {
        sector = 'Entretien'
      }
      
      if (!sectors[sector]) {
        sectors[sector] = []
      }
      sectors[sector].push(mission)
    })
    
    // Trier les missions de chaque secteur par date
    Object.values(sectors).forEach(sectorMissions => {
      sectorMissions.sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
    })
    
    return sectors
  }, [missions])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSectorColor = (sector: string) => {
    const colors = {
      'Accueil & Billetterie': 'border-l-blue-500 bg-blue-50',
      'Projections': 'border-l-purple-500 bg-purple-50',
      'Technique': 'border-l-green-500 bg-green-50',
      'Restauration': 'border-l-orange-500 bg-orange-50',
      'Communication': 'border-l-pink-500 bg-pink-50',
      'Logistique': 'border-l-yellow-500 bg-yellow-50',
      'Animation': 'border-l-indigo-500 bg-indigo-50',
      'Sécurité': 'border-l-red-500 bg-red-50',
      'Entretien': 'border-l-gray-500 bg-gray-50',
      'Autre': 'border-l-gray-400 bg-gray-50'
    }
    return colors[sector as keyof typeof colors] || colors['Autre']
  }

  const getSectorIcon = (sector: string) => {
    const icons = {
      'Accueil & Billetterie': '🎫',
      'Projections': '🎬',
      'Technique': '🔧',
      'Restauration': '🍽️',
      'Communication': '📢',
      'Logistique': '📦',
      'Animation': '🎭',
      'Sécurité': '🛡️',
      'Entretien': '🧹',
      'Autre': '📝'
    }
    return icons[sector as keyof typeof icons] || icons['Autre']
  }

  const calculateSectorStats = (sectorMissions: PlanningMission[]) => {
    const totalSlots = sectorMissions.reduce((sum, m) => sum + m.max_volunteers, 0)
    const filledSlots = sectorMissions.reduce((sum, m) => sum + m.inscriptions_count, 0)
    const totalHours = sectorMissions.reduce((sum, mission) => {
      const start = new Date(mission.start_time)
      const end = new Date(mission.end_time)
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    }, 0)
    
    return {
      missions: sectorMissions.length,
      totalSlots,
      filledSlots,
      coverage: totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0,
      totalHours: Math.round(totalHours)
    }
  }

  const sectorList = Object.entries(missionsBySector)
    .sort(([, a], [, b]) => b.length - a.length)

  if (sectorList.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🏷️</div>
          <p className="text-lg font-medium">Aucune mission trouvée</p>
          <p className="text-sm">Créez des missions pour voir la répartition par secteur</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Vue par Secteur</h2>
        <div className="text-sm text-gray-600">
          {sectorList.length} secteur{sectorList.length > 1 ? 's' : ''} identifié{sectorList.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{sectorList.length}</div>
          <div className="text-sm text-blue-700">Secteurs actifs</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{missions.length}</div>
          <div className="text-sm text-green-700">Total missions</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {missions.reduce((sum, m) => sum + m.max_volunteers, 0)}
          </div>
          <div className="text-sm text-orange-700">Places totales</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(
              (missions.reduce((sum, m) => sum + m.inscriptions_count, 0) /
               missions.reduce((sum, m) => sum + m.max_volunteers, 0)) * 100
            ) || 0}%
          </div>
          <div className="text-sm text-purple-700">Couverture globale</div>
        </div>
      </div>

      {/* Liste des secteurs */}
      <div className="space-y-6">
        {sectorList.map(([sector, sectorMissions]) => {
          const stats = calculateSectorStats(sectorMissions)
          
          return (
            <div key={sector} className={`border-l-4 rounded-lg ${getSectorColor(sector)} overflow-hidden`}>
              {/* En-tête du secteur */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{getSectorIcon(sector)}</div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{sector}</h3>
                      <p className="text-gray-600">
                        {stats.missions} mission{stats.missions > 1 ? 's' : ''} • {stats.totalHours}h total
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.coverage}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {stats.filledSlots}/{stats.totalSlots} places
                    </div>
                  </div>
                </div>
                
                {/* Barre de progression */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        stats.coverage >= 80 ? 'bg-green-500' :
                        stats.coverage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${stats.coverage}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Missions du secteur */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {sectorMissions.map((mission) => (
                    <div key={mission.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{mission.title}</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>🕐 {formatTime(mission.start_time)}</div>
                            {mission.location && (
                              <div>📍 {mission.location}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            mission.inscriptions_count >= mission.max_volunteers
                              ? 'text-green-600'
                              : mission.inscriptions_count >= mission.max_volunteers * 0.7
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {mission.inscriptions_count}/{mission.max_volunteers}
                          </div>
                        </div>
                      </div>
                      
                      {/* Bénévoles assignés */}
                      {mission.volunteers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {mission.volunteers.slice(0, 3).map((volunteer) => (
                            <span
                              key={volunteer.user_id}
                              className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {volunteer.first_name} {volunteer.last_name}
                            </span>
                          ))}
                          {mission.volunteers.length > 3 && (
                            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              +{mission.volunteers.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Analyse comparative */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Analyse comparative par secteur</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secteur</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Missions</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Places</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Couverture</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Heures</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sectorList.map(([sector, sectorMissions]) => {
                const stats = calculateSectorStats(sectorMissions)
                return (
                  <tr key={sector} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getSectorIcon(sector)}</span>
                        <span className="font-medium text-gray-900">{sector}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900">{stats.missions}</td>
                    <td className="px-4 py-3 text-center text-gray-900">
                      {stats.filledSlots}/{stats.totalSlots}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        stats.coverage >= 80 ? 'bg-green-100 text-green-800' :
                        stats.coverage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {stats.coverage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900">{stats.totalHours}h</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 