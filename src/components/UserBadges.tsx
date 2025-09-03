'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserBadge, Badge } from '@/lib/types'
import { ButtonSpinner } from '@/components/ui/Spinner'

interface UserBadgesProps {
  userId: string
  showAll?: boolean
}

export default function UserBadges({ userId, showAll = false }: UserBadgesProps) {
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEarnedOnly, setShowEarnedOnly] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadBadges()
  }, [userId, showEarnedOnly])

  const loadBadges = async () => {
    try {
      setIsLoading(true)

      if (showEarnedOnly) {
        // Charger seulement les badges gagnés
        const { data } = await supabase
          .from('user_badges')
          .select(`
            *,
            badge:badges(*)
          `)
          .eq('user_id', userId)
          .order('earned_at', { ascending: false })

        setBadges(data || [])
      } else {
        // Charger tous les badges disponibles
        const { data } = await supabase
          .from('badges')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        setAllBadges(data || [])

        // Charger les badges gagnés pour marquer ceux qui sont débloqués
        const { data: earnedBadges } = await supabase
          .from('user_badges')
          .select('badge_id')
          .eq('user_id', userId)

        const earnedBadgeIds = new Set(earnedBadges?.map(eb => eb.badge_id) || [])
        
        // Créer des UserBadge pour tous les badges
        const allUserBadges: UserBadge[] = (data || []).map(badge => ({
          id: 0,
          user_id: userId,
          badge_id: badge.id,
          earned_at: earnedBadgeIds.has(badge.id) ? new Date().toISOString() : '',
          badge: badge
        }))

        setBadges(allUserBadges)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des badges:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50'
      case 'rare': return 'border-blue-300 bg-blue-50'
      case 'epic': return 'border-purple-300 bg-purple-50'
      case 'legendary': return 'border-yellow-300 bg-yellow-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600'
      case 'rare': return 'text-blue-600'
      case 'epic': return 'text-purple-600'
      case 'legendary': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const isEarned = (badge: UserBadge) => {
    return badge.earned_at && badge.earned_at !== ''
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <ButtonSpinner />
        <span className="ml-2">Chargement des badges...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Contrôles */}
      {!showAll && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">🏆 Mes Badges</h3>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showEarnedOnly}
                onChange={(e) => setShowEarnedOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Badges gagnés seulement</span>
            </label>
          </div>
        </div>
      )}

      {/* Grille des badges */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {badges.map((userBadge) => {
          const badge = userBadge.badge
          if (!badge) return null

          const earned = isEarned(userBadge)
          
          return (
            <div
              key={badge.id}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                earned 
                  ? getRarityColor(badge.rarity)
                  : 'border-gray-200 bg-gray-100 opacity-60'
              }`}
            >
              {/* Icône du badge */}
              <div className="text-center mb-3">
                <div className={`text-4xl ${earned ? '' : 'grayscale'}`}>
                  {badge.icon}
                </div>
              </div>

              {/* Nom du badge */}
              <div className="text-center mb-2">
                <h4 className={`font-medium text-sm ${earned ? getRarityTextColor(badge.rarity) : 'text-gray-500'}`}>
                  {badge.name}
                </h4>
              </div>

              {/* Description */}
              <div className="text-center mb-3">
                <p className={`text-xs ${earned ? 'text-gray-600' : 'text-gray-400'}`}>
                  {badge.description}
                </p>
              </div>

              {/* Rareté */}
              <div className="text-center">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  earned 
                    ? getRarityColor(badge.rarity).replace('bg-', 'bg-').replace('border-', 'border-')
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {badge.rarity}
                </span>
              </div>

              {/* Date d'obtention */}
              {earned && userBadge.earned_at && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" title="Badge gagné"></div>
                </div>
              )}

              {/* Overlay pour les badges non gagnés */}
              {!earned && (
                <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                  <div className="text-white text-xs font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                    Verrouillé
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Message si aucun badge */}
      {badges.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-gray-600">
            {showEarnedOnly ? 'Aucun badge gagné pour le moment' : 'Aucun badge disponible'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Complétez des missions pour débloquer vos premiers badges !
          </p>
        </div>
      )}

      {/* Statistiques */}
      {badges.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {badges.filter(b => isEarned(b)).length}
              </div>
              <div className="text-sm text-gray-600">Badges gagnés</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {badges.filter(b => !isEarned(b)).length}
              </div>
              <div className="text-sm text-gray-600">Badges verrouillés</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {badges.filter(b => isEarned(b) && b.badge?.rarity === 'rare').length}
              </div>
              <div className="text-sm text-gray-600">Badges rares</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {badges.filter(b => isEarned(b) && b.badge?.rarity === 'legendary').length}
              </div>
              <div className="text-sm text-gray-600">Badges légendaires</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
