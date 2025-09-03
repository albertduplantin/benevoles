'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GamificationDashboard as GamificationDashboardType, UserGamificationStats, LeaderboardEntry, Challenge, ChallengeProgress } from '@/lib/types'
import { ButtonSpinner } from '@/components/ui/Spinner'

interface GamificationDashboardProps {
  userId: string
}

export default function GamificationDashboard({ userId }: GamificationDashboardProps) {
  const [dashboard, setDashboard] = useState<GamificationDashboardType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'stats' | 'challenges' | 'leaderboard'>('stats')
  const supabase = createClient()

  useEffect(() => {
    loadDashboard()
  }, [userId])

  const loadDashboard = async () => {
    try {
      setIsLoading(true)
      
      // Charger les statistiques de l'utilisateur
      const userStats = await loadUserStats()
      
      // Charger les défis disponibles
      const availableChallenges = await loadAvailableChallenges()
      
      // Charger les progrès des défis de l'utilisateur
      const userChallenges = await loadUserChallenges()
      
      // Charger les notifications récentes
      const recentNotifications = await loadRecentNotifications()
      
      // Charger le leaderboard
      const leaderboard = await loadLeaderboard()
      
      setDashboard({
        user_stats: userStats,
        available_challenges: availableChallenges,
        user_challenges: userChallenges,
        recent_notifications: recentNotifications,
        leaderboard: leaderboard
      })
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserStats = async (): Promise<UserGamificationStats> => {
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
      .limit(5)

    const { data: recentBadges } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(5)

    const recent_achievements = [
      ...(recentPoints || []),
      ...(recentBadges || [])
    ].sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime()).slice(0, 5)

    return {
      total_points,
      badges_count: badges_count || 0,
      current_streaks: streaks || [],
      recent_achievements,
      leaderboard_position: 0 // Sera calculé dans loadLeaderboard
    }
  }

  const loadAvailableChallenges = async (): Promise<Challenge[]> => {
    const { data } = await supabase
      .from('challenges')
      .select(`
        *,
        reward_badge:badges(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    return data || []
  }

  const loadUserChallenges = async (): Promise<ChallengeProgress[]> => {
    const { data } = await supabase
      .from('challenge_progress')
      .select(`
        *,
        challenge:challenges(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return data || []
  }

  const loadRecentNotifications = async () => {
    const { data } = await supabase
      .from('gamification_notifications')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    return data || []
  }

  const loadLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    // Récupérer le top 10 des utilisateurs par points
    const { data: leaderboardData } = await supabase
      .rpc('get_leaderboard', { limit_count: 10 })

    if (!leaderboardData) return []

    // Enrichir avec les noms d'utilisateurs
    const userIds = leaderboardData.map((entry: any) => entry.user_id)
    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .in('id', userIds)

    const userMap = new Map(users?.map(user => [user.id, user]) || [])

    return leaderboardData.map((entry: any, index: number) => {
      const user = userMap.get(entry.user_id)
      return {
        user_id: entry.user_id,
        user_name: user ? `${user.first_name} ${user.last_name}` : 'Utilisateur',
        total_points: entry.total_points,
        badges_count: entry.badges_count,
        rank: index + 1
      }
    })
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100'
      case 'rare': return 'text-blue-600 bg-blue-100'
      case 'epic': return 'text-purple-600 bg-purple-100'
      case 'legendary': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ButtonSpinner />
        <span className="ml-2">Chargement du tableau de bord...</span>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Erreur lors du chargement du tableau de bord</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques principales */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">🏆 Tableau de Bord Gamification</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{dashboard.user_stats.total_points}</div>
            <div className="text-purple-200">Points Totaux</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{dashboard.user_stats.badges_count}</div>
            <div className="text-purple-200">Badges Gagnés</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {dashboard.user_stats.current_streaks.find(s => s.streak_type === 'days_active')?.current_streak || 0}
            </div>
            <div className="text-purple-200">Jours de Streak</div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'stats' 
              ? 'bg-white text-purple-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Statistiques
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'challenges' 
              ? 'bg-white text-purple-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🎯 Défis
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'leaderboard' 
              ? 'bg-white text-purple-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🏆 Classement
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Streaks */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🔥 Vos Streaks</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboard.user_stats.current_streaks.map((streak) => (
                <div key={streak.id} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{streak.current_streak}</div>
                  <div className="text-sm text-gray-600 capitalize">
                    {streak.streak_type.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-gray-500">
                    Meilleur: {streak.longest_streak}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Récentes réalisations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🌟 Récentes Réalisations</h3>
            <div className="space-y-3">
              {dashboard.user_stats.recent_achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">
                    {'point_type' in achievement ? (achievement as any).point_type?.icon : (achievement as any).badge?.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {'point_type' in achievement 
                        ? `+${(achievement as any).points} points - ${(achievement as any).point_type?.name}`
                        : (achievement as any).badge?.name
                      }
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(achievement.earned_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  {'badge' in achievement && (achievement as any).badge && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor((achievement as any).badge.rarity)}`}>
                      {(achievement as any).badge.rarity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'challenges' && (
        <div className="space-y-6">
          {/* Défis actifs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🎯 Défis Actifs</h3>
            <div className="space-y-4">
              {dashboard.available_challenges.map((challenge) => {
                const userProgress = dashboard.user_challenges.find(uc => uc.challenge_id === challenge.id)
                const progress = userProgress ? getProgressPercentage(userProgress.current_value, challenge.target_value) : 0
                
                return (
                  <div key={challenge.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{challenge.name}</h4>
                      <span className="text-sm text-gray-600">
                        {userProgress?.current_value || 0} / {challenge.target_value}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Récompense: {challenge.reward_points} points
                        {challenge.reward_badge && ` + Badge ${challenge.reward_badge.name}`}
                      </span>
                      {userProgress?.is_completed && (
                        <span className="text-green-600 font-medium">✅ Complété !</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">🏆 Classement</h3>
          <div className="space-y-3">
            {dashboard.leaderboard.map((entry, index) => (
              <div 
                key={entry.user_id} 
                className={`flex items-center space-x-4 p-3 rounded-lg ${
                  entry.user_id === userId ? 'bg-purple-50 border-2 border-purple-200' : 'bg-gray-50'
                }`}
              >
                <div className="text-2xl font-bold text-gray-600 w-8">
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${entry.rank}`}
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {entry.user_name}
                    {entry.user_id === userId && ' (Vous)'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {entry.badges_count} badges
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-600">{entry.total_points}</div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
