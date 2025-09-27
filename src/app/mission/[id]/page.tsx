import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { UserProfile, Inscription } from '@/lib/types'
import AuthButton from '@/components/AuthButton'
import Link from 'next/link'
import JoinMissionButton from '@/components/JoinMissionButton'
import { joinMission, leaveMission } from '../actions'
import ExportPDFButton from '@/components/ExportPDFButton'

// Cette fonction est appelée par Next.js pour chaque requête.
export default async function MissionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. Récupérer les détails de la mission
  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .select('*')
    .eq('id', id)
    .single()

  if (missionError || !mission) {
    notFound() // Affiche une page 404 si la mission n'existe pas
  }

  // 2. Récupérer les inscriptions pour cette mission
  const { data: inscriptions, error: inscriptionsError } = await supabase
    .from('inscriptions')
    .select('*, user:users(*)') // Jointure pour avoir les infos du bénévole
    .eq('mission_id', id)

  if (inscriptionsError) {
    console.error('Error fetching inscriptions:', inscriptionsError)
    // On peut continuer même si les inscriptions ne se chargent pas
  }
  
  const typedInscriptions = inscriptions as (Inscription & { user: UserProfile })[] | null
  const isUserInscribed = user ? typedInscriptions?.some(i => i.user_id === user.id) ?? false : false
  const isMissionFull = typedInscriptions ? typedInscriptions.length >= mission.max_volunteers : false

  const handleJoin = async () => {
    'use server'
    return joinMission(mission.id)
  }

  const handleLeave = async () => {
    'use server'
    return leaveMission(mission.id)
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-8">
       <nav className="flex justify-between w-full p-4 border-b border-gray-200">
        <Link href="/" className="text-xl font-semibold hover:underline">
          &larr; Retour aux missions
        </Link>
        <AuthButton user={user} />
      </nav>

      <main className="p-8">
        <header className="pb-6 mb-6 border-b">
          <h1 className="text-4xl font-bold">{mission.title}</h1>
          <p className="mt-2 text-lg text-gray-600">{mission.description}</p>
          <div className="mt-4 text-gray-800">
             <p><strong>Lieu :</strong> {mission.location}</p>
             <p>
                <strong>Date :</strong>{' '}
                {new Date(mission.start_time).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p>
                <strong>Créneau :</strong>{' '}
                de {new Date(mission.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                {' à '}
                {new Date(mission.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <JoinMissionButton
            userId={user?.id}
            isUserInscribed={isUserInscribed}
            isMissionFull={isMissionFull}
            handleJoin={handleJoin}
            handleLeave={handleLeave}
          />
        </header>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Bénévoles inscrits ({typedInscriptions?.length || 0} / {mission.max_volunteers})</h2>
          {user && typedInscriptions && typedInscriptions.length > 0 && (
            <ExportPDFButton mission={mission} inscriptions={typedInscriptions} />
          )}
          {user ? (
            <div className="space-y-3">
              {typedInscriptions && typedInscriptions.length > 0 ? (
                typedInscriptions.map(inscription => (
                    <div key={inscription.id} className="p-3 bg-gray-100 rounded-md">
                        <p className="font-semibold">{inscription.user.first_name} {inscription.user.last_name}</p>
                        {inscription.user.accepts_contact_sharing && (
                             <p className="text-sm text-gray-600">{inscription.user.phone}</p>
                        )}
                    </div>
                ))
              ) : (
                <p className="text-gray-500">Personne n&apos;est encore inscrit à cette mission.</p>
              )}
            </div>
          ) : (
            <p className="text-gray-600">
              <Link href="/login" className="text-blue-600 underline">Connectez-vous</Link> pour voir la liste des inscrits et pour participer à la mission.
            </p>
          )}
        </section>
      </main>
    </div>
  )
} 