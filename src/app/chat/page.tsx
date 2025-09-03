import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Container from '@/components/Container'
import ChatSystem from '@/components/ChatSystem'

export default async function ChatPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?message=Vous devez être connecté pour accéder au chat.')
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
      <Header user={session.user} title="💬 Chat & Communication" userRole={userProfile.role} />
      <main className="py-8">
        <Container maxWidth="xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              💬 Chat & Communication
            </h1>
            <p className="text-gray-600">
              Communiquez en temps réel avec les autres bénévoles et responsables
            </p>
          </div>

          <ChatSystem user={userProfile} userRole={userProfile.role} />
        </Container>
      </main>
    </div>
  )
}
