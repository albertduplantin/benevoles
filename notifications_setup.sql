-- Créer la table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_mission_id ON notifications(mission_id);

-- Activer RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique : seuls les admins peuvent créer des notifications
CREATE POLICY "Admins can create notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'responsable')
        )
    );

-- Politique : les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour créer des notifications automatiques
CREATE OR REPLACE FUNCTION create_notification_for_all_volunteers(
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'info',
    p_mission_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER := 0;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, mission_id)
    SELECT id, p_title, p_message, p_type, p_mission_id
    FROM users 
    WHERE role = 'benevole';
    
    GET DIAGNOSTICS notification_count = ROW_COUNT;
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour notifier les bénévoles d'une mission spécifique
CREATE OR REPLACE FUNCTION create_notification_for_mission_volunteers(
    p_mission_id INTEGER,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'info'
)
RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER := 0;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, mission_id)
    SELECT DISTINCT i.user_id, p_title, p_message, p_type, p_mission_id
    FROM inscriptions i
    WHERE i.mission_id = p_mission_id;
    
    GET DIAGNOSTICS notification_count = ROW_COUNT;
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger automatique : notification quand une nouvelle mission est créée
CREATE OR REPLACE FUNCTION notify_new_mission()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification_for_all_volunteers(
        'Nouvelle mission disponible',
        'Une nouvelle mission "' || NEW.title || '" est disponible pour inscription.',
        'info',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_notify_new_mission
    AFTER INSERT ON missions
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_mission();

-- Trigger automatique : notification quand un bénévole s'inscrit à une mission
CREATE OR REPLACE FUNCTION notify_mission_registration()
RETURNS TRIGGER AS $$
DECLARE
    mission_title TEXT;
    user_name TEXT;
BEGIN
    -- Récupérer le titre de la mission et le nom de l'utilisateur
    SELECT m.title, u.first_name || ' ' || u.last_name
    INTO mission_title, user_name
    FROM missions m, users u
    WHERE m.id = NEW.mission_id AND u.id = NEW.user_id;
    
    -- Notifier l'utilisateur de sa confirmation d'inscription
    INSERT INTO notifications (user_id, title, message, type, mission_id)
    VALUES (
        NEW.user_id,
        'Inscription confirmée',
        'Votre inscription à la mission "' || mission_title || '" a été confirmée.',
        'success',
        NEW.mission_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_notify_mission_registration
    AFTER INSERT ON inscriptions
    FOR EACH ROW
    EXECUTE FUNCTION notify_mission_registration();

COMMIT; 