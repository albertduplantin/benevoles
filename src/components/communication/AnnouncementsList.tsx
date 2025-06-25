'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { AnnouncementWithCreator } from '@/lib/types';

interface AnnouncementsListProps {
  user: User;
  userRole: string;
}

export default function AnnouncementsList({ user, userRole }: AnnouncementsListProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const supabase = createClient();

  // Charger les annonces
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select(`
            *,
            creator:users!announcements_created_by_fkey(first_name, last_name),
            announcement_reads(user_id)
          `)
          .eq('is_active', true)
          .contains('target_roles', [userRole])
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Marquer si l'annonce est lue par l'utilisateur actuel
        const announcementsWithReadStatus = (data || []).map(announcement => ({
          ...announcement,
          is_read: announcement.announcement_reads?.some((read: any) => read.user_id === user.id) || false
        }));

        setAnnouncements(announcementsWithReadStatus);
      } catch (error) {
        console.error('Erreur lors du chargement des annonces:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [user.id, userRole, supabase]);

  // Écouter les nouvelles annonces
  useEffect(() => {
    const channel = supabase
      .channel('announcements-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
        },
        (payload) => {
          // Vérifier si l'annonce concerne le rôle de l'utilisateur
          if (payload.new.target_roles.includes(userRole)) {
            fetchAnnouncementDetails(payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole, supabase]);

  // Récupérer les détails d'une annonce
  const fetchAnnouncementDetails = async (announcementId: number) => {
    try {
      const { data } = await supabase
        .from('announcements')
        .select(`
          *,
          creator:users!announcements_created_by_fkey(first_name, last_name),
          announcement_reads(user_id)
        `)
        .eq('id', announcementId)
        .single();

      if (data) {
        const announcementWithReadStatus = {
          ...data,
          is_read: data.announcement_reads?.some((read: any) => read.user_id === user.id) || false
        };

        setAnnouncements(prev => [announcementWithReadStatus, ...prev]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'annonce:', error);
    }
  };

  // Marquer une annonce comme lue
  const markAsRead = async (announcementId: number) => {
    try {
      const { error } = await supabase
        .from('announcement_reads')
        .upsert({
          announcement_id: announcementId,
          user_id: user.id
        }, {
          onConflict: 'announcement_id,user_id'
        });

      if (error) throw error;

      // Mettre à jour l'état local
      setAnnouncements(prev => prev.map(ann => 
        ann.id === announcementId ? { ...ann, is_read: true } : ann
      ));
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  // Filtrer les annonces
  const filteredAnnouncements = announcements.filter(announcement => {
    if (filter === 'unread' && announcement.is_read) return false;
    if (filter === 'urgent' && announcement.priority !== 'urgent') return false;
    return true;
  });

  // Formatage de la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)} heure${Math.floor(diffInHours) > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Obtenir la couleur de priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtenir l'icône de priorité
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '⚠️';
      case 'normal': return 'ℹ️';
      case 'low': return '💬';
      default: return 'ℹ️';
    }
  };

  const unreadCount = announcements.filter(a => !a.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec filtres */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold text-gray-900">Annonces</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-sm rounded-full h-6 w-6 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'Toutes', count: announcements.length },
            { key: 'unread', label: 'Non lues', count: unreadCount },
            { key: 'urgent', label: 'Urgentes', count: announcements.filter(a => a.priority === 'urgent').length }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as typeof filter)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {filterOption.label} ({filterOption.count})
            </button>
          ))}
        </div>
      </div>

      {/* Liste des annonces */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune annonce
            </h3>
            <p className="text-gray-600">
              {filter === 'unread' 
                ? 'Toutes les annonces ont été lues !' 
                : filter === 'urgent'
                ? 'Aucune annonce urgente pour le moment.'
                : 'Aucune annonce disponible.'}
            </p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-white rounded-lg border p-6 transition-all hover:shadow-md ${
                !announcement.is_read ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getPriorityIcon(announcement.priority)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {announcement.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(announcement.priority)}`}>
                        {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Par {announcement.creator.first_name} {announcement.creator.last_name}
                      </span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        {formatDate(announcement.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {!announcement.is_read && (
                  <button
                    onClick={() => markAsRead(announcement.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Marquer comme lu
                  </button>
                )}
              </div>
              
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </div>
              
              {announcement.expires_at && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-yellow-600 mr-2">⏰</span>
                    <span className="text-sm text-yellow-800">
                      Expire le {new Date(announcement.expires_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 