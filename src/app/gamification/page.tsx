import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Container from '@/components/Container'
import GamificationDashboard from '@/components/GamificationDashboard'

export default async function GamificationPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?message=Vous devez être connecté pour accéder à la gamification.')
  }

  // Récupérer le profil utilisateur
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (error || !userProfile) {
    redirect('/complete-profile')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} title="🏆 Gamification" userRole={userProfile.role} />
      <main className="py-8">
        <Container maxWidth="xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏆 Gamification & Récompenses
            </h1>
            <p className="text-gray-600">
              Gagnez des points, débloquez des badges et relevez des défis pour devenir le meilleur bénévole !
            </p>
          </div>

          <GamificationDashboard userId={session.user.id} />
        </Container>
      </main>
    </div>
  )
}
