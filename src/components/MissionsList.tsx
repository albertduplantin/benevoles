'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MissionWithCounts } from '@/lib/types'
import Tooltip from '@/components/Tooltip'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { CardSpinner } from '@/components/ui/Spinner'
import SearchAndFilters from '@/components/SearchAndFilters'
import AdminExportData from '@/components/AdminExportData'

interface MissionsListProps {
  initialMissions: Array<Omit<MissionWithCounts, 'inscriptions_count'> & { inscriptions_count: number }> | null
  userId?: string
  userRole?: string
}

export default function MissionsList({ initialMissions, userId, userRole }: MissionsListProps) {
  const [missions, setMissions] = useState(initialMissions)
  const [filteredMissions, setFilteredMissions] = useState(initialMissions)
  const [isLoading, setIsLoading] = useState(false)
  const [userInscriptions, setUserInscriptions] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (userId) {
      fetchUserInscriptions()
    }
  }, [userId])

  const fetchUserInscriptions = async () => {
    if (!userId) return
    
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('inscriptions')
        .select('mission_id')
        .eq('user_id', userId)
      
      if (data) {
        setUserInscriptions(new Set(data.map(i => i.mission_id)))
      }
    } catch (error) {
      console.error('Error fetching user inscriptions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshMissions = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: missions, error } = await supabase
        .from('missions')
        .select('*, inscriptions_count:inscriptions(count)')
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error fetching missions:', error)
        return
      }

      const typedMissions = missions?.map(mission => ({
        ...mission,
        inscriptions_count: (mission.inscriptions_count as { count: number }[])?.[0]?.count || 0,
      })) as Array<Omit<MissionWithCounts, 'inscriptions_count'> & { inscriptions_count: number }> | null

      setMissions(typedMissions)
    } catch (error) {
      console.error('Error refreshing missions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !missions) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (!missions || missions.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <div className="text-6xl mb-4">🎬</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune mission disponible</h3>
        <p className="text-gray-600">Les missions seront bientôt publiées. Revenez plus tard !</p>
      </div>
    )
  }

  return (
    <>
      {/* Composant d'export de données (pour admins et responsables) */}
      {(userRole === 'admin' || userRole === 'responsable') && (
        <AdminExportData 
          missions={missions}
          userRole={userRole}
        />
      )}

      {/* Composant de recherche et filtres */}
      <SearchAndFilters 
        missions={missions}
        onFilteredMissions={setFilteredMissions}
      />

      {/* Affichage des missions filtrées */}
      {!filteredMissions || filteredMissions.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune mission trouvée</h3>
          <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMissions.map((mission) => (
        <Link 
          href={`/mission/${mission.id}`} 
          key={mission.id} 
          className="group block"
        >
          <div className={`backdrop-blur-sm border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02] h-full overflow-hidden relative bg-white/80 border-gray-200`}>
            {/* Badge "Inscrit" si l'utilisateur est inscrit */}
            {userId && userInscriptions.has(mission.id) && (
              <div className="absolute top-4 right-4 z-10">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                  ✅ Inscrit
                </span>
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-3 pr-16">
                <h3 className={`text-xl font-bold transition-colors text-gray-900 group-hover:text-blue-600`}>
                  {mission.title}
                </h3>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  {mission.is_urgent && (
                    <Tooltip content="Besoin de bénévoles rapidement">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white animate-pulse">
                        🚨 Urgent
                      </span>
                    </Tooltip>
                  )}
                  <Tooltip content={mission.inscriptions_count >= mission.max_volunteers ? 'Aucune place restante' : 'Places disponibles'}>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      mission.inscriptions_count >= mission.max_volunteers 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {mission.inscriptions_count >= mission.max_volunteers ? '❌ Complet' : '✅ Disponible'}
                    </span>
                  </Tooltip>
                </div>
              </div>
              {mission.description && (
                <p className={`mb-4 line-clamp-2 text-gray-600`}>
                  {mission.description}
                </p>
              )}
              <div className={`space-y-2 text-sm mb-4 text-gray-600`}>
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-2">📍</span>
                  <span>{mission.location}</span>
                </div>
                {mission.start_time === mission.end_time ? (
                  <div className="flex items-center text-blue-700 font-medium">
                    <span className="w-4 h-4 mr-2">🔄</span>
                    <span>Mission au long cours</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center">
                      <span className="w-4 h-4 mr-2">📅</span>
                      <span>{new Date(mission.start_time).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4 h-4 mr-2">⏰</span>
                      <span>
                        {new Date(mission.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(mission.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium text-gray-700`}>
                    👥 Places
                  </span>
                  <span className={`text-sm text-gray-600`}>
                    {mission.inscriptions_count}/{mission.max_volunteers}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600`}
                    style={{ width: `${Math.min((mission.inscriptions_count / mission.max_volunteers) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
        </div>
      )}
    </>
  )
}
