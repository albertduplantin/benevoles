'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MissionWithCounts } from '@/lib/types'
import WelcomeMessage from '@/components/WelcomeMessage'
import SendNotification from '@/components/SendNotification'
import AdminExportData from '@/components/AdminExportData'
import ContactVolunteers from '@/components/ContactVolunteers'
import { ButtonSpinner } from '@/components/ui/Spinner'

interface ResponsableDashboardClientProps {
  assignedMissions: Array<Omit<MissionWithCounts, 'inscriptions_count'> & { inscriptions_count: number }>
  stats: {
    assignedMissions: number
    totalVolunteers: number
    upcomingMissions: number
    completedMissions: number
    urgentMissions: number
    totalMissions: number
    totalVolunteersAll: number
  }
  userRole?: string
  userId: string
}

export default function ResponsableDashboardClient({ 
  assignedMissions, 
  stats, 
  userRole, 
  userId 
}: ResponsableDashboardClientProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    window.location.reload()
  }

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Obtenir le statut d'une mission
  const getMissionStatus = (mission: { start_time: string; end_time: string; is_urgent?: boolean }) => {
    const now = new Date()
    const start = new Date(mission.start_time)
    const end = new Date(mission.end_time)

    if (now < start) return { status: 'upcoming', color: 'bg-blue-100 text-blue-800', label: 'À venir' }
    if (now >= start && now <= end) return { status: 'active', color: 'bg-green-100 text-green-800', label: 'En cours' }
    return { status: 'completed', color: 'bg-gray-100 text-gray-800', label: 'Terminée' }
  }

  return (
    <div className="space-y-8">
      {/* Message de bienvenue */}
      <WelcomeMessage user={{ id: userId } as any} page="responsable" />

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Missions assignées</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assignedMissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bénévoles assignés</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVolunteers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Missions à venir</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingMissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Missions urgentes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.urgentMissions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">⚡ Actions Rapides</h2>
        <div className="flex flex-wrap gap-4">
          <SendNotification 
            missions={assignedMissions}
            userRole={userRole}
          />
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            {isRefreshing ? (
              <>
                <ButtonSpinner size="sm" />
                Actualisation...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualiser
              </>
            )}
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Voir toutes les missions
          </Link>
        </div>
      </div>

      {/* Export de données */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Export de Données</h2>
        <p className="text-gray-600 mb-4">Exportez les données de vos missions assignées</p>
        <AdminExportData 
          missions={assignedMissions}
          userRole={userRole}
        />
      </div>

      {/* Missions assignées */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">🎯 Mes Missions Assignées</h2>
          <p className="text-gray-600 mt-1">Gérez les missions qui vous sont assignées</p>
        </div>
        
        <div className="p-6">
          {assignedMissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune mission assignée</h3>
              <p className="text-gray-600">Vous n'avez pas encore de missions assignées.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedMissions.map((mission) => {
                const status = getMissionStatus(mission)
                const volunteersCount = mission.inscriptions?.length || 0
                
                return (
                  <div key={mission.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{mission.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                          {mission.is_urgent && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              ⚠️ Urgent
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{mission.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">📅 Début:</span>
                            <p className="text-gray-600">{formatDate(mission.start_time)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">🏁 Fin:</span>
                            <p className="text-gray-600">{formatDate(mission.end_time)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">👥 Bénévoles:</span>
                            <p className="text-gray-600">{volunteersCount} / {mission.max_volunteers}</p>
                          </div>
                        </div>
                        
                        {mission.location && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-700">📍 Lieu:</span>
                            <p className="text-gray-600">{mission.location}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex flex-col gap-2">
                        <Link
                          href={`/mission/${mission.id}`}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                          Voir détails
                        </Link>
                        {volunteersCount > 0 && (
                          <ContactVolunteers
                            missionId={mission.id}
                            missionTitle={mission.title}
                            volunteers={mission.inscriptions || []}
                            userRole={userRole}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 Vue d'Ensemble</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Missions totales du festival</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalMissions}</p>
            <p className="text-sm text-gray-600 mt-1">
              {stats.assignedMissions} vous sont assignées ({Math.round((stats.assignedMissions / stats.totalMissions) * 100)}%)
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Bénévoles total du festival</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalVolunteersAll}</p>
            <p className="text-sm text-gray-600 mt-1">
              {stats.totalVolunteers} dans vos missions ({Math.round((stats.totalVolunteers / stats.totalVolunteersAll) * 100)}%)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
