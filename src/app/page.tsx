import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import AuthButton from '@/components/AuthButton'
import { MissionWithCounts } from '@/lib/types'
import Link from 'next/link'

export default async function HomePage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: missions, error } = await supabase
    .from('missions')
    .select('*, inscriptions_count:inscriptions(count)')
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching missions:', error)
  }
  
  const typedMissions = missions as MissionWithCounts[] | null

  return (
    <div className="w-full max-w-4xl mx-auto my-8">
      <nav className="flex justify-between w-full p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold">
          Portail Bénévoles - Festival du Film Court
        </h1>
        <AuthButton user={user} />
      </nav>
      <main className="p-4">
        <h2 className="mb-6 text-2xl font-bold text-center">
          Les missions disponibles
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {typedMissions && typedMissions.length > 0 ? (
            typedMissions.map((mission) => (
              <Link href={`/mission/${mission.id}`} key={mission.id} className="block hover:bg-gray-50">
                <div
                  className="p-6 bg-white border border-gray-200 rounded-lg shadow-md h-full"
                >
                  <h3 className="mb-2 text-xl font-bold">{mission.title}</h3>
                  <p className="mb-4 text-gray-700">{mission.description}</p>
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Lieu :</strong> {mission.location}
                    </p>
                    <p>
                      <strong>Date :</strong>{' '}
                      {new Date(mission.start_time).toLocaleDateString('fr-FR')}
                    </p>
                    <p>
                      <strong>Créneau :</strong>{' '}
                      {new Date(mission.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(mission.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${(mission.inscriptions_count / mission.max_volunteers) * 100}%` }}
                        ></div>
                      </div>
                      <p className="mt-1 text-xs text-right">
                        {mission.inscriptions_count}/{mission.max_volunteers} bénévoles
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              Aucune mission disponible pour le moment.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
