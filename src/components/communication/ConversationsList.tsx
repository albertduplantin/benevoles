'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { ConversationWithDetails } from '@/lib/types';

interface ConversationsListProps {
  user: User;
  selectedConversation?: ConversationWithDetails;
  onConversationSelect: (conversation: ConversationWithDetails) => void;
  onNewConversation?: () => void;
}

export default function ConversationsList({ 
  user, 
  selectedConversation, 
  onConversationSelect, 
  onNewConversation 
}: ConversationsListProps) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'direct' | 'group' | 'announcement'>('all');
  const supabase = createClient();

  // Charger les conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            participants:conversation_participants(
              *,
              users(*)
            ),
            last_message:messages(*)
          `)
          .eq('is_active', true)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        // Calculer les messages non lus pour chaque conversation
        const conversationsWithUnread = await Promise.all(
          (data || []).map(async (conv) => {
            // Trouver le participant actuel
            const currentParticipant = conv.participants.find((p: any) => p.user_id === user.id);
            
            if (!currentParticipant) return null;
            
            // Compter les messages non lus
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .gt('created_at', currentParticipant.last_read_at);

            // Récupérer le dernier message
            const { data: lastMessage } = await supabase
              .from('messages')
              .select(`
                *,
                sender:users!messages_sender_id_fkey(first_name, last_name, avatar_url)
              `)
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            return {
              ...conv,
              unread_count: count || 0,
              last_message: lastMessage
            };
          })
        );

        // Filtrer les conversations où l'utilisateur n'est pas participant
        const validConversations = conversationsWithUnread.filter(Boolean) as ConversationWithDetails[];
        setConversations(validConversations);
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user.id, supabase]);

  // Écouter les nouveaux messages pour mettre à jour les compteurs
  useEffect(() => {
    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Mettre à jour le compteur de messages non lus
          setConversations(prev => prev.map(conv => {
            if (conv.id === payload.new.conversation_id) {
              return {
                ...conv,
                unread_count: payload.new.sender_id !== user.id ? conv.unread_count + 1 : conv.unread_count
              };
            }
            return conv;
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, supabase]);

  // Filtrer les conversations
  const filteredConversations = conversations.filter(conv => {
    // Filtre par type
    if (filter !== 'all' && conv.type !== filter) return false;
    
    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        conv.title?.toLowerCase().includes(searchLower) ||
        conv.participants.some(p => 
          `${p.users.first_name} ${p.users.last_name}`.toLowerCase().includes(searchLower)
        )
      );
    }
    
    return true;
  });

  // Formatage de l'heure
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Hier';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  // Obtenir le nom d'affichage de la conversation
  const getConversationDisplayName = (conv: ConversationWithDetails) => {
    if (conv.title) return conv.title;
    
    // Pour les conversations directes, afficher le nom de l'autre participant
    if (conv.type === 'direct') {
      const otherParticipant = conv.participants.find(p => p.user_id !== user.id);
      if (otherParticipant) {
        return `${otherParticipant.users.first_name} ${otherParticipant.users.last_name}`;
      }
    }
    
    // Pour les groupes, lister les participants
    const names = conv.participants
      .filter(p => p.user_id !== user.id)
      .map(p => p.users.first_name)
      .slice(0, 3)
      .join(', ');
    
    return names || 'Conversation';
  };

  if (isLoading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* En-tête */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          {onNewConversation && (
            <button
              onClick={onNewConversation}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Nouvelle conversation"
            >
              ✏️
            </button>
          )}
        </div>
        
        {/* Barre de recherche */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Filtres */}
        <div className="flex space-x-1">
          {[
            { key: 'all', label: 'Tous', icon: '💬' },
            { key: 'direct', label: 'Direct', icon: '👥' },
            { key: 'group', label: 'Groupes', icon: '👥' },
            { key: 'announcement', label: 'Annonces', icon: '📢' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as typeof filter)}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {filterOption.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm">Aucune conversation trouvée</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onConversationSelect(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {getConversationDisplayName(conversation)}
                    </h3>
                    {conversation.last_message && (
                      <span className="text-xs text-gray-500 ml-2">
                        {formatTime(conversation.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  
                  {conversation.last_message && (
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.last_message.sender_id === user.id ? 'Vous: ' : ''}
                      {conversation.last_message.content}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                      conversation.type === 'direct' 
                        ? 'bg-blue-100 text-blue-800'
                        : conversation.type === 'group'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {conversation.type === 'direct' ? '👥' : 
                       conversation.type === 'group' ? '👥' : '📢'}
                    </span>
                    
                    {conversation.unread_count > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 