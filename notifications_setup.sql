-- Création de la table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_mission_id ON notifications(mission_id);

-- RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Politique : Les admins peuvent créer des notifications pour tous les utilisateurs
CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'responsable')
    )
  );

-- Fonction pour créer automatiquement des notifications lors d'inscriptions
CREATE OR REPLACE FUNCTION create_mission_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notification pour le bénévole qui s'inscrit
  INSERT INTO notifications (user_id, title, message, type, mission_id)
  SELECT 
    NEW.user_id,
    'Inscription confirmée',
    'Vous êtes maintenant inscrit(e) à la mission "' || m.title || '"',
    'success',
    NEW.mission_id
  FROM missions m
  WHERE m.id = NEW.mission_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer une notification lors d'une inscription
DROP TRIGGER IF EXISTS trigger_create_mission_notification ON inscriptions;
CREATE TRIGGER trigger_create_mission_notification
  AFTER INSERT ON inscriptions
  FOR EACH ROW
  EXECUTE FUNCTION create_mission_notification();

-- Fonction pour créer des notifications lors de la création de missions
CREATE OR REPLACE FUNCTION create_new_mission_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notification pour tous les bénévoles
  INSERT INTO notifications (user_id, title, message, type, mission_id)
  SELECT 
    u.id,
    'Nouvelle mission disponible',
    'Une nouvelle mission "' || NEW.title || '" est maintenant disponible',
    'info',
    NEW.id
  FROM users u
  WHERE u.role = 'benevole';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer des notifications lors de la création de missions
DROP TRIGGER IF EXISTS trigger_create_new_mission_notification ON missions;
CREATE TRIGGER trigger_create_new_mission_notification
  AFTER INSERT ON missions
  FOR EACH ROW
  EXECUTE FUNCTION create_new_mission_notification();

-- Fonction pour créer des notifications pour les missions urgentes
CREATE OR REPLACE FUNCTION create_urgent_mission_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la mission devient urgente
  IF NEW.is_urgent = TRUE AND (OLD.is_urgent = FALSE OR OLD.is_urgent IS NULL) THEN
    -- Notification pour tous les bénévoles
    INSERT INTO notifications (user_id, title, message, type, mission_id)
    SELECT 
      u.id,
      'Mission urgente',
      'La mission "' || NEW.title || '" est maintenant marquée comme urgente',
      'warning',
      NEW.id
    FROM users u
    WHERE u.role = 'benevole';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les missions urgentes
DROP TRIGGER IF EXISTS trigger_create_urgent_mission_notification ON missions;
CREATE TRIGGER trigger_create_urgent_mission_notification
  AFTER UPDATE ON missions
  FOR EACH ROW
  EXECUTE FUNCTION create_urgent_mission_notification();

-- Fonction pour nettoyer les anciennes notifications (plus de 30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur la table
COMMENT ON TABLE notifications IS 'Table des notifications pour les utilisateurs';
COMMENT ON COLUMN notifications.user_id IS 'ID de l''utilisateur destinataire';
COMMENT ON COLUMN notifications.title IS 'Titre de la notification';
COMMENT ON COLUMN notifications.message IS 'Message de la notification';
COMMENT ON COLUMN notifications.type IS 'Type de notification (info, success, warning, error)';
COMMENT ON COLUMN notifications.read IS 'Indique si la notification a été lue';
COMMENT ON COLUMN notifications.mission_id IS 'ID de la mission liée (optionnel)';
COMMENT ON COLUMN notifications.created_at IS 'Date de création de la notification';
COMMENT ON COLUMN notifications.updated_at IS 'Date de dernière mise à jour';
