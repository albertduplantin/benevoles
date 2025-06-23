'use client'

import type { MissionWithCounts } from '@/lib/types'
import { deleteMissionAction } from './actions'

export default function MissionRow({ mission }: { mission: MissionWithCounts }) {

  const handleDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la mission "${mission.title}" ? Cette action est irréversible.`)) {
      await deleteMissionAction(mission.id)
    }
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
        <button className="text-blue-600 hover:underline text-sm" disabled>Éditer</button>
        <form action={handleDelete} className="inline ml-2">
            <button type="submit" className="text-red-600 hover:underline text-sm">
                Supprimer
            </button>
        </form>
      </td>
    </tr>
  )
}
