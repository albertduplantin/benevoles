'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface SimpleConversation {
  id: number;
  title: string | null;
  type: string;
  created_at: string;
  participants: any[];
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
        // Requête simplifiée pour éviter les erreurs
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (convError) {
          console.error('Erreur conversations:', convError);
          setConversations([]);
          return;
        }

        // Pour chaque conversation, récupérer les participants séparément
        const conversationsWithParticipants = await Promise.all(
          (convData || []).map(async (conv) => {
            const { data: participants, error: partError } = await supabase
              .from('conversation_participants')
              .select(`
                *,
                users!conversation_participants_user_id_fkey(first_name, last_name)
              `)
              .eq('conversation_id', conv.id);

            if (partError) {
              console.error('Erreur participants:', partError);
              return { ...conv, participants: [] };
            }

            // Vérifier si l'utilisateur actuel est participant
            const isUserParticipant = participants?.some(p => p.user_id === user.id);
            if (!isUserParticipant) {
              return null;
            }

            return { ...conv, participants: participants || [] };
          })
        );

        const validConversations = conversationsWithParticipants.filter(Boolean) as SimpleConversation[];
        setConversations(validConversations);

        // Sélectionner automatiquement une nouvelle conversation
        if (newConversationId) {
          const newConv = validConversations.find(conv => conv.id.toString() === newConversationId);
          if (newConv) {
            onConversationSelect(newConv);
          }
        }

      } catch (error) {
        console.error('Erreur générale:', error);
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
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm">Aucune conversation trouvée</p>
            {onNewConversation && (
              <button
                onClick={onNewConversation}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Créer une conversation
              </button>
            )}
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
                  </div>
                  
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
                    
                    <span className="text-xs text-gray-500">
                      {conversation.participants.length} participant(s)
                    </span>
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