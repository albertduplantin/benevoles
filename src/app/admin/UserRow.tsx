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
    // Confirmation spéciale pour la promotion en admin
    if (newRole === 'admin' && user.role !== 'admin') {
      const confirmMessage = `⚠️ ATTENTION ⚠️\n\nVous êtes sur le point de promouvoir ${user.first_name} ${user.last_name} au rôle d'ADMINISTRATEUR.\n\nCette action donnera à cet utilisateur :\n• Accès complet à l'administration\n• Possibilité de modifier/supprimer des missions\n• Accès aux données de tous les utilisateurs\n• Pouvoir de promouvoir d'autres utilisateurs\n\nÊtes-vous absolument sûr de vouloir continuer ?`
      
      if (!window.confirm(confirmMessage)) {
        setCurrentRole(user.role) // Remettre le rôle original
        setIsEditing(false)
        return
      }
    }

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
            <option value="benevole">👤 Bénévole</option>
            <option value="responsable">👨‍💼 Responsable</option>
            <option value="admin">🛠️ Admin</option>
          </select>
        ) : (
          <span className={`capitalize font-medium ${
            currentRole === 'admin' ? 'text-red-600 bg-red-50 px-2 py-1 rounded' :
            currentRole === 'responsable' ? 'text-orange-600 bg-orange-50 px-2 py-1 rounded' :
            'text-blue-600 bg-blue-50 px-2 py-1 rounded'
          }`}>
            {currentRole === 'admin' ? '🛠️ Admin' :
             currentRole === 'responsable' ? '👨‍💼 Responsable' :
             '👤 Bénévole'}
          </span>
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
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              ✏️ Éditer
            </button>
            {user.role !== 'admin' && (
              <button 
                onClick={() => {
                  setCurrentRole('admin')
                  setIsEditing(true)
                }}
                className="text-red-600 hover:underline text-sm font-medium"
                title="Promouvoir en administrateur"
              >
                🛠️ Promouvoir Admin
              </button>
            )}
            <button 
              onClick={handleDelete}
              className="text-red-600 hover:underline text-sm"
            >
              🗑️ Supprimer
            </button>
          </div>
        )}
      </td>
    </tr>
  )
} 