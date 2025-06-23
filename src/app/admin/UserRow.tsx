'use client'

import type { UserProfile } from '@/lib/types'
import { deleteUserAction } from './actions'

export default function UserRow({ user }: { user: UserProfile }) {

  const handleDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.first_name} ${user.last_name} ? Cette action est irréversible et supprimera toutes ses inscriptions.`)) {
      const result = await deleteUserAction(user.id)
      if (result) {
        alert(result) // Affiche l'erreur ou le message de succès
      }
    }
  }

  return (
    <tr className="border-t">
      <td className="px-4 py-2 font-medium">{user.last_name} {user.first_name}</td>
      <td className="px-4 py-2 text-sm text-gray-600">Email non affiché</td>
      <td className="px-4 py-2">{user.phone}</td>
      <td className="px-4 py-2 text-center capitalize">{user.role}</td>
      <td className="px-4 py-2 text-center">
        <button className="text-blue-600 hover:underline text-sm" disabled>Promouvoir</button>
        <form action={handleDelete} className="inline ml-2">
          <button type="submit" className="text-red-600 hover:underline text-sm">
            Supprimer
          </button>
        </form>
      </td>
    </tr>
  )
} 