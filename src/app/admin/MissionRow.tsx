'use client'

import { useState } from 'react'
import type { MissionWithCounts, UserProfile } from '@/lib/types'
import { deleteMissionAction } from './actions'
import Tooltip from '@/components/Tooltip'
import MissionEditModal from '@/components/admin/MissionEditModal'

interface MissionRowProps {
  mission: MissionWithCounts;
  users?: UserProfile[] | null;
  onEdit?: (planningMission: any) => void;
}

export default function MissionRow({ mission, users, onEdit }: MissionRowProps) {
  const [showVolunteers, setShowVolunteers] = useState(false)

  const handleDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la mission "${mission.title}" ? Cette action est irréversible.`)) {
      await deleteMissionAction(mission.id)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      const planningMission = {
        ...mission,
        volunteers: mission.inscriptions?.map(inscription => ({
          user_id: inscription.user_id,
          first_name: inscription.users?.first_name ?? null,
          last_name: inscription.users?.last_name ?? null,
          phone: inscription.users?.phone ?? null,
        })) || []
      }
      onEdit(planningMission)
    }
  }

  return (
    <>
      {/*
        ATTENTION :
        Ne jamais placer la modale MissionEditModal dans un <tr>, <td> ou <tbody> !
        Elle doit toujours être rendue ici, à la racine du composant,
        pour éviter toute erreur d'hydratation ou de structure HTML invalide.
      */}
      <tr className="border-t">
        <td className="px-4 py-2 font-medium flex items-center gap-2">
          {mission.title}
          {mission.is_urgent && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-red-600 text-white rounded-full">Urgent</span>
          )}
        </td>
        {mission.start_time === mission.end_time ? (
          <>
            <td className="px-4 py-2 text-blue-700 font-medium" colSpan={2}>Mission au long cours</td>
          </>
        ) : (
          <>
            <td className="px-4 py-2">{new Date(mission.start_time).toLocaleDateString('fr-FR')}</td>
            <td className="px-4 py-2">
              {new Date(mission.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {' - '}
              {new Date(mission.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </td>
          </>
        )}
        <td className="px-4 py-2 text-center">
          {mission.inscriptions_count} / {mission.max_volunteers}
        </td>
        <td className="px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <Tooltip content="Éditer la mission">
              <button 
                onClick={handleEdit} 
                className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
              >
                ✏️
              </button>
            </Tooltip>
            <form action={handleDelete} className="inline">
              <Tooltip content="Supprimer (irréversible)">
                <button 
                  type="submit" 
                  className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                >
                  🗑️
                </button>
              </Tooltip>
            </form>
          </div>
        </td>
      </tr>
      
      {showVolunteers && mission.inscriptions && mission.inscriptions.length > 0 && (
        <tr className="border-t bg-gray-50">
          <td colSpan={5} className="px-4 py-3">
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">
                  Bénévoles participants ({mission.inscriptions.length})
                </h4>
                <button 
                  onClick={() => setShowVolunteers(false)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ✕ Fermer
                </button>
              </div>
              
              {/* Section du responsable (si assigné) */}
              {mission.manager_id && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span>👑</span>
                    Responsable de mission
                  </h5>
                  {(() => {
                    const manager = users?.find(user => user.id === mission.manager_id)
                    if (!manager) return null
                    
                    return (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                              👑
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {manager.first_name} {manager.last_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                Rôle: {manager.role}
                              </div>
                              {manager.phone && (
                                <a href={`tel:${manager.phone}`} className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1">
                                  📞 {manager.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
              
              {/* Note explicative */}
              {mission.manager_id && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  <span className="font-medium">💡</span> Le responsable supervise la mission mais ne participe pas aux tâches. Il n'est pas compté dans les bénévoles participants.
                </div>
              )}
              
              {/* Format compact pour plus de 6 bénévoles, sinon format carte */}
              {mission.inscriptions.length > 6 ? (
                <div className="max-h-48 overflow-y-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Nom</th>
                        <th className="px-3 py-2 text-left font-medium">Téléphone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mission.inscriptions.map((inscription, index) => (
                        <tr key={inscription.user_id} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-3 py-2 font-medium">
                            {inscription.users?.first_name} {inscription.users?.last_name}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {inscription.users?.phone ? (
                              <a href={`tel:${inscription.users.phone}`} className="hover:text-blue-600">
                                📞 {inscription.users.phone}
                              </a>
                            ) : (
                              <span className="text-gray-400">Non renseigné</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mission.inscriptions.map((inscription, index) => (
                    <div key={inscription.user_id} className="flex items-center p-3 bg-gray-50 rounded border">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {inscription.users?.first_name} {inscription.users?.last_name}
                        </div>
                        {inscription.users?.phone ? (
                          <a href={`tel:${inscription.users.phone}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            📞 {inscription.users.phone}
                          </a>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Pas de téléphone renseigné
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
