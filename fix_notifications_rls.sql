-- CORRECTION DES POLITIQUES RLS POUR LES NOTIFICATIONS
-- Ce script corrige le problème où les triggers ne peuvent pas créer de notifications
-- à cause des politiques RLS trop restrictives

-- 1. Supprimer les politiques RLS existantes pour les notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;

-- 2. Créer de nouvelles politiques RLS plus permissives
-- Politique pour la lecture : les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Politique pour la mise à jour : les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique pour la suppression : les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Politique pour l'insertion : permettre aux triggers système de créer des notifications
-- ET permettre aux admins/responsables de créer des notifications manuellement
CREATE POLICY "System and admins can create notifications" ON notifications
    FOR INSERT WITH CHECK (
        -- Permettre aux triggers système (auth.uid() peut être NULL dans certains contextes)
        auth.uid() IS NULL OR
        -- Permettre aux utilisateurs de créer leurs propres notifications
        auth.uid() = user_id OR
        -- Permettre aux admins et responsables de créer des notifications
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'responsable')
        )
    );

-- 3. Vérifier que les triggers existent et fonctionnent
SELECT '=== VERIFICATION DES TRIGGERS ===' as info;

-- Vérifier si le trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_mission_notification';

-- 4. Tester la fonction de création de notification
SELECT '=== TEST DE LA FONCTION ===' as info;

-- Vérifier que la fonction existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'create_mission_notification';

-- 5. Optionnel : Créer une fonction de test pour vérifier les permissions
CREATE OR REPLACE FUNCTION test_notification_permissions()
RETURNS TEXT AS $$
DECLARE
    test_result TEXT;
BEGIN
    -- Tenter de créer une notification de test
    BEGIN
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (auth.uid(), 'Test', 'Test notification', 'info');
        
        -- Si on arrive ici, ça a fonctionné
        test_result := 'SUCCESS: Les permissions de notification fonctionnent';
        
        -- Nettoyer la notification de test
        DELETE FROM notifications 
        WHERE title = 'Test' AND message = 'Test notification';
        
    EXCEPTION WHEN OTHERS THEN
        test_result := 'ERROR: ' || SQLERRM;
    END;
    
    RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Exécuter le test
SELECT test_notification_permissions() as test_result;

-- 7. Nettoyer la fonction de test
DROP FUNCTION IF EXISTS test_notification_permissions();

SELECT '=== CORRECTION TERMINEE ===' as info;
