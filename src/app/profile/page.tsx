import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Container from '@/components/Container'
import ProfileForm from '@/components/ProfileForm'
import MissionHistory from '@/components/MissionHistory'
import MembershipButton from '@/components/MembershipButton'

import VolunteerPreferences from '@/components/VolunteerPreferences'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?message=Vous devez être connecté pour accéder à votre profil.')
  }

  // Récupérer le profil utilisateur
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Récupérer l'historique des missions
  const { data: rawMissionsHistory } = await supabase
    .from('inscriptions')
    .select(`
      created_at,
      missions (
        id,
        title,
        description,
        location,
        start_time,
        end_time
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Transformer les données pour correspondre au type attendu
  const missionsHistory = rawMissionsHistory?.map(inscription => ({
    created_at: inscription.created_at,
    missions: Array.isArray(inscription.missions) ? inscription.missions[0] || null : inscription.missions
  })) || null

  return (
    <div className="min-h-screen">
      <Header user={user} title="Mon Profil" />
      
      <main className="py-8">
        <Container maxWidth="lg">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne principale - Profil */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h2>
                <p className="text-gray-600 mb-6">Gérez vos informations personnelles et vos préférences</p>
                <ProfileForm userProfile={userProfile} />
              </div>
              
              {/* Disponibilités et compétences - seulement pour les bénévoles */}
              {userProfile?.role === 'benevole' && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Mes Disponibilités & Compétences</h2>
                  <p className="text-gray-600 mb-6">Aidez-nous à vous proposer des missions adaptées à vos disponibilités et compétences</p>
                  <VolunteerPreferences userId={user.id} />
                </div>
              )}
            </div>

            {/* Sidebar - Cotisation et Historique */}
            <div className="lg:col-span-1 space-y-6">
              {/* Bouton de cotisation */}
              <MembershipButton userProfile={userProfile} />
              
              {/* Historique */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Mon Historique</h3>
                <MissionHistory missions={missionsHistory} />
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  )
} 