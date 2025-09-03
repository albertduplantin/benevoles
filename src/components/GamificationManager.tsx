'use client'

import { createClient } from '@/lib/supabase/client'

export class GamificationManager {
  private supabase = createClient()

  // Attribuer des points pour une mission complétée
  async awardMissionPoints(userId: string, missionId: number, isUrgent: boolean = false, isFirstMission: boolean = false) {
    try {
      // Points de base pour mission complétée
      await this.supabase.rpc('award_points', {
        user_id_param: userId,
        point_type_name: 'Mission Complétée',
        points_param: 1,
        source_type_param: 'mission_completion',
        source_id_param: missionId,
        description_param: `Mission complétée (ID: ${missionId})`
      })

      // Points bonus pour mission urgente
      if (isUrgent) {
        await this.supabase.rpc('award_points', {
          user_id_param: userId,
          point_type_name: 'Mission Urgente',
          points_param: 1,
          source_type_param: 'mission_completion',
          source_id_param: missionId,
          description_param: `Mission urgente complétée (ID: ${missionId})`
        })
      }

      // Points bonus pour première mission
      if (isFirstMission) {
        await this.supabase.rpc('award_points', {
          user_id_param: userId,
          point_type_name: 'Première Mission',
          points_param: 1,
          source_type_param: 'mission_completion',
          source_id_param: missionId,
          description_param: `Première mission complétée (ID: ${missionId})`
        })
      }

      // Mettre à jour les streaks
      await this.updateUserStreak(userId, 'missions')
      await this.updateUserStreak(userId, 'days_active')

      // Vérifier les badges
      await this.checkMissionBadges(userId)

      // Vérifier les défis
      await this.checkMissionChallenges(userId)

    } catch (error) {
      console.error('Erreur lors de l\'attribution des points de mission:', error)
    }
  }

  // Attribuer des points pour participation au chat
  async awardChatPoints(userId: string, messageCount: number = 1) {
    try {
      // Attribuer des points pour participation au chat (max 1 fois par jour)
      const today = new Date().toISOString().split('T')[0]
      
      const { data: existingPoints } = await this.supabase
        .from('user_points')
        .select('id')
        .eq('user_id', userId)
        .eq('source_type', 'chat_participation')
        .gte('earned_at', today)
        .limit(1)

      if (!existingPoints || existingPoints.length === 0) {
        await this.supabase.rpc('award_points', {
          user_id_param: userId,
          point_type_name: 'Participation Chat',
          points_param: 1,
          source_type_param: 'chat_participation',
          source_id_param: null,
          description_param: `Participation active au chat (${messageCount} messages)`
        })
      }

      // Vérifier les badges de chat
      await this.checkChatBadges(userId)

    } catch (error) {
      console.error('Erreur lors de l\'attribution des points de chat:', error)
    }
  }

  // Mettre à jour les streaks d'un utilisateur
  async updateUserStreak(userId: string, streakType: 'missions' | 'days_active' | 'weeks_active') {
    try {
      await this.supabase.rpc('update_user_streak', {
        user_id_param: userId,
        streak_type_param: streakType
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour du streak:', error)
    }
  }

  // Vérifier les badges liés aux missions
  async checkMissionBadges(userId: string) {
    try {
      // Compter les missions complétées
      const { count: missionCount } = await this.supabase
        .from('user_points')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('source_type', 'mission_completion')

      // Badge "Premier Pas" (1 mission)
      if (missionCount === 1) {
        await this.awardBadge(userId, 'Premier Pas')
      }

      // Badge "Bénévole Actif" (5 missions)
      if (missionCount === 5) {
        await this.awardBadge(userId, 'Bénévole Actif')
      }

      // Badge "Super Bénévole" (10 missions)
      if (missionCount === 10) {
        await this.awardBadge(userId, 'Super Bénévole')
      }

      // Badge "Héros Local" (25 missions)
      if (missionCount === 25) {
        await this.awardBadge(userId, 'Héros Local')
      }

      // Badge "Légende" (50 missions)
      if (missionCount === 50) {
        await this.awardBadge(userId, 'Légende')
      }

      // Vérifier les missions urgentes
      const { count: urgentMissions } = await this.supabase
        .from('user_points')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('source_type', 'mission_completion')
        .eq('point_type_id', (await this.getPointTypeId('Mission Urgente')))

      if (urgentMissions === 3) {
        await this.awardBadge(userId, 'Urgence')
      }

    } catch (error) {
      console.error('Erreur lors de la vérification des badges de mission:', error)
    }
  }

  // Vérifier les badges liés au chat
  async checkChatBadges(userId: string) {
    try {
      // Compter les messages de chat
      const { count: chatMessages } = await this.supabase
        .from('user_points')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('source_type', 'chat_participation')

      if (chatMessages === 100) {
        await this.awardBadge(userId, 'Chatteur')
      }

    } catch (error) {
      console.error('Erreur lors de la vérification des badges de chat:', error)
    }
  }

  // Vérifier les défis liés aux missions
  async checkMissionChallenges(userId: string) {
    try {
      // Récupérer les défis actifs liés aux missions
      const { data: challenges } = await this.supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .eq('type', 'mission_count')

      for (const challenge of challenges || []) {
        // Compter les missions de l'utilisateur
        const { count: missionCount } = await this.supabase
          .from('user_points')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('source_type', 'mission_completion')

        // Mettre à jour le progrès
        await this.updateChallengeProgress(userId, challenge.id, missionCount || 0)

        // Vérifier si le défi est complété
        if ((missionCount || 0) >= challenge.target_value) {
          await this.completeChallenge(userId, challenge.id)
        }
      }

    } catch (error) {
      console.error('Erreur lors de la vérification des défis de mission:', error)
    }
  }

  // Mettre à jour le progrès d'un défi
  async updateChallengeProgress(userId: string, challengeId: number, currentValue: number) {
    try {
      const { data: existingProgress } = await this.supabase
        .from('challenge_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .single()

      if (existingProgress) {
        // Mettre à jour le progrès existant
        await this.supabase
          .from('challenge_progress')
          .update({ current_value: currentValue })
          .eq('id', existingProgress.id)
      } else {
        // Créer un nouveau progrès
        await this.supabase
          .from('challenge_progress')
          .insert({
            user_id: userId,
            challenge_id: challengeId,
            current_value: currentValue
          })
      }

    } catch (error) {
      console.error('Erreur lors de la mise à jour du progrès du défi:', error)
    }
  }

  // Compléter un défi
  async completeChallenge(userId: string, challengeId: number) {
    try {
      // Marquer le défi comme complété
      await this.supabase
        .from('challenge_progress')
        .update({ 
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)

      // Récupérer les détails du défi
      const { data: challenge } = await this.supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single()

      if (challenge) {
        // Attribuer les points de récompense
        if (challenge.reward_points > 0) {
          await this.supabase.rpc('award_points', {
            user_id_param: userId,
            point_type_name: 'Défi Complété',
            points_param: 1,
            source_type_param: 'challenge_completed',
            source_id_param: challengeId,
            description_param: `Défi complété: ${challenge.name}`
          })
        }

        // Attribuer le badge de récompense
        if (challenge.reward_badge_id) {
          const { data: badge } = await this.supabase
            .from('badges')
            .select('name')
            .eq('id', challenge.reward_badge_id)
            .single()

          if (badge) {
            await this.awardBadge(userId, badge.name)
          }
        }

        // Créer une notification
        await this.supabase
          .from('gamification_notifications')
          .insert({
            user_id: userId,
            type: 'challenge_completed',
            title: 'Défi Complété !',
            message: `Félicitations ! Vous avez complété le défi "${challenge.name}" !`,
            points: challenge.reward_points
          })
      }

    } catch (error) {
      console.error('Erreur lors de la completion du défi:', error)
    }
  }

  // Attribuer un badge à un utilisateur
  async awardBadge(userId: string, badgeName: string) {
    try {
      // Récupérer l'ID du badge
      const { data: badge } = await this.supabase
        .from('badges')
        .select('id')
        .eq('name', badgeName)
        .single()

      if (badge) {
        // Vérifier si l'utilisateur n'a pas déjà ce badge
        const { data: existingBadge } = await this.supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', userId)
          .eq('badge_id', badge.id)
          .single()

        if (!existingBadge) {
          await this.supabase.rpc('award_badge', {
            user_id_param: userId,
            badge_id_param: badge.id
          })
        }
      }

    } catch (error) {
      console.error('Erreur lors de l\'attribution du badge:', error)
    }
  }

  // Récupérer l'ID d'un type de point
  async getPointTypeId(pointTypeName: string): Promise<number | null> {
    try {
      const { data } = await this.supabase
        .from('point_types')
        .select('id')
        .eq('name', pointTypeName)
        .single()

      return data?.id || null
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID du type de point:', error)
      return null
    }
  }
}

// Instance globale du gestionnaire de gamification
export const gamificationManager = new GamificationManager()
