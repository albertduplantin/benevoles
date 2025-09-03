'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mission, UserFavorite } from '@/lib/types'
import { ButtonSpinner } from '@/components/ui/Spinner'

interface UserFavoritesProps {
  userId: string
  showAll?: boolean
}

export default function UserFavorites({ userId, showAll = false }: UserFavoritesProps) {
  const [favorites, setFavorites] = useState<UserFavorite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadFavorites()
  }, [userId])

  const loadFavorites = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          mission:missions(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFavorites(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFavorite = async (missionId: number) => {
    try {
      // Vérifier si la mission est déjà en favori
      const { data: existingFavorite } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('mission_id', missionId)
        .single()

      if (existingFavorite) {
        // Supprimer des favoris
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('id', existingFavorite.id)

        if (error) throw error
      } else {
        // Ajouter aux favoris
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: userId,
            mission_id: missionId
          })

        if (error) throw error
      }

      await loadFavorites()
    } catch (error) {
      console.error('Erreur lors de la mise à jour des favoris:', error)
    }
  }

  const isFavorite = (missionId: number): boolean => {
    return favorites.some(fav => fav.mission_id === missionId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <ButtonSpinner />
        <span className="ml-2">Chargement des favoris...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!showAll && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">⭐ Mes Favoris</h3>
          <span className="text-sm text-gray-500">
            {favorites.length} mission(s) favorite(s)
          </span>
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">⭐</div>
          <p className="text-gray-600">Aucune mission favorite</p>
          <p className="text-sm text-gray-500 mt-1">
            Cliquez sur l'étoile des missions pour les ajouter à vos favoris !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map(favorite => {
            const mission = favorite.mission as Mission
            if (!mission) return null

            return (
              <div key={favorite.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-lg line-clamp-2">{mission.title}</h4>
                  <button
                    onClick={() => toggleFavorite(mission.id)}
                    className="text-yellow-500 hover:text-yellow-600 transition-colors"
                    title="Retirer des favoris"
                  >
                    ⭐
                  </button>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {mission.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">📅</span>
                    <span>{new Date((mission as any).date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">⏰</span>
                    <span>{mission.start_time} - {mission.end_time}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">📍</span>
                    <span>{mission.location}</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (mission as any).status === 'active' ? 'bg-green-100 text-green-800' :
                    (mission as any).status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {(mission as any).status === 'active' ? 'Active' :
                     (mission as any).status === 'completed' ? 'Terminée' : 'Brouillon'}
                  </span>

                  {mission.is_urgent && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      🚨 Urgent
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <a
                    href={`/mission/${mission.id}`}
                    className="block w-full text-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Voir la mission
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Composant pour le bouton favori
export function FavoriteButton({ missionId, userId, isFavorite, onToggle }: {
  missionId: number
  userId: string
  isFavorite: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={`transition-colors ${
        isFavorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-yellow-500'
      }`}
      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      {isFavorite ? '⭐' : '☆'}
    </button>
  )
}
