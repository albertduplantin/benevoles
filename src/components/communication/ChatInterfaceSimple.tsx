'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface SimpleMessage {
  id: number;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
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

export default function ChatInterfaceSimple({ user, selectedConversation }: ChatInterfaceSimpleProps) {
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Faire défiler vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Charger les messages de manière simplifiée
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            sender_id,
            created_at
          `)
          .eq('conversation_id', selectedConversation.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Erreur lors du chargement des messages:', error);
          setMessages([]);
          return;
        }

        // Récupérer les infos des expéditeurs séparément
        const messagesWithSenders = await Promise.all(
          (data || []).map(async (message) => {
            const { data: senderData } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', message.sender_id)
              .single();

            return {
              ...message,
              sender: senderData || undefined
            };
          })
        );

        setMessages(messagesWithSenders);
      } catch (error) {
        console.error('Erreur générale messages:', error);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [selectedConversation, supabase]);

  // Scroller vers le bas quand les messages changent
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Envoyer un message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) {
        console.error('Erreur envoi message:', error);
        return;
      }

      setNewMessage('');
      
      // Recharger les messages après envoi
      setTimeout(() => {
        window.location.reload();
      }, 100);

    } catch (error) {
      console.error('Erreur générale envoi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Formatage du temps simplifié
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

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
              {selectedConversation.participants?.length || 0} participant(s)
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
          </div>
        </div>
      </div>

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
              className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender_id === user.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}>
                {message.sender_id !== user.id && message.sender && (
                  <div className="text-xs font-medium mb-1 opacity-75">
                    {message.sender.first_name} {message.sender.last_name}
                  </div>
                )}
                <div className="text-sm">{message.content}</div>
                <div className="text-xs opacity-75 mt-1">
                  {formatTime(message.created_at)}
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