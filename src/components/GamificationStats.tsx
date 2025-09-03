'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserGamificationStats } from '@/lib/types'
import { ButtonSpinner } from '@/components/ui/Spinner'

interface GamificationStatsProps {
  userId: string
  compact?: boolean
}

export default function GamificationStats({ userId, compact = false }: GamificationStatsProps) {
  const [stats, setStats] = useState<UserGamificationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [userId])

  const loadStats = async () => {
    try {
      setIsLoading(true)

      // Calculer le total de points
      const { data: pointsData } = await supabase
        .from('user_points')
        .select(`
          points,
          point_type:point_types(points_value)
        `)
        .eq('user_id', userId)

      const total_points = pointsData?.reduce((sum, point) => 
        sum + (point.points * ((point.point_type as any)?.points_value || 1)), 0) || 0

      // Compter les badges
      const { count: badges_count } = await supabase
        .from('user_badges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Charger les streaks
      const { data: streaks } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)

      // Charger les récents accomplissements
      const { data: recentPoints } = await supabase
        .from('user_points')
        .select(`
          *,
          point_type:point_types(*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(3)

      const { data: recentBadges } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(3)

      const recent_achievements = [
        ...(recentPoints || []),
        ...(recentBadges || [])
      ].sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime()).slice(0, 3)

      setStats({
        total_points,
        badges_count: badges_count || 0,
        current_streaks: streaks || [],
        recent_achievements,
        leaderboard_position: 0
      })

    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20">
        <ButtonSpinner />
        <span className="ml-2 text-sm">Chargement...</span>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <span className="text-yellow-500">⭐</span>
          <span className="font-medium">{stats.total_points}</span>
          <span className="text-gray-500">points</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-yellow-600">🏆</span>
          <span className="font-medium">{stats.badges_count}</span>
          <span className="text-gray-500">badges</span>
        </div>
        {stats.current_streaks.length > 0 && (
          <div className="flex items-center space-x-1">
            <span className="text-orange-500">🔥</span>
            <span className="font-medium">
              {stats.current_streaks.find(s => s.streak_type === 'days_active')?.current_streak || 0}
            </span>
            <span className="text-gray-500">jours</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Statistiques principales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.total_points}</div>
          <div className="text-sm text-yellow-700">Points</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{stats.badges_count}</div>
          <div className="text-sm text-purple-700">Badges</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">
            {stats.current_streaks.find(s => s.streak_type === 'days_active')?.current_streak || 0}
          </div>
          <div className="text-sm text-orange-700">Streak</div>
        </div>
      </div>

      {/* Streaks détaillés */}
      {stats.current_streaks.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">🔥 Vos Streaks</h4>
          <div className="space-y-2">
            {stats.current_streaks.map((streak) => (
              <div key={streak.id} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">
                  {streak.streak_type.replace('_', ' ')}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{streak.current_streak}</span>
                  <span className="text-xs text-gray-500">
                    (meilleur: {streak.longest_streak})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Récentes réalisations */}
      {stats.recent_achievements.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">🌟 Récentes Réalisations</h4>
          <div className="space-y-2">
            {stats.recent_achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="text-lg">
                  {'point_type' in achievement ? (achievement as any).point_type?.icon : (achievement as any).badge?.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {'point_type' in achievement 
                      ? `+${(achievement as any).points} points - ${(achievement as any).point_type?.name}`
                      : (achievement as any).badge?.name
                    }
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(achievement.earned_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
