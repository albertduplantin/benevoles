'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { UserProfile, ConversationWithDetails } from '@/lib/types';
import ConversationsList from './ConversationsList';
import ChatInterface from './ChatInterface';
import AnnouncementsList from './AnnouncementsList';

interface CommunicationHubProps {
  user: User;
  userProfile: UserProfile;
}

type ActiveTab = 'messages' | 'announcements';

export default function CommunicationHub({ user, userProfile }: CommunicationHubProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('announcements');
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails>();

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-200px)]">
      {/* Onglets de navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6 py-4">
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
            <ConversationsList
              user={user}
              selectedConversation={selectedConversation}
              onConversationSelect={setSelectedConversation}
            />
            <ChatInterface
              user={user}
              selectedConversation={selectedConversation}
              onConversationSelect={setSelectedConversation}
            />
          </div>
        )}
      </div>
    </div>
  );
} 