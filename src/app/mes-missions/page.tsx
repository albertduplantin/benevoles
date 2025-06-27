import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Container from '@/components/Container'
import PersonalMissionsView from '@/components/PersonalMissionsView'

export default async function PersonalMissionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?message=Vous devez être connecté pour voir vos missions.')
  }

  // Récupérer le profil utilisateur
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Récupérer les missions auxquelles l'utilisateur est inscrit
  const { data: userMissions, error: missionsError } = await supabase
    .from('inscriptions')
    .select(`
      created_at,
      missions (
        id,
        title,
        description,
        location,
        start_time,
        end_time,
        max_volunteers,
        manager_id,
        inscriptions_count:inscriptions(count),
        manager:users!missions_manager_id_fkey(first_name, last_name, phone),
        volunteers:inscriptions(
          user_id,
          users(first_name, last_name, phone)
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (missionsError) {
    console.error('Error fetching user missions:', missionsError)
  }

  // Transformer les données
  const missions = userMissions?.map(inscription => {
    const mission = Array.isArray(inscription.missions) ? inscription.missions[0] : inscription.missions
    if (!mission) return null
    
    return {
      ...mission,
      inscriptions_count: (mission.inscriptions_count as { count: number }[])?.[0]?.count || 0,
      manager: Array.isArray(mission.manager) ? mission.manager[0] : mission.manager,
      volunteers: mission.volunteers?.map((vol: any) => ({
        user_id: vol.user_id,
        first_name: vol.users?.first_name,
        last_name: vol.users?.last_name,
        phone: vol.users?.phone,
      })) || []
    }
  }).filter((mission): mission is NonNullable<typeof mission> => mission !== null) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} title="Mes Missions" />
      
      <main className="py-6">
        <Container maxWidth="2xl">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mes Missions</h1>
                <p className="text-gray-600 mt-1">
                  Voici toutes les missions auxquelles vous êtes inscrit(e)
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {missions.length} mission{missions.length > 1 ? 's' : ''} 
              </div>
            </div>
          </div>

          <PersonalMissionsView 
            missions={missions} 
            currentUser={user}
            userProfile={userProfile}
          />
        </Container>
      </main>
    </div>
  )
} 