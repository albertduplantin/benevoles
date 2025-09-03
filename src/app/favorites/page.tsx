import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Container from '@/components/Container'
import UserFavorites from '@/components/UserFavorites'
import WelcomeMessage from '@/components/WelcomeMessage'

export default async function FavoritesPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?message=Vous devez être connecté pour accéder à vos favoris.')
  }

  // Récupérer le profil utilisateur complet
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
      <Header user={session.user} title="⭐ Mes Favoris" userRole={userProfile.role} />
      <main className="py-8">
        <Container maxWidth="xl">
          <div className="mb-6">
            <WelcomeMessage user={userProfile} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ⭐ Mes Missions Favorites
              </h1>
              <p className="text-gray-600">
                Retrouvez ici toutes les missions que vous avez marquées comme favorites.
              </p>
            </div>

            <UserFavorites userId={session.user.id} showAll={true} />
          </div>
        </Container>
      </main>
    </div>
  )
}
