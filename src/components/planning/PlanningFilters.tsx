'use client'

import { PlanningFilters as FilterType, PlanningMission, UserProfile } from '@/lib/types'

interface PlanningFiltersProps {
  filters: FilterType
  onFiltersChange: (filters: FilterType) => void
  users: UserProfile[]
  missions: PlanningMission[]
}

export default function PlanningFilters({ filters, onFiltersChange, users, missions }: PlanningFiltersProps) {
  const updateFilter = (key: keyof FilterType, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  // Extraire les lieux uniques des missions
  const uniqueLocations = Array.from(new Set(missions.map(m => m.location).filter(Boolean)))
  
  // Obtenir les responsables
  const managers = users.filter(u => ['admin', 'responsable'].includes(u.role))

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Réinitialiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Date de début */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de début
          </label>
          <input
            type="date"
            value={filters.start_date || ''}
            onChange={(e) => updateFilter('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Date de fin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de fin
          </label>
          <input
            type="date"
            value={filters.end_date || ''}
            onChange={(e) => updateFilter('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Bénévole */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bénévole
          </label>
          <select
            value={filters.volunteer_id || ''}
            onChange={(e) => updateFilter('volunteer_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Tous les bénévoles</option>
            {users.filter(u => u.role === 'benevole').map(user => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* Responsable */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Responsable
          </label>
          <select
            value={filters.manager_id || ''}
            onChange={(e) => updateFilter('manager_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Tous les responsables</option>
            {managers.map(manager => (
              <option key={manager.id} value={manager.id}>
                {manager.first_name} {manager.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* Lieu */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lieu
          </label>
          <select
            value={filters.location || ''}
            onChange={(e) => updateFilter('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Tous les lieux</option>
            {uniqueLocations.map(location => (
              <option key={location} value={location || ''}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {/* Statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => updateFilter('status', e.target.value as FilterType['status'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">Toutes les missions</option>
            <option value="available">Places disponibles</option>
            <option value="full">Complet</option>
            <option value="conflicts">Avec conflits</option>
          </select>
        </div>
      </div>

      {/* Résumé des filtres actifs */}
      {Object.values(filters).some(v => v) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Filtres actifs :</span>
            {filters.start_date && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Début: {new Date(filters.start_date).toLocaleDateString('fr-FR')}
                <button
                  onClick={() => updateFilter('start_date', undefined)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.end_date && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Fin: {new Date(filters.end_date).toLocaleDateString('fr-FR')}
                <button
                  onClick={() => updateFilter('end_date', undefined)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.volunteer_id && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Bénévole: {users.find(u => u.id === filters.volunteer_id)?.first_name}
                <button
                  onClick={() => updateFilter('volunteer_id', undefined)}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.location && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Lieu: {filters.location}
                <button
                  onClick={() => updateFilter('location', undefined)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 