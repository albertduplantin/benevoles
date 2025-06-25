'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/types';

interface NewConversationModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

interface SelectableUser {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url?: string;
}

type ModalStep = 'select-users' | 'write-message';

export default function NewConversationModal({ 
  user, 
  isOpen, 
  onClose, 
  onConversationCreated 
}: NewConversationModalProps) {
  const [users, setUsers] = useState<SelectableUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [conversationTitle, setConversationTitle] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [currentStep, setCurrentStep] = useState<ModalStep>('select-users');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const supabase = createClient();

  // Réinitialiser le modal quand il s'ouvre/ferme
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('select-users');
      setSelectedUsers([]);
      setConversationTitle('');
      setFirstMessage('');
      setSearchTerm('');
    }
  }, [isOpen]);

  // Charger la liste des utilisateurs
  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id, first_name, last_name, role, avatar_url')
            .neq('id', user.id)
            .order('first_name');

          if (error) throw error;
          setUsers(data || []);
        } catch (error) {
          console.error('Erreur lors du chargement des utilisateurs:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUsers();
    }
  }, [isOpen, user.id, supabase]);

  // Filtrer les utilisateurs par recherche
  const filteredUsers = users.filter(u => {
    const searchLower = searchTerm.toLowerCase();
    return (
      u.first_name.toLowerCase().includes(searchLower) ||
      u.last_name.toLowerCase().includes(searchLower) ||
      u.role.toLowerCase().includes(searchLower)
    );
  });

  // Gérer la sélection d'utilisateurs
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Passer à l'étape suivante
  const goToMessageStep = () => {
    if (selectedUsers.length > 0) {
      setCurrentStep('write-message');
    }
  };

  // Revenir à l'étape précédente
  const goBackToSelection = () => {
    setCurrentStep('select-users');
  };

  // Créer la conversation avec le premier message
  const createConversationWithMessage = async () => {
    if (selectedUsers.length === 0 || !firstMessage.trim()) return;

    setIsCreating(true);
    try {
      // Déterminer le type de conversation
      const isGroup = selectedUsers.length > 1;
      const type = isGroup ? 'group' : 'direct';
      
      // Créer la conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          title: isGroup ? conversationTitle || null : null,
          type,
          created_by: user.id
        })
        .select()
        .single();

      if (convError) throw convError;

      // Ajouter les participants (l'utilisateur actuel + les sélectionnés)
      const participants = [
        { conversation_id: conversation.id, user_id: user.id, role: 'member' },
        ...selectedUsers.map(userId => ({
          conversation_id: conversation.id,
          user_id: userId,
          role: 'member'
        }))
      ];

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      // Envoyer le premier message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content: firstMessage.trim(),
          type: 'text'
        });

      if (messageError) throw messageError;

      // Réinitialiser le formulaire
      setSelectedUsers([]);
      setConversationTitle('');
      setFirstMessage('');
      setSearchTerm('');
      setCurrentStep('select-users');
      
      // Notifier le parent et fermer le modal
      onConversationCreated(conversation.id);
      onClose();
      
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      alert('Erreur lors de la création de la conversation');
    } finally {
      setIsCreating(false);
    }
  };

  // Obtenir les badges de rôle
  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
      volunteer: { label: 'Bénévole', color: 'bg-blue-100 text-blue-700' },
      coordinator: { label: 'Coordinateur', color: 'bg-green-100 text-green-700' }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.volunteer;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Obtenir les noms des utilisateurs sélectionnés
  const getSelectedUsersNames = () => {
    return selectedUsers
      .map(id => {
        const selectedUser = users.find(u => u.id === id);
        return selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* En-tête */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentStep === 'select-users' ? 'Nouvelle conversation' : 'Votre message'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          {currentStep === 'write-message' && (
            <div className="mt-2 text-sm text-gray-600">
              À: {getSelectedUsersNames()}
            </div>
          )}
        </div>

        {/* Contenu selon l'étape */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {currentStep === 'select-users' ? (
            <>
              {/* Barre de recherche */}
              <div className="p-4 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Rechercher des personnes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Liste des utilisateurs */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedUsers.includes(user.id)
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                        onClick={() => toggleUserSelection(user.id)}
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={`${user.first_name} ${user.last_name}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 font-medium">
                              {user.first_name[0]}{user.last_name[0]}
                            </span>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="mt-1">
                            {getRoleBadge(user.role)}
                          </div>
                        </div>
                        {selectedUsers.includes(user.id) && (
                          <div className="text-blue-600">
                            ✓
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {filteredUsers.length === 0 && !isLoading && (
                      <div className="text-center py-8 text-gray-500">
                        {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Titre de groupe (si plusieurs personnes sélectionnées) */}
              {selectedUsers.length > 1 && (
                <div className="p-4 border-t border-gray-200">
                  <input
                    type="text"
                    placeholder="Nom du groupe (optionnel)"
                    value={conversationTitle}
                    onChange={(e) => setConversationTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {/* Titre de conversation (si groupe) */}
              {selectedUsers.length > 1 && (
                <div className="p-4 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Nom du groupe (optionnel)"
                    value={conversationTitle}
                    onChange={(e) => setConversationTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Zone de saisie du message */}
              <div className="flex-1 p-4">
                <textarea
                  placeholder="Tapez votre message..."
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  autoFocus
                />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {currentStep === 'select-users' && selectedUsers.length > 0 && (
                <span>
                  {selectedUsers.length} personne{selectedUsers.length > 1 ? 's' : ''} sélectionnée{selectedUsers.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              {currentStep === 'write-message' && (
                <button
                  onClick={goBackToSelection}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Retour
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              {currentStep === 'select-users' ? (
                <button
                  onClick={goToMessageStep}
                  disabled={selectedUsers.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                </button>
              ) : (
                <button
                  onClick={createConversationWithMessage}
                  disabled={!firstMessage.trim() || isCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? 'Envoi...' : 'Envoyer'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 