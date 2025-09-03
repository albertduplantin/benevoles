import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Container from '@/components/Container'
import { MissionWithCounts } from '@/lib/types'
import Link from 'next/link'
import HomeHeader from '@/components/HomeHeader'
import Tooltip from '@/components/Tooltip'
import MissionsList from '@/components/MissionsList'

// Version déployée avec interface modernisée et nettoyage complet - v2.1.0

export default async function HomePage() {
  const supabase = await createClient()

  // Récupérer l'utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser()

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
              🎯 Missions Disponibles
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              🤝 Rejoignez notre équipe de bénévoles et contribuez au succès du Festival du Film Court
            </p>
          </div>

          <MissionsList 
            initialMissions={typedMissions} 
            userId={user?.id}
          />
        </Container>
      </main>
    </div>
  )
}
