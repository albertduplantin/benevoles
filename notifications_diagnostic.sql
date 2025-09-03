-- Script de diagnostic et correction complète pour la table notifications
-- Ce script va diagnostiquer et corriger tous les problèmes

-- 1. DIAGNOSTIC : Vérifier l'état actuel de la table
SELECT '=== DIAGNOSTIC DE LA TABLE NOTIFICATIONS ===' as info;

-- Vérifier si la table existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
        THEN '✅ Table notifications existe'
        ELSE '❌ Table notifications n''existe pas'
    END as table_status;

-- Lister toutes les colonnes existantes
SELECT 'Colonnes actuelles dans la table notifications:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 2. CORRECTION : Supprimer et recréer la table complètement
SELECT '=== SUPPRESSION ET RECREATION DE LA TABLE ===' as info;

-- Supprimer la table existante (ATTENTION: cela supprime toutes les données)
DROP TABLE IF EXISTS notifications CASCADE;

-- Recréer la table avec le bon schéma
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT FALSE,
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INDEX ET PERFORMANCE
SELECT '=== CREATION DES INDEX ===' as info;

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_mission_id ON notifications(mission_id);
CREATE INDEX idx_notifications_type ON notifications(type);

-- 4. SECURITE RLS
SELECT '=== CONFIGURATION RLS ===' as info;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'responsable')
        )
    );

-- 5. TRIGGERS AUTOMATIQUES
SELECT '=== CREATION DES TRIGGERS ===' as info;

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

-- 6. VERIFICATION FINALE
SELECT '=== VERIFICATION FINALE ===' as info;

-- Vérifier la structure finale
SELECT 'Structure finale de la table notifications:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Vérifier les politiques RLS
SELECT 'Politiques RLS créées:' as info;
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'notifications';

-- Vérifier les triggers
SELECT 'Triggers créés:' as info;
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'notifications';

-- Message de succès
SELECT '🎉 Table notifications créée avec succès! Toutes les colonnes sont présentes.' as success_message;
