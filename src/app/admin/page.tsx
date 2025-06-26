import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Container from '@/components/Container'
import CreateMissionForm from '@/components/admin/CreateMissionForm'
import CreateUserForm from '@/components/admin/CreateUserForm'
import MembershipSettings from '@/components/admin/MembershipSettings'
import VolunteerPreferencesView from '@/components/admin/VolunteerPreferencesView'
import { createMissionActionSafe } from './actions-safe'
import { MissionWithCounts, MissionWithVolunteers, UserProfile, VolunteerCompleteProfile } from '@/lib/types'
import AdminPageClient from './AdminPageClient'

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?message=Vous devez être connecté pour accéder à cette page.')
  }

  const { data: userProfile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (error || userProfile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-2xl font-bold text-red-600">Accès Refusé</h1>
        <p className="mt-2">
          Vous n&apos;avez pas les permissions nécessaires pour voir cette page.
        </p>
        <Link href="/" className="mt-4 text-blue-600 underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    )
  }

  const { data: missionsData, error: missionsError } = await supabase
    .from('missions')
    .select(`
      *, 
      inscriptions(
        user_id,
        users(first_name, last_name, phone)
      )
    `)
    .order('start_time', { ascending: false })

  const { data: usersData, error: usersError } = await supabase
    .from('volunteer_complete_profile')
    .select('*')
    .order('last_name', { ascending: true })

  if (missionsError || usersError) {
    console.error('Error fetching admin data:', missionsError || usersError)
  }

  // Transformer les données pour compter les inscriptions correctement
  const typedMissions = missionsData?.map(mission => ({
    ...mission,
    inscriptions_count: mission.inscriptions ? mission.inscriptions.length : 0
  })) as MissionWithCounts[] | null

  // Missions avec détails des bénévoles pour l'appel à bénévoles
  const missionsWithVolunteers = missionsData?.map(mission => ({
    ...mission,
    inscriptions_count: mission.inscriptions ? mission.inscriptions.length : 0,
    inscriptions: mission.inscriptions || []
  })) as MissionWithVolunteers[] | null

  const typedUsers = usersData as any[] | null

  // Déduplication par id
  const uniqueUsers: VolunteerCompleteProfile[] = typedUsers
    ? Object.values(
        typedUsers.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, VolunteerCompleteProfile>)
      )
    : [];

  // Si l'utilisateur est un admin, afficher le tableau de bord
  return <AdminPageClient missions={typedMissions || []} users={typedUsers || []} missionsWithVolunteers={missionsWithVolunteers || []} uniqueUsers={uniqueUsers || []} session={session} />
} 