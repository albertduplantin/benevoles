import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Container from '@/components/Container'
import AdvancedCalendar from '@/components/planning/AdvancedCalendar'
import WelcomeMessage from '@/components/WelcomeMessage'

export default async function CalendarPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?message=Vous devez être connecté pour accéder au calendrier.')
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
      <Header user={session.user} title="📅 Calendrier Avancé" userRole={userProfile.role} />
      <main className="py-8">
        <Container maxWidth="xl">
          <div className="mb-6">
            <WelcomeMessage user={userProfile} />
          </div>

          <AdvancedCalendar
            userId={session.user.id}
            userRole={userProfile.role}
          />
        </Container>
      </main>
    </div>
  )
}
