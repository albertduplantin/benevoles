import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Container from '@/components/Container'
import { MissionWithCounts } from '@/lib/types'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rediriger les admins vers leur tableau de bord
  if (user) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (userProfile?.role === 'admin') {
      redirect('/admin')
    }
  }

  const { data: missions, error } = await supabase
    .from('missions')
    .select('*, inscriptions_count:inscriptions(count)')
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching missions:', error)
  }
  
  // Transformer les données pour extraire le count correctement
  const typedMissions = missions?.map(mission => ({
    ...mission,
    inscriptions_count: (mission.inscriptions_count as { count: number }[])?.[0]?.count || 0
  })) as MissionWithCounts[] | null

  return (
    <div className="min-h-screen">
      <Header user={user} />
      
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
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02] h-full overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {mission.title}
                        </h3>
                        <div className="flex-shrink-0 ml-2">
                          {/* Normalise inscriptions_count qui peut être un nombre ou un tableau [{ count }] */}
                          {(() => {
                            const count = Array.isArray(mission.inscriptions_count)
                              ? (mission.inscriptions_count[0]?.count ?? 0)
                              : mission.inscriptions_count
                            const isFull = count >= mission.max_volunteers
                            return (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isFull ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {isFull ? 'Complet' : 'Disponible'}
                              </span>
                            )
                          })()}
                        </div>
                      </div>
                      
                      {mission.description && (
                        <p className="text-gray-600 mb-4 line-clamp-2">{mission.description}</p>
                      )}
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <span className="w-4 h-4 mr-2">📍</span>
                          <span>{mission.location}</span>
                        </div>
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
                      </div>
                      
                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Places</span>
                          {(() => {
                            const count = Array.isArray(mission.inscriptions_count)
                              ? (mission.inscriptions_count[0]?.count ?? 0)
                              : mission.inscriptions_count
                            return (
                              <span className="text-sm text-gray-600">
                                {count}/{mission.max_volunteers}
                              </span>
                            )
                          })()}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: (() => {
                              const count = Array.isArray(mission.inscriptions_count)
                                ? (mission.inscriptions_count[0]?.count ?? 0)
                                : mission.inscriptions_count
                              return `${Math.min((count / mission.max_volunteers) * 100, 100)}%`
                            })() }}
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
