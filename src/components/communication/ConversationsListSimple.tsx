'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import Avatar from '../Avatar';
import { formatTimeAgo } from '@/lib/dateUtils';

interface SimpleConversation {
  id: number;
  title: string | null;
  type: string;
  created_at: string;
  updated_at?: string;
  participants: any[];
  unread_count?: number;
  last_message?: {
    content: string;
    created_at: string;
    sender: {
      first_name: string;
      last_name: string;
    };
  };
}

interface ConversationsListSimpleProps {
  user: User;
  selectedConversation?: SimpleConversation;
  onConversationSelect: (conversation: SimpleConversation) => void;
  onNewConversation?: () => void;
  newConversationId?: string;
}

export default function ConversationsListSimple({ 
  user, 
  selectedConversation, 
  onConversationSelect, 
  onNewConversation,
  newConversationId
}: ConversationsListSimpleProps) {
  const [conversations, setConversations] = useState<SimpleConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  // Charger les conversations de manière simplifiée
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        // 1. Récupérer les conversations où l'utilisateur est participant
        const { data: userParticipations, error: participationsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        if (participationsError) {
          console.error('Erreur récupération participations:', participationsError);
          setConversations([]);
          return;
        }

        if (!userParticipations || userParticipations.length === 0) {
          setConversations([]);
          return;
        }

        const conversationIds = userParticipations.map(p => p.conversation_id);

        // 2. Récupérer les conversations de base
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('*')
          .in('id', conversationIds)
          .order('created_at', { ascending: false });

        if (conversationsError) {
          console.error('Erreur conversations:', conversationsError);
          setConversations([]);
          return;
        }

        // 3. Enrichir les conversations de manière plus simple
        const enrichedConversations = await Promise.all(
          (conversationsData || []).map(async (conv) => {
            try {
              // Récupérer les participants (sans les infos users pour éviter les erreurs)
              const { data: participantsData } = await supabase
                .from('conversation_participants')
                .select('user_id')
                .eq('conversation_id', conv.id);

              let participants: any[] = [];
              if (participantsData) {
                participants = participantsData.map(p => ({ user_id: p.user_id }));
              }

              // Récupérer les infos des utilisateurs séparément et de manière sécurisée
              const userIds = participants.map(p => p.user_id).filter(Boolean);
              let usersData: any[] = [];
              
              if (userIds.length > 0) {
                const { data: fetchedUsers, error: usersError } = await supabase
                  .from('users')
                  .select('id, first_name, last_name, avatar_url')
                  .in('id', userIds);

                if (!usersError && fetchedUsers) {
                  usersData = fetchedUsers;
                }
              }

              // Associer les infos users aux participants
              participants = participants.map(p => ({
                ...p,
                users: usersData.find(u => u.id === p.user_id)
              }));

              // Récupérer le nombre de messages non lus (de manière sécurisée)
              let unread_count = 0;
              const { data: unreadData, error: unreadError } = await supabase
                .from('conversation_unread_counts')
                .select('unread_count')
                .eq('conversation_id', conv.id)
                .eq('user_id', user.id)
                .maybeSingle(); // Utiliser maybeSingle au lieu de single

              if (!unreadError && unreadData) {
                unread_count = unreadData.unread_count || 0;
              }

              // Récupérer le dernier message (de manière sécurisée)
              let last_message = undefined;
              const { data: lastMessageData, error: messageError } = await supabase
                .from('messages')
                .select('content, created_at, sender_id')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(); // Utiliser maybeSingle au lieu de single

              if (!messageError && lastMessageData) {
                // Récupérer les infos de l'expéditeur
                const { data: senderData, error: senderError } = await supabase
                  .from('users')
                  .select('first_name, last_name')
                  .eq('id', lastMessageData.sender_id)
                  .maybeSingle(); // Utiliser maybeSingle au lieu de single

                if (!senderError && senderData) {
                  last_message = {
                    content: lastMessageData.content,
                    created_at: lastMessageData.created_at,
                    sender: senderData
                  };
                }
              }

              return {
                ...conv,
                participants,
                unread_count,
                last_message
              };
            } catch (error) {
              console.error(`Erreur pour conversation ${conv.id}:`, error);
              return {
                ...conv,
                participants: [],
                unread_count: 0
              };
            }
          })
        );

        setConversations(enrichedConversations);

        // Sélectionner automatiquement une nouvelle conversation
        if (newConversationId) {
          const newConv = enrichedConversations.find(conv => conv.id.toString() === newConversationId);
          if (newConv) {
            onConversationSelect(newConv);
          }
        }

      } catch (error) {
        console.error('Erreur générale conversations:', error);
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user.id, supabase, newConversationId, onConversationSelect]);

  // Filtrer les conversations par recherche
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      conv.title?.toLowerCase().includes(searchLower) ||
      conv.participants.some(p => 
        p.users && (
          p.users.first_name?.toLowerCase().includes(searchLower) ||
          p.users.last_name?.toLowerCase().includes(searchLower)
        )
      )
    );
  });

  // Obtenir le nom d'affichage de la conversation
  const getConversationDisplayName = (conv: SimpleConversation) => {
    if (conv.title) return conv.title;
    
    if (conv.type === 'direct') {
      const otherParticipant = conv.participants.find(p => p.user_id !== user.id);
      if (otherParticipant?.users) {
        return `${otherParticipant.users.first_name} ${otherParticipant.users.last_name}`;
      }
    }
    
    const names = conv.participants
      .filter(p => p.user_id !== user.id && p.users)
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
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>Aucune conversation trouvée</p>
            {onNewConversation && (
              <button
                onClick={onNewConversation}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer une conversation
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onConversationSelect(conv)}
              className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                selectedConversation?.id === conv.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {conv.type === 'direct' ? (
                    (() => {
                      const otherUser = conv.participants.find(p => p.user_id !== user.id)?.users;
                      return otherUser ? (
                        <Avatar
                          src={otherUser.avatar_url}
                          firstName={otherUser.first_name || ''}
                          lastName={otherUser.last_name || ''}
                          size="sm"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 text-xs">?</span>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">
                        {conv.participants.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {getConversationDisplayName(conv)}
                    </h3>
                    {conv.last_message && (
                      <span className="text-xs text-gray-500 ml-2">
                        {formatTimeAgo(conv.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  
                  {conv.last_message && (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      <span className="font-medium">
                        {conv.last_message.sender.first_name}:
                      </span>{' '}
                      {conv.last_message.content}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        conv.type === 'group' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {conv.type === 'group' ? '👥 Groupe' : '💬 Direct'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {conv.participants.length} participant{conv.participants.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {(conv.unread_count || 0) > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                        {conv.unread_count}
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