import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Container from '@/components/Container'
import { MissionWithCounts } from '@/lib/types'
import Link from 'next/link'
import HomeHeader from '@/components/HomeHeader'
import Tooltip from '@/components/Tooltip'

// Version déployée avec interface modernisée et nettoyage complet - v2.1.0

export default async function HomePage() {
  const supabase = await createClient()

  // Récupérer les missions avec comptage des inscriptions
  const { data: missions, error } = await supabase
    .from('missions')
    .select('*, inscriptions_count:inscriptions(count)')
    .order('start_time', { ascending: true }) // Tri chronologique

  if (error) {
    console.error('Error fetching missions:', error)
  }

  // On ne peut plus récupérer userInscriptions côté server, donc on ne met pas user_is_registered ici
  const typedMissions = missions?.map(mission => ({
    ...mission,
    inscriptions_count: (mission.inscriptions_count as { count: number }[])?.[0]?.count || 0,
    // user_is_registered sera géré côté client si besoin
  })) as Array<Omit<MissionWithCounts, 'inscriptions_count'> & { inscriptions_count: number }> | null

  return (
    <div className="min-h-screen">
      <HomeHeader />
      
      <main className="py-8">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Missions Disponibles
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Rejoignez notre équipe de bénévoles et contribuez au succès du Festival du Film Court
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {typedMissions && typedMissions.length > 0 ? (
              typedMissions.map((mission) => (
                <Link 
                  href={`/mission/${mission.id}`} 
                  key={mission.id} 
                  className="group block"
                >
                  <div className={`backdrop-blur-sm border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02] h-full overflow-hidden relative bg-white/80 border-gray-200`}>
                    {/* Badge "Inscrit" supprimé côté server */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3 pr-16">
                        <h3 className={`text-xl font-bold transition-colors text-gray-900 group-hover:text-blue-600`}>
                          {mission.title}
                        </h3>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          {mission.is_urgent && (
                            <Tooltip content="Besoin de bénévoles rapidement">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white animate-pulse">
                                Urgent
                              </span>
                            </Tooltip>
                          )}
                          <Tooltip content={mission.inscriptions_count >= mission.max_volunteers ? 'Aucune place restante' : 'Places disponibles'}>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              mission.inscriptions_count >= mission.max_volunteers 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {mission.inscriptions_count >= mission.max_volunteers ? 'Complet' : 'Disponible'}
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
                            Places
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
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">🎬</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune mission disponible</h3>
                <p className="text-gray-600">Les missions seront bientôt publiées. Revenez plus tard !</p>
              </div>
            )}
          </div>
        </Container>
      </main>
    </div>
  )
}
