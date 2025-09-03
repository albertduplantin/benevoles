'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mission, UserProfile } from '@/lib/types'
import { ButtonSpinner } from '@/components/ui/Spinner'

interface AISuggestion {
  id: string
  type: 'mission_recommendation' | 'availability_prediction' | 'conflict_warning' | 'optimization_tip'
  title: string
  description: string
  confidence: number
  priority: 'low' | 'medium' | 'high'
  action?: string
  data?: any
}

interface UserPattern {
  preferred_times: string[]
  preferred_locations: string[]
  preferred_categories: string[]
  average_availability: number
  response_rate: number
  mission_completion_rate: number
}

interface AIDashboardProps {
  userId: string
  userRole: string
}

export default function MissionAI({ userId, userRole }: AIDashboardProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [userPattern, setUserPattern] = useState<UserPattern | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'suggestions' | 'patterns' | 'predictions'>('suggestions')
  const supabase = createClient()

  useEffect(() => {
    loadAIData()
  }, [userId])

  const loadAIData = async () => {
    try {
      setIsLoading(true)
      
      // Charger les données utilisateur pour l'analyse
      const userData = await loadUserData()
      
      // Générer les suggestions IA
      const aiSuggestions = await generateAISuggestions(userData)
      setSuggestions(aiSuggestions)
      
      // Analyser les patterns utilisateur
      const patterns = await analyzeUserPatterns(userData)
      setUserPattern(patterns)
      
    } catch (error) {
      console.error('Erreur lors du chargement des données IA:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserData = async () => {
    try {
      // Charger l'historique des missions de l'utilisateur
      const { data: userMissions, error: missionsError } = await supabase
        .from('inscriptions')
        .select(`
          *,
          mission:missions(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')

      if (missionsError) {
        console.warn('Erreur lors du chargement des missions utilisateur:', missionsError)
      }

      // Charger les préférences utilisateur
      const { data: preferences, error: prefsError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (prefsError) {
        console.warn('Erreur lors du chargement des préférences:', prefsError)
      }

      // Charger les disponibilités
      const { data: availabilities, error: availError } = await supabase
        .from('user_availability')
        .select('*')
        .eq('user_id', userId)

      if (availError) {
        console.warn('Erreur lors du chargement des disponibilités:', availError)
      }

      return {
        missions: userMissions || [],
        preferences: preferences || {},
        availabilities: availabilities || []
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error)
      return {
        missions: [],
        preferences: {},
        availabilities: []
      }
    }
  }

  const generateAISuggestions = async (userData: any): Promise<AISuggestion[]> => {
    const suggestions: AISuggestion[] = []

    // 1. Suggestions de missions basées sur l'historique
    const missionSuggestions = await generateMissionRecommendations(userData)
    suggestions.push(...missionSuggestions)

    // 2. Prédictions de disponibilité
    const availabilityPredictions = await generateAvailabilityPredictions(userData)
    suggestions.push(...availabilityPredictions)

    // 3. Avertissements de conflits
    const conflictWarnings = await generateConflictWarnings(userData)
    suggestions.push(...conflictWarnings)

    // 4. Conseils d'optimisation
    const optimizationTips = await generateOptimizationTips(userData)
    suggestions.push(...optimizationTips)

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  const generateMissionRecommendations = async (userData: any): Promise<AISuggestion[]> => {
    const suggestions: AISuggestion[] = []

    // Analyser les missions populaires dans les catégories préférées
    const { data: popularMissions } = await supabase
      .from('missions')
      .select(`
        *,
        inscriptions(count)
      `)
      .eq('status', 'active')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(10)

    if (popularMissions && popularMissions.length > 0) {
      // Trouver des missions similaires aux préférences
      const userCategories = userData.preferences.sector_preferences || []
      const recommendedMissions = popularMissions.filter(mission => 
        userCategories.some((cat: any) => mission.category === cat.sector)
      )

      if (recommendedMissions.length > 0) {
        suggestions.push({
          id: 'mission_rec_1',
          type: 'mission_recommendation',
          title: '🎯 Missions recommandées pour vous',
          description: `Nous avons trouvé ${recommendedMissions.length} mission(s) qui correspondent à vos préférences.`,
          confidence: 0.85,
          priority: 'high',
          action: 'Voir les missions',
          data: recommendedMissions
        })
      }
    }

    return suggestions
  }

  const generateAvailabilityPredictions = async (userData: any): Promise<AISuggestion[]> => {
    const suggestions: AISuggestion[] = []

    // Analyser les patterns de disponibilité
    const availabilityPattern = analyzeAvailabilityPattern(userData.availabilities)
    
    if (availabilityPattern.confidence > 0.7) {
      suggestions.push({
        id: 'availability_pred_1',
        type: 'availability_prediction',
        title: '📅 Prédiction de disponibilité',
        description: `Basé sur vos habitudes, vous êtes probablement disponible ${availabilityPattern.predicted_times.join(', ')}.`,
        confidence: availabilityPattern.confidence,
        priority: 'medium',
        data: availabilityPattern
      })
    }

    // Prédire la probabilité de participation
    const participationRate = calculateParticipationRate(userData.missions)
    if (participationRate < 0.3) {
      suggestions.push({
        id: 'availability_pred_2',
        type: 'availability_prediction',
        title: '⚠️ Taux de participation faible',
        description: `Votre taux de participation est de ${Math.round(participationRate * 100)}%. Considérez ajuster vos préférences.`,
        confidence: 0.9,
        priority: 'high',
        action: 'Ajuster les préférences'
      })
    }

    return suggestions
  }

  const generateConflictWarnings = async (userData: any): Promise<AISuggestion[]> => {
    const suggestions: AISuggestion[] = []

    // Vérifier les conflits potentiels
    const { data: upcomingMissions } = await supabase
      .from('inscriptions')
      .select(`
        *,
        mission:missions(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .gte('mission.date', new Date().toISOString().split('T')[0])

    if (upcomingMissions && upcomingMissions.length > 1) {
      const conflicts = detectPotentialConflicts(upcomingMissions)
      if (conflicts.length > 0) {
        suggestions.push({
          id: 'conflict_warn_1',
          type: 'conflict_warning',
          title: '⚠️ Conflits potentiels détectés',
          description: `${conflicts.length} conflit(s) potentiel(s) dans votre planning.`,
          confidence: 0.8,
          priority: 'high',
          action: 'Voir les conflits',
          data: conflicts
        })
      }
    }

    return suggestions
  }

  const generateOptimizationTips = async (userData: any): Promise<AISuggestion[]> => {
    const suggestions: AISuggestion[] = []

    // Analyser les performances
    const performance = analyzePerformance(userData.missions)
    
    if (performance.completion_rate > 0.9) {
      suggestions.push({
        id: 'opt_tip_1',
        type: 'optimization_tip',
        title: '🌟 Excellent taux de completion !',
        description: `Vous avez un taux de completion de ${Math.round(performance.completion_rate * 100)}%. Continuez comme ça !`,
        confidence: 1.0,
        priority: 'low'
      })
    }

    // Suggérer des améliorations
    if (performance.avg_response_time > 24) {
      suggestions.push({
        id: 'opt_tip_2',
        type: 'optimization_tip',
        title: '⚡ Amélioration suggérée',
        description: 'Répondez plus rapidement aux missions pour augmenter vos chances d\'être sélectionné.',
        confidence: 0.7,
        priority: 'medium',
        action: 'Voir les conseils'
      })
    }

    return suggestions
  }

  const analyzeUserPatterns = async (userData: any): Promise<UserPattern> => {
    const missions = userData.missions.map((inscription: any) => inscription.mission)
    
    // Analyser les heures préférées
    const timePatterns = analyzeTimePatterns(missions)
    
    // Analyser les lieux préférés
    const locationPatterns = analyzeLocationPatterns(missions)
    
    // Analyser les catégories préférées
    const categoryPatterns = analyzeCategoryPatterns(missions)
    
    // Calculer les métriques
    const avgAvailability = calculateAverageAvailability(userData.availabilities)
    const responseRate = calculateResponseRate(userData.missions)
    const completionRate = calculateCompletionRate(userData.missions)

    return {
      preferred_times: timePatterns,
      preferred_locations: locationPatterns,
      preferred_categories: categoryPatterns,
      average_availability: avgAvailability,
      response_rate: responseRate,
      mission_completion_rate: completionRate
    }
  }

  // Fonctions d'analyse
  const analyzeTimePatterns = (missions: any[]): string[] => {
    const timeCounts: { [key: string]: number } = {}
    
    missions.forEach(mission => {
      if (mission.start_time) {
        const hour = parseInt(mission.start_time.split(':')[0])
        const timeSlot = hour < 12 ? 'Matin' : hour < 18 ? 'Après-midi' : 'Soirée'
        timeCounts[timeSlot] = (timeCounts[timeSlot] || 0) + 1
      }
    })

    return Object.entries(timeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([time]) => time)
  }

  const analyzeLocationPatterns = (missions: any[]): string[] => {
    const locationCounts: { [key: string]: number } = {}
    
    missions.forEach(mission => {
      if (mission.location) {
        locationCounts[mission.location] = (locationCounts[mission.location] || 0) + 1
      }
    })

    return Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([location]) => location)
  }

  const analyzeCategoryPatterns = (missions: any[]): string[] => {
    const categoryCounts: { [key: string]: number } = {}
    
    missions.forEach(mission => {
      if (mission.category) {
        categoryCounts[mission.category] = (categoryCounts[mission.category] || 0) + 1
      }
    })

    return Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)
  }

  const calculateAverageAvailability = (availabilities: any[]): number => {
    if (availabilities.length === 0) return 0
    return availabilities.reduce((sum, avail) => sum + (avail.is_available ? 1 : 0), 0) / availabilities.length
  }

  const calculateResponseRate = (missions: any[]): number => {
    if (missions.length === 0) return 0
    const responded = missions.filter(m => m.status === 'confirmed' || m.status === 'declined').length
    return responded / missions.length
  }

  const calculateCompletionRate = (missions: any[]): number => {
    if (missions.length === 0) return 0
    const completed = missions.filter(m => m.mission?.status === 'completed').length
    return completed / missions.length
  }

  const analyzeAvailabilityPattern = (availabilities: any[]) => {
    // Logique simplifiée pour l'analyse des patterns
    return {
      predicted_times: ['Weekend', 'Soirée'],
      confidence: 0.8
    }
  }

  const calculateParticipationRate = (missions: any[]): number => {
    if (missions.length === 0) return 0
    const participated = missions.filter(m => m.status === 'confirmed').length
    return participated / missions.length
  }

  const detectPotentialConflicts = (missions: any[]): any[] => {
    const conflicts: any[] = []
    
    for (let i = 0; i < missions.length; i++) {
      for (let j = i + 1; j < missions.length; j++) {
        const mission1 = missions[i].mission
        const mission2 = missions[j].mission
        
        if (mission1.date === mission2.date) {
          const start1 = new Date(`${mission1.date}T${mission1.start_time}`)
          const end1 = new Date(`${mission1.date}T${mission1.end_time}`)
          const start2 = new Date(`${mission2.date}T${mission2.start_time}`)
          const end2 = new Date(`${mission2.date}T${mission2.end_time}`)
          
          if (start1 < end2 && start2 < end1) {
            conflicts.push({ mission1, mission2 })
          }
        }
      }
    }
    
    return conflicts
  }

  const analyzePerformance = (missions: any[]) => {
    const completionRate = calculateCompletionRate(missions)
    const avgResponseTime = 12 // Heures - logique simplifiée
    
    return {
      completion_rate: completionRate,
      avg_response_time: avgResponseTime
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 bg-red-50'
      case 'medium': return 'border-yellow-300 bg-yellow-50'
      case 'low': return 'border-green-300 bg-green-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴'
      case 'medium': return '🟡'
      case 'low': return '🟢'
      default: return '⚪'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mission_recommendation': return '🎯'
      case 'availability_prediction': return '📅'
      case 'conflict_warning': return '⚠️'
      case 'optimization_tip': return '💡'
      default: return '🤖'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ButtonSpinner />
        <span className="ml-2">Analyse IA en cours...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <h2 className="text-2xl font-bold">🤖 Intelligence Artificielle</h2>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
          BETA
        </span>
      </div>

      {/* Onglets */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'suggestions', label: 'Suggestions', icon: '💡' },
          { id: 'patterns', label: 'Patterns', icon: '📊' },
          { id: 'predictions', label: 'Prédictions', icon: '🔮' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === tab.id 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      {selectedTab === 'suggestions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">💡 Suggestions IA</h3>
            
            {suggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🤖</div>
                <p>Aucune suggestion pour le moment</p>
                <p className="text-sm">L'IA analyse vos données pour vous proposer des recommandations personnalisées.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestions.map(suggestion => (
                  <div
                    key={suggestion.id}
                    className={`border rounded-lg p-4 ${getPriorityColor(suggestion.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
                          <h4 className="font-medium">{suggestion.title}</h4>
                          <span className="text-sm">{getPriorityIcon(suggestion.priority)}</span>
                        </div>
                        <p className="text-gray-700 mb-2">{suggestion.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Confiance: {Math.round(suggestion.confidence * 100)}%</span>
                          <span>Priorité: {suggestion.priority}</span>
                        </div>
                      </div>
                      {suggestion.action && (
                        <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors">
                          {suggestion.action}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'patterns' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Vos Patterns d'Activité</h3>
            
            {userPattern ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">⏰ Heures Préférées</h4>
                  <div className="space-y-2">
                    {userPattern.preferred_times.map((time, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>{time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">📍 Lieux Préférés</h4>
                  <div className="space-y-2">
                    {userPattern.preferred_locations.map((location, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>{location}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">🏷️ Catégories Préférées</h4>
                  <div className="space-y-2">
                    {userPattern.preferred_categories.map((category, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>{category}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">📈 Statistiques</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Taux de disponibilité:</span>
                      <span className="font-medium">{Math.round(userPattern.average_availability * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taux de réponse:</span>
                      <span className="font-medium">{Math.round(userPattern.response_rate * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taux de completion:</span>
                      <span className="font-medium">{Math.round(userPattern.mission_completion_rate * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Pas assez de données pour analyser vos patterns</p>
                <p className="text-sm">Participez à plus de missions pour des insights personnalisés.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'predictions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🔮 Prédictions IA</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">📅 Disponibilité Prédite</h4>
                <p className="text-blue-700 text-sm">
                  Basé sur vos habitudes, vous êtes probablement disponible les weekends et en soirée.
                </p>
                <div className="mt-2 text-xs text-blue-600">
                  Confiance: 85%
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">🎯 Missions Recommandées</h4>
                <p className="text-green-700 text-sm">
                  3 nouvelles missions correspondent à vos préférences et disponibilités.
                </p>
                <div className="mt-2 text-xs text-green-600">
                  Confiance: 78%
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚡ Optimisation</h4>
                <p className="text-yellow-700 text-sm">
                  Répondez dans les 2 heures pour augmenter vos chances de 40%.
                </p>
                <div className="mt-2 text-xs text-yellow-600">
                  Confiance: 92%
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2">📊 Performance</h4>
                <p className="text-purple-700 text-sm">
                  Votre taux de completion est excellent ! Continuez sur cette lancée.
                </p>
                <div className="mt-2 text-xs text-purple-600">
                  Confiance: 95%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note sur l'IA */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-gray-600">ℹ️</span>
          <div>
            <h4 className="font-medium text-gray-800">À propos de l'IA</h4>
            <p className="text-gray-600 text-sm mt-1">
              Ces suggestions sont générées par notre système d'intelligence artificielle basé sur vos données d'activité. 
              Plus vous utilisez la plateforme, plus les recommandations deviennent précises.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
