'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function createMissionAction(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return "Action non autorisée."

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return "Action non autorisée."

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    location: formData.get('location') as string,
    start_time: formData.get('start_time') as string,
    end_time: formData.get('end_time') as string,
    max_volunteers: parseInt(formData.get('max_volunteers') as string, 10)
  }

  // Validation simple
  if (!rawData.title || !rawData.start_time || !rawData.end_time || !rawData.max_volunteers) {
    return "Erreur : Champs requis manquants."
  }
  
  const { error } = await supabase.from('missions').insert(rawData)

  if (error) {
    return `Erreur lors de la création : ${error.message}`
  }

  revalidatePath('/admin')
  revalidatePath('/')
  return "Succès ! La mission a été créée."
}

export async function deleteMissionAction(missionId: number) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return "Action non autorisée."

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return "Action non autorisée."

  // On supprime d'abord les inscriptions liées à cette mission pour éviter les erreurs de contrainte de clé étrangère
  const { error: inscriptionError } = await supabase.from('inscriptions').delete().eq('mission_id', missionId)

  if (inscriptionError) {
    return `Erreur lors de la suppression des inscriptions : ${inscriptionError.message}`
  }

  const { error: missionError } = await supabase.from('missions').delete().eq('id', missionId)

  if (missionError) {
    return `Erreur lors de la suppression de la mission : ${missionError.message}`
  }

  revalidatePath('/admin')
  revalidatePath('/')
}

export async function deleteUserAction(userId: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // 1. Vérifier que l'opérateur est bien un admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return "Action non autorisée."

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return "Action non autorisée."
  
  if (user.id === userId) return "Vous ne pouvez pas supprimer votre propre compte administrateur."

  // 2. Créer un client admin avec la clé service_role pour avoir les droits de suppression
  const supabaseAdmin = createClient(cookies())
  // La librairie @supabase/ssr ne permet pas de passer directement la clé service_role
  // Il faut utiliser createClient de @supabase/supabase-js pour les opérations d'admin
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await adminClient.auth.admin.deleteUser(userId)

  if (error) {
    return `Erreur lors de la suppression de l'utilisateur : ${error.message}`
  }

  revalidatePath('/admin')
} 