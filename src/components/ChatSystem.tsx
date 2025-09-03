'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatRoomWithDetails, ChatMessageWithDetails, UserProfile } from '@/lib/types'
import { ButtonSpinner } from '@/components/ui/Spinner'

interface ChatSystemProps {
  user: UserProfile
  userRole?: string
}

export default function ChatSystem({ user, userRole }: ChatSystemProps) {
  const [rooms, setRooms] = useState<ChatRoomWithDetails[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomWithDetails | null>(null)
  const [messages, setMessages] = useState<ChatMessageWithDetails[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadNewMessage = useCallback(async (messageId: number) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          user:users(*),
          reply_to:chat_messages!reply_to_id(
            *,
            user:users(*)
          ),
          reactions:chat_reactions(
            *,
            user:users(*)
          )
        `)
        .eq('id', messageId)
        .single()

      if (error) throw error

      setMessages(prev => [...prev, data])
    } catch (error) {
      console.error('Erreur lors du chargement du nouveau message:', error)
    }
  }, [supabase])

  const loadMessages = useCallback(async (roomId: number) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          user:users(*),
          reply_to:chat_messages!reply_to_id(
            *,
            user:users(*)
          ),
          reactions:chat_reactions(
            *,
            user:users(*)
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
    }
  }, [supabase])

  const subscribeToMessages = useCallback((roomId: number) => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          // Charger le nouveau message avec ses relations
          loadNewMessage(payload.new.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, loadNewMessage])

  const loadRooms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          participants:chat_participants(
            *,
            user:users(*)
          ),
          mission:missions(*)
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Filtrer les rooms selon le rôle de l'utilisateur
      const filteredRooms = data?.filter(room => {
        if (room.type === 'admin' && userRole !== 'admin') return false
        if (room.type === 'responsable' && !['admin', 'responsable'].includes(userRole || '')) return false
        return true
      }) || []

      setRooms(filteredRooms)
      
      // Sélectionner la première room par défaut
      if (filteredRooms.length > 0 && !selectedRoom) {
        setSelectedRoom(filteredRooms[0])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, userRole, selectedRoom])

  // Charger les conversations
  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  // Charger les messages quand une room est sélectionnée
  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id)
      subscribeToMessages(selectedRoom.id)
    }
  }, [selectedRoom, loadMessages, subscribeToMessages])

  // Auto-scroll vers le bas
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedRoom || isSending) return

    setIsSending(true)
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: selectedRoom.id,
          user_id: user.id,
          message: newMessage.trim(),
          message_type: 'text'
        })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      alert('Erreur lors de l\'envoi du message')
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    } else {
      return date.toLocaleDateString('fr-FR')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ButtonSpinner />
        <span className="ml-2">Chargement des conversations...</span>
      </div>
    )
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Liste des conversations */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">💬 Conversations</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedRoom?.id === room.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {room.type === 'mission' ? '🎯' : 
                     room.type === 'global' ? '🌐' : 
                     room.type === 'admin' ? '🛠️' : '👨‍💼'} {room.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {room.participants?.length || 0} participants
                  </p>
                </div>
                {room.unread_count > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {room.unread_count}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone de chat */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* En-tête de la conversation */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedRoom.type === 'mission' ? '🎯' : 
                 selectedRoom.type === 'global' ? '🌐' : 
                 selectedRoom.type === 'admin' ? '🛠️' : '👨‍💼'} {selectedRoom.name}
              </h3>
              <p className="text-sm text-gray-600">
                {selectedRoom.participants?.length || 0} participants
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => {
                const showDate = index === 0 || 
                  formatDate(message.created_at) !== formatDate(messages[index - 1].created_at)
                
                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center text-xs text-gray-500 py-2">
                        {formatDate(message.created_at)}
                      </div>
                    )}
                    
                    <div className={`flex ${message.user_id === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.user_id === user.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        {message.user_id !== user.id && (
                          <div className="text-xs font-medium mb-1 opacity-75">
                            {message.user?.first_name} {message.user?.last_name}
                          </div>
                        )}
                        <div className="text-sm">{message.message}</div>
                        <div className={`text-xs mt-1 ${
                          message.user_id === user.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                          {message.is_edited && ' (modifié)'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Formulaire d'envoi */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSending ? <ButtonSpinner /> : '📤'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">💬</div>
              <p>Sélectionnez une conversation pour commencer</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
