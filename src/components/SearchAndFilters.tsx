'use client'

import { useState, useEffect } from 'react'
import { MissionWithCounts } from '@/lib/types'

interface SearchAndFiltersProps {
  missions: Array<Omit<MissionWithCounts, 'inscriptions_count'> & { inscriptions_count: number }> | null
  onFilteredMissions: (missions: Array<Omit<MissionWithCounts, 'inscriptions_count'> & { inscriptions_count: number }> | null) => void
}

interface FilterState {
  search: string
  dateRange: {
    start: string
    end: string
  }
  status: 'all' | 'available' | 'full' | 'urgent'
  location: string
  sortBy: 'date' | 'title' | 'inscriptions' | 'urgency'
  sortOrder: 'asc' | 'desc'
}

export default function SearchAndFilters({ missions, onFilteredMissions }: SearchAndFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    dateRange: {
      start: '',
      end: ''
    },
    status: 'all',
    location: '',
    sortBy: 'date',
    sortOrder: 'asc'
  })

  const [showFilters, setShowFilters] = useState(false)

  // Appliquer les filtres et tri
  useEffect(() => {
    if (!missions) {
      onFilteredMissions(null)
      return
    }

    let filtered = [...missions]

    // Filtre par recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(mission => 
        mission.title.toLowerCase().includes(searchLower) ||
        mission.description?.toLowerCase().includes(searchLower) ||
        mission.location?.toLowerCase().includes(searchLower)
      )
    }

    // Filtre par date
    if (filters.dateRange.start) {
      filtered = filtered.filter(mission => 
        new Date(mission.start_time) >= new Date(filters.dateRange.start)
      )
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(mission => 
        new Date(mission.start_time) <= new Date(filters.dateRange.end)
      )
    }

    // Filtre par statut
    switch (filters.status) {
      case 'available':
        filtered = filtered.filter(mission => mission.inscriptions_count < mission.max_volunteers)
        break
      case 'full':
        filtered = filtered.filter(mission => mission.inscriptions_count >= mission.max_volunteers)
        break
      case 'urgent':
        filtered = filtered.filter(mission => mission.is_urgent)
        break
    }

    // Filtre par localisation
    if (filters.location) {
      filtered = filtered.filter(mission => 
        mission.location?.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'inscriptions':
          comparison = a.inscriptions_count - b.inscriptions_count
          break
        case 'urgency':
          // Les missions urgentes en premier
          if (a.is_urgent && !b.is_urgent) comparison = -1
          else if (!a.is_urgent && b.is_urgent) comparison = 1
          else comparison = 0
          break
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison
    })

    onFilteredMissions(filtered)
  }, [missions, filters, onFilteredMissions])

  const resetFilters = () => {
    setFilters({
      search: '',
      dateRange: { start: '', end: '' },
      status: 'all',
      location: '',
      sortBy: 'date',
      sortOrder: 'asc'
    })
  }

  const getUniqueLocations = () => {
    if (!missions) return []
    const locations = missions
      .map(m => m.location)
      .filter((location, index, self) => location && self.indexOf(location) === index)
      .filter((location): location is string => location !== null)
    return locations.sort()
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      {/* Barre de recherche principale */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="🔍 Rechercher une mission..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtres
        </button>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Filtre par statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as FilterState['status'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Toutes les missions</option>
                <option value="available">✅ Disponibles</option>
                <option value="full">❌ Complètes</option>
                <option value="urgent">🚨 Urgentes</option>
              </select>
            </div>

            {/* Filtre par localisation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Localisation
              </label>
              <select
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Toutes les localisations</option>
                {getUniqueLocations().map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            {/* Tri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔄 Trier par
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">📅 Date</option>
                <option value="title">📝 Titre</option>
                <option value="inscriptions">👥 Inscriptions</option>
                <option value="urgency">🚨 Urgence</option>
              </select>
            </div>

            {/* Ordre de tri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📈 Ordre
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as FilterState['sortOrder'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="asc">⬆️ Croissant</option>
                <option value="desc">⬇️ Décroissant</option>
              </select>
            </div>
          </div>

          {/* Filtres par date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Date de début
              </label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Date de fin
              </label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-between items-center">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Réinitialiser
            </button>
            
            <div className="text-sm text-gray-500">
              {missions ? `${missions.length} mission${missions.length > 1 ? 's' : ''} trouvée${missions.length > 1 ? 's' : ''}` : 'Aucune mission'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
