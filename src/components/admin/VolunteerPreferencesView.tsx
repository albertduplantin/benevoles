'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VolunteerCompleteProfile, WeekDay, SectorLevel } from '@/lib/types'

// Configuration des secteurs avec métadonnées
const SECTORS = [
  { key: 'accueil_billetterie', label: 'Accueil & Billetterie', icon: '🎫' },
  { key: 'projections', label: 'Projections', icon: '🎬' },
  { key: 'technique', label: 'Technique', icon: '🔧' },
  { key: 'restauration', label: 'Restauration', icon: '🍽️' },
  { key: 'communication', label: 'Communication', icon: '📢' },
  { key: 'logistique', label: 'Logistique', icon: '📦' },
  { key: 'animation', label: 'Animation', icon: '🎭' },
  { key: 'securite', label: 'Sécurité', icon: '🛡️' },
  { key: 'entretien', label: 'Entretien', icon: '🧹' },
  { key: 'autre', label: 'Autre', icon: '📝' }
];

const WEEK_DAYS_LABELS: Record<WeekDay, string> = {
  'monday': 'Lun',
  'tuesday': 'Mar',
  'wednesday': 'Mer',
  'thursday': 'Jeu',
  'friday': 'Ven',
  'saturday': 'Sam',
  'sunday': 'Dim'
};

const LEVEL_LABELS: Record<SectorLevel, { label: string; color: string; bgColor: string }> = {
  0: { label: 'Non intéressé', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  1: { label: 'Débutant', color: 'text-green-700', bgColor: 'bg-green-100' },
  2: { label: 'Intermédiaire', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  3: { label: 'Expert', color: 'text-purple-700', bgColor: 'bg-purple-100' }
};

export default function VolunteerPreferencesView() {
  const [volunteers, setVolunteers] = useState<VolunteerCompleteProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerCompleteProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const loadVolunteerPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('volunteer_complete_profile')
          .select('*')
          .order('last_name', { ascending: true });

        if (error) {
          console.error('Erreur chargement préférences bénévoles:', error);
          setError('Les tables de préférences n\'existent pas encore. Veuillez exécuter le script SQL dans Supabase.');
        } else {
          setVolunteers(data || []);
          setError(null);
        }
      } catch (error) {
        console.error('Erreur:', error);
        setError('Erreur de connexion à la base de données.');
      } finally {
        setIsLoading(false);
      }
    };

    loadVolunteerPreferences();
  }, [supabase]);

  // Filtrer les bénévoles
  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch = !searchTerm || 
      `${volunteer.first_name} ${volunteer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSector = filterSector === 'all' || 
      (volunteer[filterSector as keyof VolunteerCompleteProfile] as number) > 0;
    
    return matchesSearch && matchesSector;
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Gestion d'erreur avec message explicite
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erreur</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 Préférences des Bénévoles</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Recherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher un bénévole
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom, prénom..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtre par secteur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtre par compétence
            </label>
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les bénévoles</option>
              {SECTORS.map(sector => (
                <option key={sector.key} value={sector.key}>
                  {sector.icon} {sector.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          {filteredVolunteers.length} bénévole(s) trouvé(s)
        </p>
      </div>

      {/* Liste des bénévoles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredVolunteers.map((volunteer, idx) => (
          <div key={volunteer.id + '-' + idx} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* En-tête bénévole */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {volunteer.first_name} {volunteer.last_name}
                  </h4>
                  {volunteer.phone && (
                    <p className="text-sm text-gray-600">{volunteer.phone}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    try {
                      setSelectedVolunteer(volunteer);
                    } catch (error) {
                      console.error('Erreur lors de l\'ouverture des détails:', error);
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Détails
                </button>
              </div>

              {/* Disponibilités résumées */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">⏰ Disponibilités</h5>
                
                {/* Jours préférés */}
                {volunteer.preferred_days && volunteer.preferred_days.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {volunteer.preferred_days.map((day) => (
                      <span key={volunteer.id + '-' + day} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {WEEK_DAYS_LABELS[day]}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mb-2">Aucun jour spécifié</p>
                )}

                {/* Créneaux */}
                <div className="flex gap-1 text-xs">
                  {volunteer.preferred_morning && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Matin</span>
                  )}
                  {volunteer.preferred_afternoon && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">A-midi</span>
                  )}
                  {volunteer.preferred_evening && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">Soir</span>
                  )}
                </div>
              </div>

              {/* Compétences principales */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">🛠️ Compétences</h5>
                <div className="space-y-1">
                  {SECTORS.filter(sector => {
                    const level = volunteer[sector.key as keyof VolunteerCompleteProfile] as number;
                    return level > 0;
                  }).slice(0, 3).map(sector => {
                    const level = volunteer[sector.key as keyof VolunteerCompleteProfile] as SectorLevel;
                    const levelInfo = LEVEL_LABELS[level];
                    return (
                      <div key={sector.key} className="flex items-center justify-between text-xs">
                        <span className="flex items-center">
                          <span className="mr-1">{sector.icon}</span>
                          {sector.label}
                        </span>
                        <span className={`px-2 py-1 rounded ${levelInfo.bgColor} ${levelInfo.color}`}>
                          {levelInfo.label}
                        </span>
                      </div>
                    );
                  })}
                  {SECTORS.filter(sector => {
                    const level = volunteer[sector.key as keyof VolunteerCompleteProfile] as number;
                    return level > 0;
                  }).length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{SECTORS.filter(sector => {
                        const level = volunteer[sector.key as keyof VolunteerCompleteProfile] as number;
                        return level > 0;
                      }).length - 3} autres compétences
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal détails bénévole */}
      {selectedVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* En-tête modal */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Profil complet - {selectedVolunteer.first_name} {selectedVolunteer.last_name}
                </h3>
                <button
                  onClick={() => setSelectedVolunteer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Disponibilités détaillées */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">⏰ Disponibilités</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Jours préférés :</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedVolunteer.preferred_days && selectedVolunteer.preferred_days.length > 0 ? (
                          selectedVolunteer.preferred_days.map((day) => (
                            <span key={selectedVolunteer.id + '-' + day} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                              {WEEK_DAYS_LABELS[day]}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">Aucun jour spécifié</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-700">Créneaux :</span>
                      <div className="flex gap-2 mt-1">
                        {selectedVolunteer.preferred_morning && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">Matin (9h-12h)</span>
                        )}
                        {selectedVolunteer.preferred_afternoon && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded">Après-midi (14h-17h)</span>
                        )}
                        {selectedVolunteer.preferred_evening && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded">Soirée (18h-22h)</span>
                        )}
                      </div>
                    </div>

                    {selectedVolunteer.max_hours_per_week && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Heures max/semaine :</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedVolunteer.max_hours_per_week}h</span>
                      </div>
                    )}

                    {selectedVolunteer.availability_notes && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Notes :</span>
                        <p className="text-sm text-gray-900 mt-1">{selectedVolunteer.availability_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Compétences détaillées */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">🛠️ Compétences par secteur</h4>
                  
                  <div className="space-y-2">
                    {SECTORS.map(sector => {
                      const level = selectedVolunteer[sector.key as keyof VolunteerCompleteProfile] as SectorLevel;
                      const levelInfo = LEVEL_LABELS[level];
                      return (
                        <div key={sector.key} className="flex items-center justify-between">
                          <span className="flex items-center text-sm">
                            <span className="mr-2">{sector.icon}</span>
                            {sector.label}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${levelInfo.bgColor} ${levelInfo.color}`}>
                            {levelInfo.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {selectedVolunteer.technical_notes && (
                    <div className="mt-4">
                      <span className="text-sm font-medium text-gray-700">Compétences techniques :</span>
                      <p className="text-sm text-gray-900 mt-1">{selectedVolunteer.technical_notes}</p>
                    </div>
                  )}

                  {selectedVolunteer.experience_notes && (
                    <div className="mt-4">
                      <span className="text-sm font-medium text-gray-700">Expérience :</span>
                      <p className="text-sm text-gray-900 mt-1">{selectedVolunteer.experience_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 