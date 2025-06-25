'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface MessagesUnreadBadgeProps {
  userId: string;
}

export default function MessagesUnreadBadge({ userId }: MessagesUnreadBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        // Récupérer le total des messages non lus pour l'utilisateur
        const { data, error } = await supabase
          .from('conversation_unread_counts')
          .select('unread_count')
          .eq('user_id', userId);

        if (error) {
          console.error('Erreur lors du chargement des messages non lus:', error);
          return;
        }

        // Calculer le total
        const totalUnread = (data || []).reduce((sum, item) => sum + (item.unread_count || 0), 0);
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error('Erreur générale messages non lus:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnreadCount();

    // Optionnel : Rafraîchir périodiquement (toutes les 30 secondes)
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [userId, supabase]);

  // Si pas de messages non lus, ne rien afficher
  if (isLoading || unreadCount === 0) {
    return (
      <Link 
        href="/communication"
        className="group flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-200 relative overflow-hidden"
      >
        <span className="text-base group-hover:scale-110 transition-transform duration-200">💬</span>
        <span className="hidden lg:inline">Communication</span>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"></div>
      </Link>
    );
  }

  return (
    <Link 
      href="/communication"
      className="group flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-200 relative overflow-hidden"
    >
      <div className="relative">
        <span className="text-base group-hover:scale-110 transition-transform duration-200">💬</span>
        {/* Badge de notification */}
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      </div>
      <span className="hidden lg:inline">Communication</span>
      {/* Indicateur supplémentaire pour desktop */}
      <span className="hidden lg:inline text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
        {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"></div>
    </Link>
  );
} 