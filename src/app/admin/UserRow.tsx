'use client'

import { useState } from 'react'
import type { UserProfile } from '@/lib/types'
import { deleteUserAction, promoteUserAction } from './actions'

export default function UserRow({ user }: { user: UserProfile }) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentRole, setCurrentRole] = useState(user.role)

  const handleDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l&apos;utilisateur ${user.first_name} ${user.last_name} ? Cette action est irréversible et supprimera toutes ses inscriptions.`)) {
      const result = await deleteUserAction(user.id)
      if (result) {
        alert(result)
      }
    }
  }

  const handlePromote = async (newRole: 'benevole' | 'responsable' | 'admin') => {
    const result = await promoteUserAction(user.id, newRole)
    if (result) {
      alert(result)
      if (result.includes('succès')) {
        setCurrentRole(newRole)
        setIsEditing(false)
      }
    }
  }

  return (
    <tr className="border-t">
      <td className="px-4 py-2 font-medium">{user.last_name} {user.first_name}</td>
      <td className="px-4 py-2 text-sm text-gray-600">Email masqué</td>
      <td className="px-4 py-2">{user.phone || 'Non renseigné'}</td>
      <td className="px-4 py-2 text-center">
        {isEditing ? (
          <select 
            value={currentRole} 
            onChange={(e) => setCurrentRole(e.target.value as 'benevole' | 'responsable' | 'admin')}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="benevole">Bénévole</option>
            <option value="responsable">Responsable</option>
            <option value="admin">Admin</option>
          </select>
        ) : (
          <span className="capitalize">{currentRole}</span>
        )}
      </td>
      <td className="px-4 py-2 text-center">
        {isEditing ? (
          <div className="space-x-2">
            <button 
              onClick={() => handlePromote(currentRole)}
              className="text-green-600 hover:underline text-sm"
            >
              Valider
            </button>
            <button 
              onClick={() => {
                setCurrentRole(user.role)
                setIsEditing(false)
              }}
              className="text-gray-600 hover:underline text-sm"
            >
              Annuler
            </button>
          </div>
        ) : (
          <div className="space-x-2">
            <button 
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:underline text-sm"
            >
              Éditer
            </button>
            <button 
              onClick={handleDelete}
              className="text-red-600 hover:underline text-sm"
            >
              Supprimer
            </button>
          </div>
        )}
      </td>
    </tr>
  )
} 