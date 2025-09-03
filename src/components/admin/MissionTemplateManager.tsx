'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ButtonSpinner } from '@/components/ui/Spinner'

interface MissionTemplate {
  id: number
  name: string
  description: string
  location: string
  required_volunteers: number
  duration_hours: number
  skills_required: string[]
  equipment_needed: string[]
  instructions: string
  is_urgent: boolean
  category: string
  created_at: string
  created_by: string
  usage_count: number
}

interface CreateTemplateForm {
  name: string
  description: string
  location: string
  required_volunteers: number
  duration_hours: number
  skills_required: string
  equipment_needed: string
  instructions: string
  is_urgent: boolean
  category: string
}

export default function MissionTemplateManager() {
  const [templates, setTemplates] = useState<MissionTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MissionTemplate | null>(null)
  const [formData, setFormData] = useState<CreateTemplateForm>({
    name: '',
    description: '',
    location: '',
    required_volunteers: 1,
    duration_hours: 2,
    skills_required: '',
    equipment_needed: '',
    instructions: '',
    is_urgent: false,
    category: 'general'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('mission_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const templateData = {
        ...formData,
        skills_required: formData.skills_required.split(',').map(s => s.trim()).filter(s => s),
        equipment_needed: formData.equipment_needed.split(',').map(s => s.trim()).filter(s => s),
        created_by: (await supabase.auth.getUser()).data.user?.id
      }

      if (editingTemplate) {
        // Mise à jour
        const { error } = await supabase
          .from('mission_templates')
          .update(templateData)
          .eq('id', editingTemplate.id)

        if (error) throw error
      } else {
        // Création
        const { error } = await supabase
          .from('mission_templates')
          .insert(templateData)

        if (error) throw error
      }

      await loadTemplates()
      resetForm()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du template:', error)
      alert('Erreur lors de la sauvegarde du template.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (template: MissionTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      location: template.location,
      required_volunteers: template.required_volunteers,
      duration_hours: template.duration_hours,
      skills_required: template.skills_required.join(', '),
      equipment_needed: template.equipment_needed.join(', '),
      instructions: template.instructions,
      is_urgent: template.is_urgent,
      category: template.category
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (templateId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return

    try {
      const { error } = await supabase
        .from('mission_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error
      await loadTemplates()
    } catch (error) {
      console.error('Erreur lors de la suppression du template:', error)
      alert('Erreur lors de la suppression du template.')
    }
  }

  const handleUseTemplate = async (template: MissionTemplate) => {
    try {
      // Créer une mission à partir du template
      const { data: user } = await supabase.auth.getUser()
      
      const missionData = {
        title: template.name,
        description: template.description,
        location: template.location,
        required_volunteers: template.required_volunteers,
        duration_hours: template.duration_hours,
        skills_required: template.skills_required,
        equipment_needed: template.equipment_needed,
        instructions: template.instructions,
        is_urgent: template.is_urgent,
        category: template.category,
        status: 'draft',
        created_by: user.user?.id
      }

      const { error } = await supabase
        .from('missions')
        .insert(missionData)

      if (error) throw error

      // Incrémenter le compteur d'utilisation
      await supabase
        .from('mission_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', template.id)

      alert('Mission créée à partir du template ! Vous pouvez maintenant la modifier et la programmer.')
      await loadTemplates()
    } catch (error) {
      console.error('Erreur lors de la création de la mission:', error)
      alert('Erreur lors de la création de la mission.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      required_volunteers: 1,
      duration_hours: 2,
      skills_required: '',
      equipment_needed: '',
      instructions: '',
      is_urgent: false,
      category: 'general'
    })
    setEditingTemplate(null)
    setShowCreateForm(false)
  }

  const categories = [
    'general',
    'technique',
    'logistique',
    'communication',
    'accueil',
    'securite',
    'nettoyage',
    'cuisine',
    'transport'
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ButtonSpinner />
        <span className="ml-2">Chargement des templates...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📋 Gestion des Templates de Missions</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nouveau Template
        </button>
      </div>

      {/* Formulaire de création/édition */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingTemplate ? 'Modifier le Template' : 'Créer un Nouveau Template'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du Template *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Accueil Festival"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description détaillée de la mission..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Hall d'entrée"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bénévoles requis *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.required_volunteers}
                  onChange={(e) => setFormData({ ...formData, required_volunteers: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée (heures) *
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compétences requises
                </label>
                <input
                  type="text"
                  value={formData.skills_required}
                  onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Accueil, Communication, Anglais (séparés par des virgules)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Équipement nécessaire
                </label>
                <input
                  type="text"
                  value={formData.equipment_needed}
                  onChange={(e) => setFormData({ ...formData, equipment_needed: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Table, Chaise, Badge (séparés par des virgules)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions spéciales
              </label>
              <textarea
                rows={3}
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Instructions particulières pour cette mission..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_urgent"
                checked={formData.is_urgent}
                onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_urgent" className="text-sm font-medium text-gray-700">
                Mission urgente par défaut
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Sauvegarde...' : editingTemplate ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des templates */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Templates Disponibles</h3>
          <p className="text-gray-600 text-sm mt-1">
            {templates.length} template(s) disponible(s)
          </p>
        </div>

        {templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>Aucun template créé pour le moment</p>
            <p className="text-sm">Créez votre premier template pour gagner du temps !</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {templates.map(template => (
              <div key={template.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium">{template.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.category === 'urgent' ? 'bg-red-100 text-red-800' :
                        template.category === 'technique' ? 'bg-blue-100 text-blue-800' :
                        template.category === 'logistique' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {template.category}
                      </span>
                      {template.is_urgent && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          🚨 Urgent
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{template.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">📍 Lieu:</span>
                        <span className="ml-1 text-gray-600">{template.location}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">👥 Bénévoles:</span>
                        <span className="ml-1 text-gray-600">{template.required_volunteers}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">⏱️ Durée:</span>
                        <span className="ml-1 text-gray-600">{template.duration_hours}h</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">📊 Utilisé:</span>
                        <span className="ml-1 text-gray-600">{template.usage_count} fois</span>
                      </div>
                    </div>

                    {template.skills_required.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-700 text-sm">Compétences:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.skills_required.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {template.equipment_needed.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-700 text-sm">Équipement:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.equipment_needed.map((equipment, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {equipment}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      🚀 Utiliser
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
