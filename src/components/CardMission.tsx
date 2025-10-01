import Link from 'next/link'
import type { MissionWithCounts } from '@/lib/types'

interface CardMissionProps {
  mission: MissionWithCounts
  joined?: boolean
}

export default function CardMission({ mission, joined = false }: CardMissionProps) {
  return (
    <Link href={`/mission/${mission.id}`} className="group block">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02] h-full overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {mission.title}
            </h3>
            {joined && <span className="px-2 py-0.5 text-xs bg-emerald-600 text-white rounded">Inscrit·e</span>}
            {mission.is_urgent && <span className="px-2 py-0.5 text-xs bg-red-600 text-white rounded ml-1">Urgente</span>}
          </div>
          {mission.description && (
            <p className="text-gray-600 mb-4 line-clamp-2">{mission.description}</p>
          )}
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center">
              <span className="w-4 h-4 mr-2">📍</span>
              <span>{mission.location}</span>
            </div>
            {mission.is_long_term ? (
              <div className="flex items-center">
                <span className="w-4 h-4 mr-2">⏰</span>
                <span>Date à définir</span>
              </div>
            ): (
              <>
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-2">📅</span>
                  <span>{new Date(mission.start_time).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-2">⏰</span>
                  <span>{new Date(mission.start_time).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} - {new Date(mission.end_time).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
              </>
            )}
          </div>
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Places</span>
              <span className="text-sm text-gray-600">
                {mission.inscriptions_count}/{mission.max_volunteers}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((mission.inscriptions_count / mission.max_volunteers) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
