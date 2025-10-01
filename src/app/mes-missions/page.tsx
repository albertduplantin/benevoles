import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import Container from '@/components/Container'
import CardMission from '@/components/CardMission'

export const dynamic = 'force-dynamic'

export default async function MyMissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data } = user ? await supabase
    .from('inscriptions')
    .select('missions (*)')
    .eq('user_id', user.id) : { data: null }

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <main className="py-8">
        <Container>
          <h1 className="text-2xl font-bold mb-6">Mes missions</h1>
          {data && data.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.map((i:any) => i.missions && (
                <CardMission key={i.missions.id} mission={i.missions} joined />
              ))}
            </div>
          ) : (
            <p>Aucune mission inscrite.</p>
          )}
        </Container>
      </main>
    </div>
  )
}
