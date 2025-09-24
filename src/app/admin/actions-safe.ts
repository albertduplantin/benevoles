'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMissionActionSafe(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return "Action non autorisée."

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return "Action non autorisée."

  const managerId = formData.get('manager_id') as string
  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    location: formData.get('location') as string,
    start_time: formData.get('start_time') as string,
    end_time: formData.get('end_time') as string,
    max_volunteers: parseInt(formData.get('max_volunteers') as string, 10),
    manager_id: managerId || null
  }

  // Validation simple
  if (!rawData.title || !rawData.start_time || !rawData.end_time || !rawData.max_volunteers) {
    return "Erreur : Champs requis manquants."
  }
  
  // Insertion simple sans déclencheurs
  const { data: newMission, error } = await supabase.from('missions').insert(rawData).select().single()

  if (error) {
    return `Erreur lors de la création : ${error.message}`
  }

  console.log(`✅ Mission ${newMission?.id} créée avec succès (version sécurisée)`)

  revalidatePath('/admin')
  revalidatePath('/')
  return "Succès ! La mission a été créée."
} 