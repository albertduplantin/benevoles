'use client'

import { PlanningStats as StatsType } from '@/lib/types'

interface PlanningStatsProps {
  stats: StatsType
}

export default function PlanningStats({ stats }: PlanningStatsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Statistiques du Planning</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total missions */}
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {stats.total_missions}
          </div>
          <div className="text-sm text-gray-600">
            Mission{stats.total_missions > 1 ? 's' : ''} total{stats.total_missions > 1 ? 'es' : 'e'}
          </div>
        </div>

        {/* Coverage */}
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {stats.coverage_percentage}%
          </div>
          <div className="text-sm text-gray-600">
            Taux de couverture
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.filled_slots}/{stats.total_volunteer_slots} places
          </div>
        </div>

        {/* Conflits */}
        <div className="text-center">
          <div className={`text-3xl font-bold mb-2 ${
            stats.conflicts_count > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {stats.conflicts_count}
          </div>
          <div className="text-sm text-gray-600">
            Conflit{stats.conflicts_count > 1 ? 's' : ''} détecté{stats.conflicts_count > 1 ? 's' : ''}
          </div>
        </div>

        {/* Places disponibles */}
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {stats.total_volunteer_slots - stats.filled_slots}
          </div>
          <div className="text-sm text-gray-600">
            Place{stats.total_volunteer_slots - stats.filled_slots > 1 ? 's' : ''} disponible{stats.total_volunteer_slots - stats.filled_slots > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Répartition par jour */}
      {Object.keys(stats.missions_by_day).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Répartition par jour</h4>
          <div className="space-y-2">
            {Object.entries(stats.missions_by_day)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, count]) => (
                <div key={date} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (count / Math.max(...Object.values(stats.missions_by_day))) * 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Indicateurs de performance */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Indicateurs</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              stats.coverage_percentage >= 80 ? 'bg-green-500' :
              stats.coverage_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-600">
              Couverture {stats.coverage_percentage >= 80 ? 'excellente' :
              stats.coverage_percentage >= 60 ? 'correcte' : 'insuffisante'}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              stats.conflicts_count === 0 ? 'bg-green-500' :
              stats.conflicts_count <= 2 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-600">
              Conflits {stats.conflicts_count === 0 ? 'inexistants' :
              stats.conflicts_count <= 2 ? 'mineurs' : 'à résoudre'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 