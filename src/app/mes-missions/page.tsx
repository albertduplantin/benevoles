import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import Container from '@/components/Container'

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
            <ul className="space-y-4">
              {data.map((i:any) => {
                const m = i.missions
                if (!m) return null
                return (
                  <li key={m.id} className="border p-4 rounded-lg">
                    <a href={`/mission/${m.id}`} className="font-semibold hover:underline">
                      {m.title}
                    </a>
                    {m.is_urgent && <span className="ml-2 px-2 py-0.5 text-xs bg-red-600 text-white rounded">Urgente</span>}
                    <p className="text-sm text-gray-600">
                      {m.is_long_term ? 'Date à définir' : new Date(m.start_time).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-gray-600">{m.location}</p>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p>Aucune mission inscrite.</p>
          )}
        </Container>
      </main>
    </div>
  )
}
