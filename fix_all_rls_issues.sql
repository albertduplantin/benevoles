-- SCRIPT DE CORRECTION COMPLET POUR LES PROBLÈMES RLS
-- Ce script corrige tous les problèmes de permissions identifiés

-- ============================================
-- 1. CORRECTION DES NOTIFICATIONS
-- ============================================

SELECT '=== CORRECTION DES NOTIFICATIONS ===' as info;

-- Supprimer les politiques RLS existantes pour les notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
DROP POLICY IF EXISTS "System and admins can create notifications" ON notifications;

-- Créer de nouvelles politiques RLS pour les notifications
CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete_policy" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Politique permissive pour l'insertion (permet aux triggers de fonctionner)
CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT WITH CHECK (
        -- Permettre aux triggers système
        auth.uid() IS NULL OR
        -- Permettre aux utilisateurs de créer leurs propres notifications
        auth.uid() = user_id OR
        -- Permettre aux admins et responsables
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'responsable')
        )
    );

-- ============================================
-- 2. CORRECTION DES INSCRIPTIONS
-- ============================================

SELECT '=== CORRECTION DES INSCRIPTIONS ===' as info;

-- Supprimer toutes les politiques existantes pour repartir à zéro
DROP POLICY IF EXISTS "Voir ses propres inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Créer une inscription" ON public.inscriptions;
DROP POLICY IF EXISTS "Modifier ou supprimer sa propre inscription" ON public.inscriptions;
DROP POLICY IF EXISTS "Supprimer sa propre inscription" ON public.inscriptions;
DROP POLICY IF EXISTS "inscriptions_select_policy" ON public.inscriptions;
DROP POLICY IF EXISTS "inscriptions_insert_policy" ON public.inscriptions;
DROP POLICY IF EXISTS "inscriptions_update_policy" ON public.inscriptions;
DROP POLICY IF EXISTS "inscriptions_delete_policy" ON public.inscriptions;

-- S'assurer que RLS est activé
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

-- Créer de nouvelles politiques RLS pour les inscriptions
CREATE POLICY "inscriptions_select_policy" ON public.inscriptions
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'responsable')
        )
    );

CREATE POLICY "inscriptions_insert_policy" ON public.inscriptions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM missions WHERE id = mission_id)
    );

CREATE POLICY "inscriptions_update_policy" ON public.inscriptions
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'responsable')
        )
    );

CREATE POLICY "inscriptions_delete_policy" ON public.inscriptions
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'responsable')
        )
    );

-- ============================================
-- 3. VÉRIFICATION ET TEST
-- ============================================

SELECT '=== VÉRIFICATION DES POLITIQUES ===' as info;

-- Afficher les politiques pour les inscriptions
SELECT 
    'INSCRIPTIONS' as table_name,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'inscriptions'
ORDER BY policyname;

-- Afficher les politiques pour les notifications
SELECT 
    'NOTIFICATIONS' as table_name,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- ============================================
-- 4. TEST DES PERMISSIONS
-- ============================================

SELECT '=== TEST DES PERMISSIONS ===' as info;

-- Fonction de test pour les inscriptions
CREATE OR REPLACE FUNCTION test_inscription_permissions()
RETURNS TEXT AS $$
DECLARE
    test_result TEXT;
    test_mission_id INTEGER;
BEGIN
    -- Trouver une mission existante pour le test
    SELECT id INTO test_mission_id FROM missions LIMIT 1;
    
    IF test_mission_id IS NULL THEN
        RETURN 'ERROR: Aucune mission trouvée pour le test';
    END IF;
    
    -- Tenter de créer une inscription de test
    BEGIN
        INSERT INTO inscriptions (mission_id, user_id)
        VALUES (test_mission_id, auth.uid());
        
        test_result := 'SUCCESS: Inscription créée avec succès';
        
        -- Nettoyer l'inscription de test
        DELETE FROM inscriptions 
        WHERE mission_id = test_mission_id AND user_id = auth.uid();
        
    EXCEPTION WHEN OTHERS THEN
        test_result := 'ERROR: ' || SQLERRM;
    END;
    
    RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de test pour les notifications
CREATE OR REPLACE FUNCTION test_notification_permissions()
RETURNS TEXT AS $$
DECLARE
    test_result TEXT;
BEGIN
    -- Tenter de créer une notification de test
    BEGIN
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (auth.uid(), 'Test RLS', 'Test des permissions', 'info');
        
        test_result := 'SUCCESS: Notification créée avec succès';
        
        -- Nettoyer la notification de test
        DELETE FROM notifications 
        WHERE title = 'Test RLS' AND message = 'Test des permissions';
        
    EXCEPTION WHEN OTHERS THEN
        test_result := 'ERROR: ' || SQLERRM;
    END;
    
    RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exécuter les tests
SELECT 'Test inscriptions:' as test_type, test_inscription_permissions() as result
UNION ALL
SELECT 'Test notifications:' as test_type, test_notification_permissions() as result;

-- Nettoyer les fonctions de test
DROP FUNCTION IF EXISTS test_inscription_permissions();
DROP FUNCTION IF EXISTS test_notification_permissions();

SELECT '=== CORRECTION TERMINEE ===' as info;
