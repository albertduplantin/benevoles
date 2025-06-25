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
import { MissionWithCounts, MissionWithVolunteers, UserProfile } from '@/lib/types'
import MissionRow from './MissionRow'
import UserRow from './UserRow'
import CallToVolunteers from '@/components/admin/CallToVolunteers'

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
    .from('users')
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

  const typedUsers = usersData as UserProfile[] | null

  // Si l'utilisateur est un admin, afficher le tableau de bord
  return (
    <div className="min-h-screen">
      <Header user={session.user} title="Tableau de bord Administrateur" showBackToSite={true} />
      
      <main className="py-8">
        <Container maxWidth="xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Actions Rapides</h2>
          <p className="text-gray-600 mb-6">Générez facilement des appels à bénévoles pour les missions à pourvoir</p>
          <div className="flex gap-4 mb-4">
            <CallToVolunteers missions={missionsWithVolunteers} users={typedUsers} />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Missions</h2>
          <p className="text-gray-600 mb-6">Créez, modifiez et suivez toutes vos missions</p>
        </div>
        
        <CreateMissionForm onMissionCreated={createMissionActionSafe} users={typedUsers} />

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Toutes les missions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left">Titre</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Créneau</th>
                  <th className="px-4 py-2 text-center">Inscrits</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {typedMissions && typedMissions.length > 0 ? (
                  typedMissions.map((mission) => (
                    <MissionRow key={mission.id} mission={mission} users={typedUsers} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      Aucune mission créée pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>



        <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Paramètres de Cotisation</h2>
            <p className="text-gray-600 mb-6">Configurez le montant de la cotisation annuelle</p>
            <MembershipSettings />
        </div>

        <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Préférences des Bénévoles</h2>
            <p className="text-gray-600 mb-6">Consultez les disponibilités et compétences de vos bénévoles</p>
            <VolunteerPreferencesView />
        </div>

        <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Utilisateurs</h2>
            <p className="text-gray-600 mb-6">Créez et gérez les comptes des bénévoles et responsables</p>
            <CreateUserForm />
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="px-4 py-2 text-left">Nom</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Téléphone</th>
                            <th className="px-4 py-2 text-center">Rôle</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {typedUsers && typedUsers.length > 0 ? (
                            typedUsers.map(user => (
                                <UserRow key={user.id} user={user} />
                            ))
                        ) : (
                             <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-500">
                                    Aucun utilisateur trouvé.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
        </Container>
      </main>
    </div>
  )
} 