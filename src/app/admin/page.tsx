import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AuthButton from '@/components/AuthButton'
import CreateMissionForm from '@/components/admin/CreateMissionForm'
import { createMissionAction } from './actions'
import { MissionWithCounts, UserProfile } from '@/lib/types'
import MissionRow from './MissionRow'
import UserRow from './UserRow'
import CallToVolunteers from '@/components/admin/CallToVolunteers'

export default async function AdminPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

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
          Vous n'avez pas les permissions nécessaires pour voir cette page.
        </p>
        <Link href="/" className="mt-4 text-blue-600 underline">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  const { data: missionsData, error: missionsError } = await supabase
    .from('missions')
    .select('*, inscriptions_count:inscriptions(count)')
    .order('start_time', { ascending: false })

  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('*')
    .order('last_name', { ascending: true })

  if (missionsError || usersError) {
    console.error('Error fetching admin data:', missionsError || usersError)
  }

  const typedMissions = missionsData as MissionWithCounts[] | null
  const typedUsers = usersData as UserProfile[] | null

  // Si l'utilisateur est un admin, afficher le tableau de bord
  return (
    <div className="w-full max-w-6xl mx-auto my-8">
      <nav className="flex justify-between w-full p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold">Tableau de bord Administrateur</h1>
        <div className="flex items-center gap-4">
            <Link href="/" className="text-sm hover:underline">Retour au site</Link>
            <AuthButton user={session.user} />
        </div>
      </nav>
      <main className="p-4">
        <h2 className="mb-6 text-2xl font-bold">Actions Rapides</h2>
        <CallToVolunteers missions={typedMissions} />

        <h2 className="mb-6 text-2xl font-bold">Gestion des Missions</h2>
        
        <CreateMissionForm onMissionCreated={createMissionAction} />

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
                    <MissionRow key={mission.id} mission={mission} />
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

        <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold">Gestion des Utilisateurs</h2>
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
      </main>
    </div>
  )
} 