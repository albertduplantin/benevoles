-- SYSTÈME DE DISPONIBILITÉS ET COMPÉTENCES - VERSION SIMPLE
-- À exécuter dans Supabase SQL Editor

-- ============================================
-- 1. TABLE DES DISPONIBILITÉS
-- ============================================

CREATE TABLE IF NOT EXISTS user_availability (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Jours préférés (tableau de jours de semaine)
  preferred_days TEXT[] DEFAULT '{}', -- ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  -- Créneaux préférés  
  preferred_morning BOOLEAN DEFAULT true,   -- 9h-12h
  preferred_afternoon BOOLEAN DEFAULT true, -- 14h-17h
  preferred_evening BOOLEAN DEFAULT false,  -- 18h-22h
  
  -- Informations supplémentaires
  max_hours_per_week INTEGER DEFAULT NULL, -- Nombre max d'heures par semaine
  notes TEXT,                             -- Notes libres
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. TABLE DES INDISPONIBILITÉS
-- ============================================

CREATE TABLE IF NOT EXISTS user_unavailability (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. TABLE DES COMPÉTENCES/SECTEURS PRÉFÉRÉS
-- ============================================

CREATE TABLE IF NOT EXISTS user_sector_preferences (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Secteurs avec niveau de préférence/expertise
  accueil_billetterie INTEGER DEFAULT 0,    -- 0=Non intéressé, 1=Débutant, 2=Intermédiaire, 3=Expert
  projections INTEGER DEFAULT 0,
  technique INTEGER DEFAULT 0,
  restauration INTEGER DEFAULT 0,
  communication INTEGER DEFAULT 0,
  logistique INTEGER DEFAULT 0,
  animation INTEGER DEFAULT 0,
  securite INTEGER DEFAULT 0,
  entretien INTEGER DEFAULT 0,
  autre INTEGER DEFAULT 0,
  
  -- Notes spécifiques
  technical_notes TEXT,   -- Compétences techniques spécifiques
  experience_notes TEXT,  -- Expérience antérieure
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. POLITIQUES DE SÉCURITÉ (RLS)
-- ============================================

-- Table disponibilités
ALTER TABLE user_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_availability_policy" ON user_availability
FOR ALL USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'responsable')
  )
);

-- Table indisponibilités
ALTER TABLE user_unavailability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_unavailability_policy" ON user_unavailability
FOR ALL USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'responsable')
  )
);

-- Table préférences secteurs
ALTER TABLE user_sector_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_sector_preferences_policy" ON user_sector_preferences
FOR ALL USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'responsable')
  )
);

-- ============================================
-- 5. PERMISSIONS
-- ============================================

GRANT ALL ON user_availability TO authenticated;
GRANT ALL ON user_unavailability TO authenticated;
GRANT ALL ON user_sector_preferences TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE user_availability_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_unavailability_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_sector_preferences_id_seq TO authenticated;

-- ============================================
-- 6. FONCTION POUR CRÉER LES PRÉFÉRENCES PAR DÉFAUT
-- ============================================

CREATE OR REPLACE FUNCTION create_default_volunteer_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer des disponibilités par défaut
  INSERT INTO user_availability (user_id, preferred_days, preferred_morning, preferred_afternoon, preferred_evening)
  VALUES (NEW.id, '{}', true, true, false)
  ON CONFLICT DO NOTHING;
  
  -- Créer des préférences secteurs par défaut (tous à 0 = non spécifié)
  INSERT INTO user_sector_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. TRIGGER POUR AUTO-CRÉATION
-- ============================================

DROP TRIGGER IF EXISTS trigger_create_volunteer_preferences ON users;
CREATE TRIGGER trigger_create_volunteer_preferences
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_volunteer_preferences();

-- ============================================
-- 8. VUES UTILES POUR LES REQUÊTES
-- ============================================

-- Vue complète des préférences d'un bénévole
CREATE OR REPLACE VIEW volunteer_complete_profile AS
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.phone,
  u.role,
  
  -- Disponibilités
  av.preferred_days,
  av.preferred_morning,
  av.preferred_afternoon,
  av.preferred_evening,
  av.max_hours_per_week,
  av.notes as availability_notes,
  
  -- Secteurs
  sp.accueil_billetterie,
  sp.projections,
  sp.technique,
  sp.restauration,
  sp.communication,
  sp.logistique,
  sp.animation,
  sp.securite,
  sp.entretien,
  sp.autre,
  sp.technical_notes,
  sp.experience_notes
  
FROM users u
LEFT JOIN user_availability av ON u.id = av.user_id
LEFT JOIN user_sector_preferences sp ON u.id = sp.user_id
WHERE u.role = 'benevole' OR u.role = 'responsable' OR u.role = 'admin';

-- ============================================
-- 9. MESSAGE DE CONFIRMATION
-- ============================================

SELECT 'Système de disponibilités et compétences créé avec succès!' as status;

-- Ajout des contraintes d'unicité
ALTER TABLE user_availability
ADD CONSTRAINT unique_user_availability UNIQUE (user_id);

ALTER TABLE user_sector_preferences
ADD CONSTRAINT unique_user_sector_preferences UNIQUE (user_id); 