import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Container from '@/components/Container'
import ResponsableDashboardClient from './ResponsableDashboardClient'
import { MissionWithCounts, UserProfile } from '@/lib/types'

export default async function ResponsablePage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?message=Vous devez être connecté pour accéder à cette page.')
  }

  // Vérifier que l'utilisateur est responsable ou admin
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (error || (userProfile?.role !== 'responsable' && userProfile?.role !== 'admin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-2xl font-bold text-red-600">Accès Refusé</h1>
        <p className="mt-2">
          Vous n'avez pas les permissions nécessaires pour voir cette page.
        </p>
        <a href="/" className="mt-4 text-blue-600 underline">
          Retour à l'accueil
        </a>
      </div>
    )
  }

  // Récupérer les missions assignées au responsable
  const { data: missionsData, error: missionsError } = await supabase
    .from('missions')
    .select(`
      *, 
      inscriptions(
        user_id,
        users(first_name, last_name, phone, email)
      )
    `)
    .eq('manager_id', session.user.id)
    .order('start_time', { ascending: false })

  // Récupérer toutes les missions pour les statistiques générales
  const { data: allMissionsData } = await supabase
    .from('missions')
    .select(`
      *,
      inscriptions(user_id)
    `)
    .order('start_time', { ascending: false })

  // Récupérer les bénévoles inscrits aux missions du responsable
  const { data: volunteersData } = await supabase
    .from('volunteer_complete_profile')
    .select('*')
    .order('last_name', { ascending: true })

  // Calculer les statistiques
  const assignedMissions = missionsData || []
  const totalMissions = allMissionsData || []
  
  const stats = {
    assignedMissions: assignedMissions.length,
    totalVolunteers: assignedMissions.reduce((acc, mission) => acc + (mission.inscriptions?.length || 0), 0),
    upcomingMissions: assignedMissions.filter(mission => new Date(mission.start_time) > new Date()).length,
    completedMissions: assignedMissions.filter(mission => new Date(mission.end_time) < new Date()).length,
    urgentMissions: assignedMissions.filter(mission => mission.is_urgent).length,
    totalMissions: totalMissions.length,
    totalVolunteersAll: totalMissions.reduce((acc, mission) => acc + (mission.inscriptions?.length || 0), 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} title="Tableau de Bord Responsable" userRole={userProfile?.role} />
      <main className="py-8">
        <Container maxWidth="xl">
          <ResponsableDashboardClient 
            assignedMissions={assignedMissions}
            allMissions={totalMissions}
            volunteers={volunteersData}
            stats={stats}
            userRole={userProfile?.role}
            userId={session.user.id}
          />
        </Container>
      </main>
    </div>
  )
}
