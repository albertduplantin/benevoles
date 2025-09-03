-- CORRECTION DES POLITIQUES RLS POUR LA TABLE INSCRIPTIONS
-- Ce script s'assure que les politiques RLS permettent les inscriptions

-- 1. Vérifier l'état actuel des politiques RLS
SELECT '=== ETAT ACTUEL DES POLITIQUES RLS ===' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'inscriptions'
ORDER BY policyname;

-- 2. Supprimer toutes les politiques existantes pour repartir à zéro
DROP POLICY IF EXISTS "Voir ses propres inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Créer une inscription" ON public.inscriptions;
DROP POLICY IF EXISTS "Modifier ou supprimer sa propre inscription" ON public.inscriptions;
DROP POLICY IF EXISTS "Supprimer sa propre inscription" ON public.inscriptions;

-- 3. Créer de nouvelles politiques RLS claires et fonctionnelles

-- Politique pour SELECT : les utilisateurs peuvent voir leurs propres inscriptions
-- ET les admins/responsables peuvent voir toutes les inscriptions
CREATE POLICY "inscriptions_select_policy" ON public.inscriptions
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'responsable')
        )
    );

-- Politique pour INSERT : les utilisateurs peuvent s'inscrire aux missions
CREATE POLICY "inscriptions_insert_policy" ON public.inscriptions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        -- Vérifier que la mission existe
        EXISTS (SELECT 1 FROM missions WHERE id = mission_id)
    );

-- Politique pour UPDATE : les utilisateurs peuvent modifier leurs propres inscriptions
-- ET les admins/responsables peuvent modifier toutes les inscriptions
CREATE POLICY "inscriptions_update_policy" ON public.inscriptions
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'responsable')
        )
    );

-- Politique pour DELETE : les utilisateurs peuvent supprimer leurs propres inscriptions
-- ET les admins/responsables peuvent supprimer toutes les inscriptions
CREATE POLICY "inscriptions_delete_policy" ON public.inscriptions
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'responsable')
        )
    );

-- 4. Vérifier que RLS est activé
SELECT '=== VERIFICATION RLS ===' as info;

SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'inscriptions';

-- 5. S'assurer que RLS est activé
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

-- 6. Tester les permissions avec une fonction de test
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
        
        -- Si on arrive ici, ça a fonctionné
        test_result := 'SUCCESS: Les permissions d''inscription fonctionnent';
        
        -- Nettoyer l'inscription de test
        DELETE FROM inscriptions 
        WHERE mission_id = test_mission_id AND user_id = auth.uid();
        
    EXCEPTION WHEN OTHERS THEN
        test_result := 'ERROR: ' || SQLERRM;
    END;
    
    RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Exécuter le test
SELECT test_inscription_permissions() as test_result;

-- 8. Nettoyer la fonction de test
DROP FUNCTION IF EXISTS test_inscription_permissions();

-- 9. Afficher les nouvelles politiques
SELECT '=== NOUVELLES POLITIQUES RLS ===' as info;

SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'inscriptions'
ORDER BY policyname;

SELECT '=== CORRECTION TERMINEE ===' as info;
