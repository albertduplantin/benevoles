'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CreateAnnouncementFormProps {
  onAnnouncementCreated?: () => void;
}

export default function CreateAnnouncementForm({ onAnnouncementCreated }: CreateAnnouncementFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    target_roles: ['benevole'],
    expires_at: ''
  });
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const announcementData = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        target_roles: formData.target_roles,
        created_by: user.id,
        expires_at: formData.expires_at || null
      };

      const { error } = await supabase
        .from('announcements')
        .insert(announcementData);

      if (error) throw error;

      // Réinitialiser le formulaire
      setFormData({
        title: '',
        content: '',
        priority: 'normal',
        target_roles: ['benevole'],
        expires_at: ''
      });
      setIsOpen(false);
      
      if (onAnnouncementCreated) {
        onAnnouncementCreated();
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'annonce:', error);
      alert('Erreur lors de la création de l\'annonce');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role]
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-blue-600';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '⚠️';
      case 'normal': return 'ℹ️';
      case 'low': return '💬';
      default: return 'ℹ️';
    }
  };

  if (!isOpen) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <span>📢</span>
          <span>Créer une Annonce</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <span>📢</span>
          <span>Créer une Annonce</span>
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Titre */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titre de l'annonce *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Ex: Changement d'horaire pour la mission Accueil"
            required
          />
        </div>

        {/* Contenu */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Contenu de l'annonce *
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Décrivez votre annonce en détail..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Priorité */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priorité
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="low">🗨️ Faible</option>
              <option value="normal">ℹ️ Normale</option>
              <option value="high">⚠️ Élevée</option>
              <option value="urgent">🚨 Urgente</option>
            </select>
          </div>

          {/* Date d'expiration */}
          <div>
            <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700 mb-1">
              Date d'expiration (optionnel)
            </label>
            <input
              type="datetime-local"
              id="expires_at"
              value={formData.expires_at}
              onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Rôles cibles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destinataires *
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'benevole', label: 'Bénévoles', icon: '👤' },
              { key: 'responsable', label: 'Responsables', icon: '👨‍💼' },
              { key: 'admin', label: 'Administrateurs', icon: '👑' }
            ].map(role => (
              <button
                key={role.key}
                type="button"
                onClick={() => handleRoleToggle(role.key)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  formData.target_roles.includes(role.key)
                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{role.icon}</span>
                <span>{role.label}</span>
                {formData.target_roles.includes(role.key) && <span>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Aperçu */}
        {formData.title && formData.content && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu :</h4>
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-3">
                <span className="text-2xl">{getPriorityIcon(formData.priority)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{formData.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs font-medium ${getPriorityColor(formData.priority)}`}>
                      {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      • Destinataires: {formData.target_roles.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{formData.content}</p>
            </div>
          </div>
        )}

        {/* Boutons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading || !formData.title || !formData.content || formData.target_roles.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Publication...</span>
              </>
            ) : (
              <>
                <span>📢</span>
                <span>Publier l'Annonce</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 