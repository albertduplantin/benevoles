'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mission } from '@/lib/types'
import { ButtonSpinner } from '@/components/ui/Spinner'

interface CreateMissionChatProps {
  mission: Mission
  onChatCreated?: (roomId: number) => void
}

export default function CreateMissionChat({ mission, onChatCreated }: CreateMissionChatProps) {
  const [isCreating, setIsCreating] = useState(false)
  const supabase = createClient()

  const createMissionChat = async () => {
    setIsCreating(true)
    try {
      // Vérifier si une conversation existe déjà pour cette mission
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('mission_id', mission.id)
        .eq('type', 'mission')
        .single()

      if (existingRoom) {
        alert('Une conversation existe déjà pour cette mission.')
        if (onChatCreated) onChatCreated(existingRoom.id)
        return
      }

      // Créer la conversation de mission
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: `Mission: ${mission.title}`,
          description: `Chat pour la mission: ${mission.title}`,
          type: 'mission',
          mission_id: mission.id,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Ajouter le créateur comme participant
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert({
          room_id: room.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          role: 'admin'
        })

      if (participantError) throw participantError

      // Ajouter automatiquement tous les bénévoles inscrits
      const { data: inscriptions } = await supabase
        .from('inscriptions')
        .select('user_id')
        .eq('mission_id', mission.id)

      if (inscriptions && inscriptions.length > 0) {
        const participants = inscriptions.map(inscription => ({
          room_id: room.id,
          user_id: inscription.user_id,
          role: 'member'
        }))

        const { error: bulkInsertError } = await supabase
          .from('chat_participants')
          .insert(participants)

        if (bulkInsertError) {
          console.error('Erreur lors de l\'ajout des participants:', bulkInsertError)
        }
      }

      // Ajouter le responsable de mission s'il existe
      if (mission.manager_id) {
        const { error: managerError } = await supabase
          .from('chat_participants')
          .insert({
            room_id: room.id,
            user_id: mission.manager_id,
            role: 'moderator'
          })

        if (managerError) {
          console.error('Erreur lors de l\'ajout du responsable:', managerError)
        }
      }

      alert('Conversation créée avec succès !')
      if (onChatCreated) onChatCreated(room.id)

    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error)
      alert('Erreur lors de la création de la conversation')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <button
      onClick={createMissionChat}
      disabled={isCreating}
      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
    >
      {isCreating ? (
        <>
          <ButtonSpinner />
          Création...
        </>
      ) : (
        <>
          💬 Créer Chat Mission
        </>
      )}
    </button>
  )
}
