import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Container from '@/components/Container'
import PlanningView from '@/components/planning/PlanningView'
import { PlanningMission, UserProfile } from '@/lib/types'

export default async function PlanningPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?message=Vous devez être connecté pour accéder au planning.')
  }

  const { data: userProfile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (error || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-2xl font-bold text-red-600">Erreur</h1>
        <p className="mt-2">
          Impossible de charger votre profil utilisateur.
        </p>
      </div>
    )
  }

  // Récupérer les missions avec tous les détails nécessaires
  const { data: missionsData, error: missionsError } = await supabase
    .from('missions')
    .select(`
      *,
      inscriptions_count:inscriptions(count),
      volunteers:inscriptions(
        user_id,
        users(first_name, last_name, phone)
      ),
      manager:users!missions_manager_id_fkey(first_name, last_name)
    `)
    .order('start_time', { ascending: true })

  // Récupérer tous les utilisateurs pour les filtres
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, first_name, last_name, role')
    .order('last_name', { ascending: true })

  if (missionsError || usersError) {
    console.error('Error fetching planning data:', missionsError || usersError)
  }

  // Transformer les données pour le format PlanningMission et exclure les missions sans date (start_time == end_time)
  const planningMissions: PlanningMission[] = (missionsData || [])
    .filter(m => m.start_time !== m.end_time)
    .map(mission => ({
      ...mission,
      inscriptions_count: (mission.inscriptions_count as { count: number }[])?.[0]?.count || 0,
      volunteers: mission.volunteers?.map((inscription: { user_id: string; users?: { first_name?: string; last_name?: string; phone?: string } }) => ({
        user_id: inscription.user_id,
        first_name: inscription.users?.first_name,
        last_name: inscription.users?.last_name,
        phone: inscription.users?.phone,
      })) || []
    }))

  const users = usersData as UserProfile[] || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} title="Planning Global" />
      
      <main className="py-6">
        <Container maxWidth="full">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Planning Global</h1>
                <p className="text-gray-600 mt-1">
                  Vue d&apos;ensemble des missions et bénévoles
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {planningMissions.length} mission{planningMissions.length > 1 ? 's' : ''} au total
              </div>
            </div>
          </div>

          <PlanningView 
            missions={planningMissions} 
            users={users}
            currentUser={session.user}
            isAdmin={userProfile.role === 'admin'}
          />
        </Container>
      </main>
    </div>
  )
} 