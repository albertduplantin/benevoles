'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  UserAvailability, 
  UserSectorPreferences, 
  UserUnavailability,
  WeekDay, 
  SectorLevel,
  SectorMetadata,
  AvailabilityFormData,
  SectorPreferencesFormData
} from '@/lib/types'

interface VolunteerPreferencesProps {
  userId: string;
}

// Configuration des secteurs avec métadonnées
const SECTORS: SectorMetadata[] = [
  {
    key: 'accueil_billetterie',
    label: 'Accueil & Billetterie',
    description: 'Accueil du public, vente de billets, orientation',
    icon: '🎫'
  },
  {
    key: 'projections',
    label: 'Projections',
    description: 'Animation de salles, présentation de films',
    icon: '🎬'
  },
  {
    key: 'technique',
    label: 'Technique',
    description: 'Son, éclairage, vidéo, régie',
    icon: '🔧'
  },
  {
    key: 'restauration',
    label: 'Restauration',
    description: 'Service, bar, buffets, catering',
    icon: '🍽️'
  },
  {
    key: 'communication',
    label: 'Communication',
    description: 'Presse, réseaux sociaux, médias',
    icon: '📢'
  },
  {
    key: 'logistique',
    label: 'Logistique',
    description: 'Transport, installation, coordination',
    icon: '📦'
  },
  {
    key: 'animation',
    label: 'Animation',
    description: 'Activités, ateliers, divertissement',
    icon: '🎭'
  },
  {
    key: 'securite',
    label: 'Sécurité',
    description: 'Contrôle, surveillance, premiers secours',
    icon: '🛡️'
  },
  {
    key: 'entretien',
    label: 'Entretien',
    description: 'Nettoyage, maintenance, rangement',
    icon: '🧹'
  },
  {
    key: 'autre',
    label: 'Autre',
    description: 'Autres domaines non listés',
    icon: '📝'
  }
];

// Labels des jours de la semaine
const WEEK_DAYS: { key: WeekDay; label: string }[] = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' }
];

// Labels des niveaux de compétence
const SECTOR_LEVELS: { value: SectorLevel; label: string; color: string }[] = [
  { value: 0, label: 'Non intéressé', color: 'text-gray-400' },
  { value: 1, label: 'Débutant', color: 'text-green-600' },
  { value: 2, label: 'Intermédiaire', color: 'text-blue-600' },
  { value: 3, label: 'Expert', color: 'text-purple-600' }
];

export default function VolunteerPreferences({ userId }: VolunteerPreferencesProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // États pour les disponibilités
  const [availability, setAvailability] = useState<AvailabilityFormData>({
    preferred_days: [],
    preferred_morning: true,
    preferred_afternoon: true,
    preferred_evening: false,
    max_hours_per_week: undefined,
    notes: ''
  });

  // États pour les secteurs
  const [sectorPrefs, setSectorPrefs] = useState<SectorPreferencesFormData>({
    accueil_billetterie: 0,
    projections: 0,
    technique: 0,
    restauration: 0,
    communication: 0,
    logistique: 0,
    animation: 0,
    securite: 0,
    entretien: 0,
    autre: 0,
    technical_notes: '',
    experience_notes: ''
  });

  const supabase = createClient();

  // Charger les préférences existantes
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        console.log('🔄 Chargement préférences pour userId:', userId);
        
        // Charger les disponibilités
        const { data: availData, error: availError } = await supabase
          .from('user_availability')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (availError) {
          // Si les tables n'existent pas, on charge des valeurs par défaut sans afficher d'erreur
          if (availError.code === 'PGRST116' || availError.message.includes('does not exist')) {
            console.log('ℹ️ Tables de préférences non créées, utilisation des valeurs par défaut');
            // Pas de message d'erreur visible pour l'utilisateur
          } else {
            console.error('Erreur chargement disponibilités:', availError);
            setMessage({ type: 'error', text: 'Erreur lors du chargement des disponibilités' });
          }
        } else if (availData) {
          console.log('✅ Disponibilités chargées:', availData);
          setAvailability({
            preferred_days: availData.preferred_days || [],
            preferred_morning: availData.preferred_morning,
            preferred_afternoon: availData.preferred_afternoon,
            preferred_evening: availData.preferred_evening,
            max_hours_per_week: availData.max_hours_per_week,
            notes: availData.notes || ''
          });
        }

        // Charger les préférences secteurs
        const { data: sectorData, error: sectorError } = await supabase
          .from('user_sector_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (sectorError) {
          // Si les tables n'existent pas, on charge des valeurs par défaut sans afficher d'erreur
          if (sectorError.code === 'PGRST116' || sectorError.message.includes('does not exist')) {
            console.log('ℹ️ Tables de secteurs non créées, utilisation des valeurs par défaut');
            // Pas de message d'erreur visible pour l'utilisateur
          } else {
            console.error('Erreur chargement secteurs:', sectorError);
            setMessage({ type: 'error', text: 'Erreur lors du chargement des secteurs' });
          }
        } else if (sectorData) {
          console.log('✅ Secteurs chargés:', sectorData);
          setSectorPrefs({
            accueil_billetterie: sectorData.accueil_billetterie,
            projections: sectorData.projections,
            technique: sectorData.technique,
            restauration: sectorData.restauration,
            communication: sectorData.communication,
            logistique: sectorData.logistique,
            animation: sectorData.animation,
            securite: sectorData.securite,
            entretien: sectorData.entretien,
            autre: sectorData.autre,
            technical_notes: sectorData.technical_notes || '',
            experience_notes: sectorData.experience_notes || ''
          });
        }

      } catch (error) {
        console.error('Erreur chargement préférences:', error);
        setMessage({ type: 'error', text: 'Erreur lors du chargement des préférences' });
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [userId, supabase]);

  // Sauvegarder les préférences
  const savePreferences = async () => {
    setSaving(true);
    setMessage(null);

    try {
      console.log('🔍 Debugging sauvegarde:');
      console.log('- userId:', userId);
      console.log('- typeof userId:', typeof userId);
      console.log('- availability:', availability);
      console.log('- sectorPrefs:', sectorPrefs);

      // Vérifier que userId est valide
      if (!userId) {
        setMessage({ type: 'error', text: 'Erreur: Utilisateur non identifié' });
        return;
      }

      // Sauvegarder disponibilités avec gestion des conflits
      console.log('💾 Tentative sauvegarde disponibilités...');
      
      // D'abord, essayer de mettre à jour
      const { data: existingAvail } = await supabase
        .from('user_availability')
        .select('id')
        .eq('user_id', userId)
        .single();

      let availError;
      if (existingAvail) {
        // Mise à jour
        console.log('🔄 Mise à jour disponibilités existantes');
        const { error } = await supabase
          .from('user_availability')
          .update({
            ...availability,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        availError = error;
      } else {
        // Insertion
        console.log('➕ Création nouvelles disponibilités');
        const { error } = await supabase
          .from('user_availability')
          .insert({
            user_id: userId,
            ...availability,
            updated_at: new Date().toISOString()
          });
        availError = error;
      }

      if (availError) {
        console.error('❌ Erreur sauvegarde disponibilités:', availError);
        console.error('- Code erreur:', availError.code);
        console.error('- Message:', availError.message);
        console.error('- Details:', availError.details);
        
        // Si les tables n'existent pas, on affiche un message informatif
        if (availError.code === 'PGRST116' || availError.message.includes('does not exist')) {
          setMessage({ type: 'error', text: 'Les tables de préférences doivent être créées en base de données. Contactez l\'administrateur.' });
          return;
        }
        
        // Si c'est une erreur de permissions (403)
        if (availError.code === 'PGRST301' || availError.message.includes('permission denied') || availError.message.includes('RLS')) {
          setMessage({ type: 'error', text: 'Erreur de permissions. Les politiques RLS doivent être configurées. Contactez l\'administrateur.' });
          return;
        }
        
        throw availError;
      }

      console.log('✅ Disponibilités sauvegardées');

      // Sauvegarder préférences secteurs avec gestion des conflits
      console.log('💾 Tentative sauvegarde secteurs...');
      
      // D'abord, essayer de trouver l'enregistrement existant
      const { data: existingSector } = await supabase
        .from('user_sector_preferences')
        .select('id')
        .eq('user_id', userId)
        .single();

      let sectorError;
      if (existingSector) {
        // Mise à jour
        console.log('🔄 Mise à jour secteurs existants');
        const { error } = await supabase
          .from('user_sector_preferences')
          .update({
            ...sectorPrefs,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        sectorError = error;
      } else {
        // Insertion
        console.log('➕ Création nouveaux secteurs');
        const { error } = await supabase
          .from('user_sector_preferences')
          .insert({
            user_id: userId,
            ...sectorPrefs,
            updated_at: new Date().toISOString()
          });
        sectorError = error;
      }

      if (sectorError) {
        console.error('❌ Erreur sauvegarde secteurs:', sectorError);
        console.error('- Code erreur:', sectorError.code);
        console.error('- Message:', sectorError.message);
        console.error('- Details:', sectorError.details);
        
        // Si les tables n'existent pas, on affiche un message informatif
        if (sectorError.code === 'PGRST116' || sectorError.message.includes('does not exist')) {
          setMessage({ type: 'error', text: 'Les tables de préférences doivent être créées en base de données. Contactez l\'administrateur.' });
          return;
        }
        
        // Si c'est une erreur de permissions (403)
        if (sectorError.code === 'PGRST301' || sectorError.message.includes('permission denied') || sectorError.message.includes('RLS')) {
          setMessage({ type: 'error', text: 'Erreur de permissions. Les politiques RLS doivent être configurées. Contactez l\'administrateur.' });
          return;
        }
        
        throw sectorError;
      }

      console.log('✅ Secteurs sauvegardés');
      console.log('✅ Préférences sauvegardées avec succès !');
      
      // Animation de succès
      setJustSaved(true);
      setMessage({ type: 'success', text: 'Préférences sauvegardées avec succès !' });
      
      // Effacer les indicateurs visuels après quelques secondes
      setTimeout(() => {
        setJustSaved(false);
        setMessage(null);
      }, 3000);

    } catch (error) {
      console.error('💥 Erreur générale sauvegarde:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  // Gérer les changements de jours préférés
  const toggleWeekDay = (day: WeekDay) => {
    setAvailability(prev => ({
      ...prev,
      preferred_days: prev.preferred_days.includes(day)
        ? prev.preferred_days.filter(d => d !== day)
        : [...prev.preferred_days, day]
    }));
  };

  // Gérer les changements de niveau secteur
  const updateSectorLevel = (sector: keyof SectorPreferencesFormData, level: SectorLevel) => {
    if (sector === 'technical_notes' || sector === 'experience_notes') return;
    setSectorPrefs(prev => ({ ...prev, [sector]: level }));
  };

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

  return (
    <div className="space-y-6">
      {/* Notification toast en haut à droite */}
      {message && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg border transform transition-all duration-300 ease-in-out ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        } animate-in slide-in-from-right-5`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Section Disponibilités */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">⏰ Mes Disponibilités</h3>
          <p className="text-sm text-gray-600 mt-1">
            Indiquez quand vous êtes généralement disponible pour des missions
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Jours préférés */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Jours préférés</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {WEEK_DAYS.map(({ key, label }) => (
                <label key={key} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availability.preferred_days.includes(key)}
                    onChange={() => toggleWeekDay(key)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Créneaux préférés */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Créneaux préférés</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={availability.preferred_morning}
                  onChange={(e) => setAvailability(prev => ({ ...prev, preferred_morning: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  <strong>Matin</strong> (9h - 12h)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={availability.preferred_afternoon}
                  onChange={(e) => setAvailability(prev => ({ ...prev, preferred_afternoon: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  <strong>Après-midi</strong> (14h - 17h)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={availability.preferred_evening}
                  onChange={(e) => setAvailability(prev => ({ ...prev, preferred_evening: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  <strong>Soirée</strong> (18h - 22h)
                </span>
              </label>
            </div>
          </div>

          {/* Heures max par semaine */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre maximum d'heures par semaine (optionnel)
            </label>
            <input
              type="number"
              min="1"
              max="40"
              value={availability.max_hours_per_week || ''}
              onChange={(e) => setAvailability(prev => ({ 
                ...prev, 
                max_hours_per_week: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: 10"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes et contraintes particulières
            </label>
            <textarea
              value={availability.notes}
              onChange={(e) => setAvailability(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Pas disponible les weekends de match, besoin d'1h de pause déjeuner..."
            />
          </div>
        </div>
      </div>

      {/* Section Compétences et Secteurs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">🛠️ Mes Compétences et Préférences</h3>
          <p className="text-sm text-gray-600 mt-1">
            Indiquez vos domaines de compétence et vos préférences par secteur
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Grille des secteurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SECTORS.map((sector) => (
              <div key={sector.key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{sector.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{sector.label}</h4>
                    <p className="text-sm text-gray-600">{sector.description}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  {SECTOR_LEVELS.map(({ value, label, color }) => (
                    <label key={value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name={sector.key}
                        value={value}
                        checked={sectorPrefs[sector.key] === value}
                        onChange={() => updateSectorLevel(sector.key, value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className={`ml-2 text-sm font-medium ${color}`}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Notes techniques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compétences techniques spécifiques
              </label>
              <textarea
                value={sectorPrefs.technical_notes}
                onChange={(e) => setSectorPrefs(prev => ({ ...prev, technical_notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Maîtrise Logic Pro, permis poids lourd, secourisme..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expérience antérieure
              </label>
              <textarea
                value={sectorPrefs.experience_notes}
                onChange={(e) => setSectorPrefs(prev => ({ ...prev, experience_notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 3 ans de bénévolat festival Cannes, formation audiovisuelle..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="bg-white rounded-lg shadow p-6">
        <button
          onClick={savePreferences}
          disabled={isSaving}
          className={`w-full px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white transition-all duration-300 ${
            justSaved
              ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
              : isSaving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-offset-2`}
        >
          <div className="flex items-center justify-center">
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sauvegarde en cours...
              </>
            ) : justSaved ? (
              <>
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8 15.414l-4.707-4.707a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Sauvegardé !
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586l-1.293-1.293z" />
                  <path d="M5 3a2 2 0 00-2 2v1a1 1 0 002 0V5h10v1a1 1 0 102 0V5a2 2 0 00-2-2H5zM5 15a2 2 0 01-2-2v-1a1 1 0 012 0v1h10v-1a1 1 0 112 0v1a2 2 0 01-2 2H5z" />
                </svg>
                Sauvegarder mes préférences
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
} 