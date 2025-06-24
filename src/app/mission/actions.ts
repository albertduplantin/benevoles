'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Action pour INSCRIRE un utilisateur à une mission
export async function joinMission(missionId: number) {
  const supabase = await createClient()

  // 1. Vérifier si l'utilisateur est connecté
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return "Vous devez être connecté pour rejoindre une mission."
  }

  // 2. Récupérer les détails de la mission cible
  const { data: targetMission, error: missionError } = await supabase
    .from('missions')
    .select('*')
    .eq('id', missionId)
    .single()

  if (missionError || !targetMission) {
    return "La mission n'a pas été trouvée."
  }

  // 3. Vérifier si la mission est complète
  const { count: inscriptionsCount, error: countError } = await supabase
    .from('inscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('mission_id', missionId)

  if (countError) {
    return "Erreur lors de la vérification des inscriptions."
  }

  if (inscriptionsCount !== null && inscriptionsCount >= targetMission.max_volunteers) {
    return "Cette mission est déjà complète."
  }

  // 4. Vérifier les conflits d'horaires pour l'utilisateur
  const { data: userInscriptions, error: userInscriptionsError } = await supabase
    .from('inscriptions')
    .select('mission_id')
    .eq('user_id', user.id)

  if (userInscriptionsError) {
    return "Erreur lors de la récupération de vos missions."
  }

  const missionIds = userInscriptions.map(i => i.mission_id)

  if (missionIds.length > 0) {
    const { data: userMissions, error: missionsError } = await supabase
      .from('missions')
      .select('*')
      .in('id', missionIds)
    
    if (missionsError) {
      return "Erreur lors de la vérification des missions existantes."
    }

    const targetStartTime = new Date(targetMission.start_time).getTime()
    const targetEndTime = new Date(targetMission.end_time).getTime()

    for (const existingMission of userMissions) {
      const existingStartTime = new Date(existingMission.start_time).getTime()
      const existingEndTime = new Date(existingMission.end_time).getTime()

      if (targetStartTime < existingEndTime && targetEndTime > existingStartTime) {
        return `Vous êtes déjà inscrit à la mission "${existingMission.title}" sur ce créneau.`
      }
    }
  }

  // 5. Si tout est bon, inscrire l'utilisateur
  const { error: insertError } = await supabase
    .from('inscriptions')
    .insert({ mission_id: missionId, user_id: user.id })

  if (insertError) {
    return `Erreur lors de l'inscription : ${insertError.message}`
  }

  // 6. Invalider le cache pour rafraîchir la page
  revalidatePath(`/mission/${missionId}`)
  revalidatePath(`/`)
}


// Action pour DÉSINSCRIRE un utilisateur d'une mission
export async function leaveMission(missionId: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return "Vous n'êtes pas connecté."
  }

  const { error } = await supabase
    .from('inscriptions')
    .delete()
    .eq('mission_id', missionId)
    .eq('user_id', user.id)

  if (error) {
    return `Erreur lors de la désinscription : ${error.message}`
  }

  revalidatePath(`/mission/${missionId}`)
  revalidatePath(`/`)
} 