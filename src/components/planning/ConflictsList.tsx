'use client'

import { ConflictDetection } from '@/lib/types'

interface ConflictsListProps {
  conflicts: ConflictDetection[]
}

export default function ConflictsList({ conflicts }: ConflictsListProps) {
  if (conflicts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun conflit détecté</h3>
          <p className="text-gray-600">Toutes les missions sont compatibles avec les horaires des bénévoles.</p>
        </div>
      </div>
    )
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffMins = Math.round(diffMs / (1000 * 60))
    
    if (diffMins < 60) {
      return `${diffMins} min`
    } else {
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      return mins > 0 ? `${hours}h${mins}` : `${hours}h`
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-2xl">⚠️</div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Conflits d'horaires détectés
          </h3>
          <p className="text-gray-600">
            {conflicts.length} bénévole{conflicts.length > 1 ? 's ont' : ' a'} des missions qui se chevauchent
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {conflicts.map((conflict) => (
          <div key={conflict.volunteer_id} className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">
                  {conflict.volunteer_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{conflict.volunteer_name}</h4>
                <p className="text-sm text-red-600">
                  {conflict.conflicts.length} conflit{conflict.conflicts.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {conflict.conflicts.map((conflictDetail, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Mission 1 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">
                          {conflictDetail.mission1.title}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 ml-5">
                        📍 {conflictDetail.mission1.location || 'Lieu non spécifié'}
                      </div>
                      <div className="text-sm text-gray-600 ml-5">
                        🕐 {formatTime(conflictDetail.mission1.start_time)} → {formatTime(conflictDetail.mission1.end_time)}
                      </div>
                    </div>

                    {/* Mission 2 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">
                          {conflictDetail.mission2.title}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 ml-5">
                        📍 {conflictDetail.mission2.location || 'Lieu non spécifié'}
                      </div>
                      <div className="text-sm text-gray-600 ml-5">
                        🕐 {formatTime(conflictDetail.mission2.start_time)} → {formatTime(conflictDetail.mission2.end_time)}
                      </div>
                    </div>
                  </div>

                  {/* Détails du conflit */}
                  <div className="mt-4 pt-4 border-t border-red-200">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-600 font-medium">Chevauchement :</span>
                      <span className="text-gray-700">
                        {formatTime(conflictDetail.overlap_start)} → {formatTime(conflictDetail.overlap_end)}
                      </span>
                      <span className="text-gray-500">
                        ({formatDuration(conflictDetail.overlap_start, conflictDetail.overlap_end)})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions suggérées */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h5 className="text-sm font-medium text-yellow-800 mb-1">Actions suggérées :</h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Réassigner le bénévole à une seule des missions</li>
                <li>• Modifier les horaires d'une des missions</li>
                <li>• Trouver un remplaçant pour une des missions</li>
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Résumé global */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-orange-800 mb-2">
            📋 Résumé des conflits
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-orange-700 font-medium">Bénévoles concernés :</span>
              <span className="text-orange-600 ml-1">{conflicts.length}</span>
            </div>
            <div>
              <span className="text-orange-700 font-medium">Total conflits :</span>
              <span className="text-orange-600 ml-1">
                {conflicts.reduce((sum, c) => sum + c.conflicts.length, 0)}
              </span>
            </div>
            <div>
              <span className="text-orange-700 font-medium">Priorité :</span>
              <span className="text-orange-600 ml-1 font-medium">
                {conflicts.length > 5 ? 'Critique' : 
                 conflicts.length > 2 ? 'Élevée' : 'Modérée'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 