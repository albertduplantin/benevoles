'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { UserProfile, ConversationWithDetails } from '@/lib/types';
import ConversationsListSimple from './ConversationsListSimple';
import ChatInterfaceSimple from './ChatInterfaceSimple';
import AnnouncementsList from './AnnouncementsList';
import NewConversationModal from './NewConversationModal';

interface CommunicationHubProps {
  user: User;
  userProfile: UserProfile;
}

type ActiveTab = 'messages' | 'announcements';

export default function CommunicationHub({ user, userProfile }: CommunicationHubProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('announcements');
  const [selectedConversation, setSelectedConversation] = useState<any>();
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [newConversationId, setNewConversationId] = useState<string>();

  const tabs = [
    { 
      id: 'announcements', 
      name: 'Annonces', 
      icon: '📢',
      description: 'Informations importantes et actualités'
    },
    { 
      id: 'messages', 
      name: 'Messages', 
      icon: '💬',
      description: 'Conversations avec l\'équipe'
    }
  ];

  // Gérer la création d'une nouvelle conversation
  const handleNewConversation = () => {
    setActiveTab('messages');
    setShowNewConversationModal(true);
  };

  // Gérer la sélection d'une conversation après création
  const handleConversationCreated = (conversationId: string) => {
    setNewConversationId(conversationId);
    // La conversation sera automatiquement sélectionnée par ConversationsList
  };

  // Réinitialiser l'ID de nouvelle conversation après sélection
  const handleConversationSelect = (conversation: any) => {
    setSelectedConversation(conversation);
    setNewConversationId(undefined); // Réinitialiser après sélection
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-200px)]">
      {/* Onglets de navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex items-center justify-between px-6 py-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center space-x-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <div className="text-left">
                  <div>{tab.name}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Bouton nouvelle conversation */}
          <button
            onClick={handleNewConversation}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="text-lg">✉️</span>
            <span className="text-sm font-medium">Nouveau message</span>
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      <div className="h-full flex">
        {activeTab === 'announcements' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <AnnouncementsList user={user} userRole={userProfile.role} />
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="flex-1 flex">
            <ConversationsListSimple
              user={user}
              selectedConversation={selectedConversation}
              onConversationSelect={handleConversationSelect}
              onNewConversation={handleNewConversation}
              newConversationId={newConversationId}
            />
            <ChatInterfaceSimple
              user={user}
              selectedConversation={selectedConversation}
            />
          </div>
        )}
      </div>

      {/* Modal pour nouvelle conversation */}
      <NewConversationModal
        user={user}
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
} 