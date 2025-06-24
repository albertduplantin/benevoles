'use client'

import { useState } from 'react'
import type { MissionWithCounts, UserProfile } from '@/lib/types'
import { deleteMissionAction, updateMissionAction } from './actions'

interface MissionRowProps {
  mission: MissionWithCounts;
  users?: UserProfile[] | null;
}

export default function MissionRow({ mission, users }: MissionRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la mission "${mission.title}" ? Cette action est irréversible.`)) {
      await deleteMissionAction(mission.id)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async (formData: FormData) => {
    setIsLoading(true)
    try {
      await updateMissionAction(mission.id, formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <tr className="border-t bg-gray-50">
        <td colSpan={5} className="px-4 py-4">
          <form action={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={mission.title}
                  required
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Lieu</label>
                <input
                  type="text"
                  name="location"
                  defaultValue={mission.location || ''}
                  required
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Début</label>
                <input
                  type="datetime-local"
                  name="start_time"
                  defaultValue={new Date(mission.start_time).toISOString().slice(0, 16)}
                  required
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fin</label>
                <input
                  type="datetime-local"
                  name="end_time"
                  defaultValue={new Date(mission.end_time).toISOString().slice(0, 16)}
                  required
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
                             <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">Max bénévoles</label>
                 <input
                   type="number"
                   name="max_volunteers"
                   defaultValue={mission.max_volunteers}
                   min="1"
                   required
                   className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                 />
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">Responsable (optionnel)</label>
                 <select
                   name="manager_id"
                   defaultValue={mission.manager_id || ''}
                   className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                 >
                   <option value="">Aucun responsable assigné</option>
                   {users?.filter(user => user.role === 'responsable' || user.role === 'admin').map(user => (
                     <option key={user.id} value={user.id}>
                       {user.first_name} {user.last_name} ({user.role})
                     </option>
                   ))}
                 </select>
               </div>
             </div>
             <div className="mb-3">
               <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
               <textarea
                 name="description"
                 defaultValue={mission.description || ''}
                 rows={2}
                 className="w-full text-sm border border-gray-300 rounded px-2 py-1"
               />
             </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t">
      <td className="px-4 py-2 font-medium">{mission.title}</td>
      <td className="px-4 py-2">{new Date(mission.start_time).toLocaleDateString('fr-FR')}</td>
      <td className="px-4 py-2">
        {new Date(mission.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        {' - '}
        {new Date(mission.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </td>
      <td className="px-4 py-2 text-center">
        {mission.inscriptions_count} / {mission.max_volunteers}
      </td>
      <td className="px-4 py-2 text-center">
        <button onClick={handleEdit} className="text-blue-600 hover:underline text-sm">Éditer</button>
        <form action={handleDelete} className="inline ml-2">
            <button type="submit" className="text-red-600 hover:underline text-sm">
                Supprimer
            </button>
        </form>
      </td>
    </tr>
  )
}
