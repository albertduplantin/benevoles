import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Container from '@/components/Container'
import CommunicationHub from '@/components/communication/CommunicationHub'

export default async function CommunicationPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?message=Vous devez être connecté pour accéder à cette page.')
  }

  // Récupérer le profil utilisateur avec le rôle
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!userProfile) {
    redirect('/profile?message=Veuillez compléter votre profil.')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="py-8">
        <Container maxWidth="full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Centre de Communication
            </h1>
            <p className="text-gray-600">
              Restez connecté avec l'équipe et ne manquez aucune information importante
            </p>
          </div>
          
          <CommunicationHub user={user} userProfile={userProfile} />
        </Container>
      </main>
    </div>
  )
} 