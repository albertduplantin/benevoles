'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
<<<<<<< HEAD
=======

// Valeur sentinelle utilisée pour identifier les missions « sans date »
const NO_DATE_SENTINEL = '1970-01-01T00:00:00Z'

>>>>>>> f04bd292517aef758b35a542c8acbf0c58acef3e

export async function createMissionAction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return "Action non autorisée."

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return "Action non autorisée."

  const managerId = formData.get('manager_id') as string
<<<<<<< HEAD
=======
  const isLongTerm = formData.get('long_term') === 'on'
>>>>>>> f04bd292517aef758b35a542c8acbf0c58acef3e
  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    location: formData.get('location') as string,
<<<<<<< HEAD
    start_time: formData.get('start_time') as string,
    end_time: formData.get('end_time') as string,
    max_volunteers: parseInt(formData.get('max_volunteers') as string, 10),
    manager_id: managerId || null
=======
    start_time: isLongTerm ? NO_DATE_SENTINEL : (formData.get('start_time') as string),
    end_time: isLongTerm ? NO_DATE_SENTINEL : (formData.get('end_time') as string),
    max_volunteers: parseInt(formData.get('max_volunteers') as string, 10),
    manager_id: managerId || null,
    is_urgent: formData.get('is_urgent') === 'on'
>>>>>>> f04bd292517aef758b35a542c8acbf0c58acef3e
  }

  // Validation simple
  if (!rawData.title || (!isLongTerm && (!rawData.start_time || !rawData.end_time)) || !rawData.max_volunteers) {
    return "Erreur : Champs requis manquants."
  }
  
  const { data: newMission, error } = await supabase.from('missions').insert(rawData).select().single()

  if (error) {
    return `Erreur lors de la création : ${error.message}`
  }

  revalidatePath('/admin')
  revalidatePath('/')
  return "Succès ! La mission a été créée."
}

export async function deleteMissionAction(missionId: number) {
  const supabase = await createClient()

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
  const supabase = await createClient()

  // 1. Vérifier que l'opérateur est bien un admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return "Action non autorisée."

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return "Action non autorisée."
  
  if (user.id === userId) return "Vous ne pouvez pas supprimer votre propre compte administrateur."

  // 2. Créer un client admin avec la clé service_role pour avoir les droits de suppression
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

export async function promoteUserAction(userId: string, newRole: 'benevole' | 'responsable' | 'admin') {
  const supabase = await createClient()

  // Vérifier que l'opérateur est bien un admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return "Action non autorisée."

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return "Action non autorisée."

  // Mettre à jour le rôle de l'utilisateur
  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) {
    return `Erreur lors de la modification du rôle : ${error.message}`
  }

  revalidatePath('/admin')
  return `Rôle mis à jour avec succès.`
}

export async function createUserAction(formData: FormData) {
  // Vérifier que l'opérateur est bien un admin avec le client normal
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return "Action non autorisée."

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return "Action non autorisée."

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string
  const phone = formData.get('phone') as string
  const role = formData.get('role') as 'benevole' | 'responsable' | 'admin'

  if (!email || !password || !firstName || !lastName) {
    return "Erreur : Tous les champs obligatoires doivent être remplis."
  }

  try {
    // Vérifier que les variables d'environnement sont présentes
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return "Erreur : URL Supabase manquante"
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return "Erreur : Clé service role manquante"
    }

    console.log('Creating admin client...')
    // Créer un client admin séparé pour les opérations administratives
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Créer l'utilisateur avec l'API admin
    console.log('Creating user with email:', email)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    console.log('Auth result:', { authData: !!authData, error: authError })

    if (authError) {
      console.error('Auth error:', authError)
      return `Erreur lors de la création du compte : ${authError.message}`
    }

    if (!authData.user) {
      return "Erreur : Utilisateur non créé"
    }

    // Créer le profil utilisateur avec le client admin aussi
    const { error: profileError } = await adminClient
      .from('users')
      .insert({
        id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        role: role || 'benevole'
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Si la création du profil échoue, supprimer l'utilisateur auth
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return `Erreur lors de la création du profil : ${profileError.message}`
    }

    revalidatePath('/admin')
    return "Utilisateur créé avec succès."
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return `Erreur inattendue : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
  }
}

export async function updateMissionAction(missionId: number, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return "Action non autorisée."

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return "Action non autorisée."

  const managerId = formData.get('manager_id') as string
<<<<<<< HEAD
=======
  const isLongTermUpdate = formData.get('long_term') === 'on'
>>>>>>> f04bd292517aef758b35a542c8acbf0c58acef3e
  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    location: formData.get('location') as string,
<<<<<<< HEAD
    start_time: formData.get('start_time') as string,
    end_time: formData.get('end_time') as string,
    max_volunteers: parseInt(formData.get('max_volunteers') as string, 10),
    manager_id: managerId || null
  }

  // Validation simple
  if (!rawData.title || !rawData.start_time || !rawData.end_time || !rawData.max_volunteers) {
=======
    start_time: isLongTermUpdate ? NO_DATE_SENTINEL : (formData.get('start_time') as string),
    end_time: isLongTermUpdate ? NO_DATE_SENTINEL : (formData.get('end_time') as string),
    max_volunteers: parseInt(formData.get('max_volunteers') as string, 10),
    manager_id: managerId || null,
    is_urgent: formData.get('is_urgent') === 'on'
  }

  // Validation simple
  if (!rawData.title || (!isLongTermUpdate && (!rawData.start_time || !rawData.end_time)) || !rawData.max_volunteers) {
>>>>>>> f04bd292517aef758b35a542c8acbf0c58acef3e
    return "Erreur : Champs requis manquants."
  }
  
  const { error } = await supabase
    .from('missions')
    .update(rawData)
    .eq('id', missionId)

  if (error) {
    return `Erreur lors de la mise à jour : ${error.message}`
  }

<<<<<<< HEAD
=======
  // Notifications désactivées (système nettoyé)
  console.log(`✅ Mission ${missionId} mise à jour`)

>>>>>>> f04bd292517aef758b35a542c8acbf0c58acef3e
  revalidatePath('/admin')
  revalidatePath('/')
  return "Succès ! La mission a été mise à jour."
} 