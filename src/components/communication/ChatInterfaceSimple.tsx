'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import Avatar from '../Avatar';
import { formatMessageTime } from '@/lib/dateUtils';

interface SimpleMessage {
  id: number;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface SimpleConversation {
  id: number;
  title: string | null;
  type: string;
  participants: any[];
}

interface ChatInterfaceSimpleProps {
  user: User;
  selectedConversation?: SimpleConversation;
}

interface ConversationParticipant {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  email?: string;
}

export default function ChatInterfaceSimple({ user, selectedConversation }: ChatInterfaceSimpleProps) {
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [conversationParticipants, setConversationParticipants] = useState<ConversationParticipant[]>([]);
  const [conversationCreatedAt, setConversationCreatedAt] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Faire défiler vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Charger les informations de la conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchConversationInfo = async () => {
      try {
        // Récupérer les informations détaillées de la conversation
        const { data: conversationData, error: convError } = await supabase
          .from('conversations')
          .select('created_at')
          .eq('id', selectedConversation.id)
          .single();

        if (convError) {
          console.error('Erreur conversation:', convError);
          return;
        }

        if (conversationData) {
          setConversationCreatedAt(conversationData.created_at);
        }

        // Récupérer les participants avec leurs informations complètes
        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', selectedConversation.id);

        if (participantsError) {
          console.error('Erreur participants:', participantsError);
          return;
        }

        if (participantsData && participantsData.length > 0) {
          // Récupérer les infos des users séparément pour éviter les erreurs de jointure
          const userIds = participantsData.map(p => p.user_id);
          
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, first_name, last_name, avatar_url, email')
            .in('id', userIds);

          if (usersError) {
            console.error('Erreur users:', usersError);
            return;
          }

          if (usersData) {
            setConversationParticipants(usersData);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des infos de conversation:', error);
      }
    };

    fetchConversationInfo();
  }, [selectedConversation, supabase]);

  // Charger les messages de manière simplifiée
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id, content, sender_id, created_at')
          .eq('conversation_id', selectedConversation.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Erreur lors du chargement des messages:', error);
          setMessages([]);
          return;
        }

        if (!data || data.length === 0) {
          setMessages([]);
          return;
        }

        // Récupérer les infos des expéditeurs séparément pour éviter les erreurs
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const { data: sendersData, error: sendersError } = await supabase
          .from('users')
          .select('id, first_name, last_name, avatar_url')
          .in('id', senderIds);

        if (sendersError) {
          console.error('Erreur senders:', sendersError);
          setMessages(data.map(msg => ({ ...msg, sender: undefined })));
          return;
        }

        // Associer les expéditeurs aux messages
        const messagesWithSenders = data.map(message => ({
          ...message,
          sender: sendersData?.find(sender => sender.id === message.sender_id)
        }));

        // Marquer la conversation comme lue
        try {
          await supabase.rpc('mark_conversation_as_read', {
            p_conversation_id: selectedConversation.id,
            p_user_id: user.id
          });
        } catch (error) {
          console.error('Erreur marquage lu:', error);
          // Ne pas bloquer l'affichage des messages pour cette erreur
        }

        setMessages(messagesWithSenders);
      } catch (error) {
        console.error('Erreur générale messages:', error);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [selectedConversation, supabase, user.id]);

  // Scroller vers le bas quand les messages changent
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Envoyer un message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isLoading) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Vider le champ immédiatement pour une meilleure UX
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: messageContent,
          message_type: 'text'
        });

      if (error) {
        console.error('Erreur envoi message:', error);
        setNewMessage(messageContent); // Restaurer le message en cas d'erreur
        return;
      }

      // Recharger les messages après envoi sans reload complet
      const { data: newMessages, error: fetchError } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });

      if (!fetchError && newMessages) {
        // Récupérer les infos des expéditeurs
        const senderIds = [...new Set(newMessages.map(m => m.sender_id))];
        const { data: sendersData } = await supabase
          .from('users')
          .select('id, first_name, last_name, avatar_url')
          .in('id', senderIds);

        const messagesWithSenders = newMessages.map(message => ({
          ...message,
          sender: sendersData?.find(sender => sender.id === message.sender_id)
        }));

        setMessages(messagesWithSenders);
      }

    } catch (error) {
      console.error('Erreur générale envoi:', error);
      setNewMessage(messageContent); // Restaurer le message en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  };

  // Obtenir l'utilisateur actuel pour l'avatar
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data } = await supabase
        .from('users')
        .select('first_name, last_name, avatar_url')
        .eq('id', user.id)
        .single();
      setCurrentUser(data);
    };
    fetchCurrentUser();
  }, [user.id, supabase]);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Sélectionnez une conversation
          </h3>
          <p className="text-gray-600">
            Choisissez une conversation pour commencer à discuter
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedConversation.title || 'Conversation'}
            </h2>
            <p className="text-sm text-gray-500">
              {conversationParticipants.length} participant(s)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              selectedConversation.type === 'direct' 
                ? 'bg-blue-100 text-blue-800'
                : selectedConversation.type === 'group'
                ? 'bg-green-100 text-green-800'
                : 'bg-purple-100 text-purple-800'
            }`}>
              {selectedConversation.type === 'direct' ? '👥 Direct' : 
               selectedConversation.type === 'group' ? '👥 Groupe' : '📢 Annonce'}
            </span>
            
            {/* Bouton Info */}
            <button
              onClick={() => setShowConversationInfo(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Informations de la conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal des informations de conversation */}
      {showConversationInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            {/* En-tête du modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Informations de la conversation
              </h3>
              <button
                onClick={() => setShowConversationInfo(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenu du modal */}
            <div className="p-6">
              {/* Titre de la conversation */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Titre</h4>
                <p className="text-gray-900">{selectedConversation.title || 'Sans titre'}</p>
              </div>

              {/* Type de conversation */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Type</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedConversation.type === 'direct' 
                    ? 'bg-blue-100 text-blue-800'
                    : selectedConversation.type === 'group'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {selectedConversation.type === 'direct' ? '👥 Direct' : 
                   selectedConversation.type === 'group' ? '👥 Groupe' : '📢 Annonce'}
                </span>
              </div>

              {/* Date de création */}
              {conversationCreatedAt && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Créée le</h4>
                  <p className="text-gray-900">
                    {new Date(conversationCreatedAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              {/* Liste des participants */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Participants ({conversationParticipants.length})
                </h4>
                <div className="space-y-3">
                  {conversationParticipants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3">
                      <Avatar
                        src={participant.avatar_url}
                        firstName={participant.first_name}
                        lastName={participant.last_name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {participant.first_name} {participant.last_name}
                          {participant.id === user.id && (
                            <span className="ml-2 text-xs text-blue-600 font-medium">(Vous)</span>
                          )}
                        </p>
                        {participant.email && (
                          <p className="text-xs text-gray-500 truncate">
                            {participant.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pied du modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <button
                onClick={() => setShowConversationInfo(false)}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">💬</div>
            <p>Aucun message pour le moment</p>
            <p className="text-sm">Soyez le premier à écrire !</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                message.sender_id === user.id ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.sender_id === user.id ? (
                    // Avatar de l'utilisateur actuel
                    currentUser && (
                      <Avatar
                        src={currentUser.avatar_url}
                        firstName={currentUser.first_name}
                        lastName={currentUser.last_name}
                        size="sm"
                      />
                    )
                  ) : (
                    // Avatar de l'expéditeur
                    message.sender && (
                      <Avatar
                        src={message.sender.avatar_url}
                        firstName={message.sender.first_name}
                        lastName={message.sender.last_name}
                        size="sm"
                      />
                    )
                  )}
                </div>

                {/* Bulle de message */}
                <div className={`px-4 py-2 rounded-lg ${
                  message.sender_id === user.id
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-900 rounded-bl-none'
                }`}>
                  {message.sender_id !== user.id && message.sender && (
                    <div className="text-xs font-medium mb-1 opacity-75">
                      {message.sender.first_name} {message.sender.last_name}
                    </div>
                  )}
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {formatMessageTime(message.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '...' : '📤'}
          </button>
        </div>
      </form>
    </div>
  );
} 