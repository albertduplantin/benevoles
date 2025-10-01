import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Container from '@/components/Container'
import { MissionWithCounts } from '@/lib/types'
import Link from 'next/link'
import CardMission from '@/components/CardMission'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
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

  // set of mission ids user joined
  let joinedSet = new Set<number>()
  if (user) {
    const { data: myIns } = await supabase
      .from('inscriptions')
      .select('mission_id')
      .eq('user_id', user.id)
    if (myIns) joinedSet = new Set(myIns.map(i => i.mission_id))
  }

  return (
    <div className="min-h-screen">
      <Header user={user} isAdmin={isAdmin} />
      
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
                <CardMission key={mission.id} mission={mission} joined={joinedSet.has(mission.id)} />
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
