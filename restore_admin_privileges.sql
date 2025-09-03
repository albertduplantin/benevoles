-- SCRIPT POUR RESTAURER LES PRIVILÈGES ADMIN
-- Ce script permet de restaurer les privilèges admin pour un compte de test

-- ============================================
-- 1. VÉRIFICATION DE L'ÉTAT ACTUEL
-- ============================================

SELECT '=== ÉTAT ACTUEL DES UTILISATEURS ===' as info;

-- Afficher tous les utilisateurs avec leurs rôles
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    created_at
FROM users 
ORDER BY created_at DESC;

-- ============================================
-- 2. RESTAURATION DES PRIVILÈGES ADMIN
-- ============================================

SELECT '=== RESTAURATION DES PRIVILÈGES ADMIN ===' as info;

-- Option 1: Restaurer le rôle admin pour le premier utilisateur (généralement le créateur)
UPDATE users 
SET role = 'admin' 
WHERE id = (
    SELECT id FROM users 
    ORDER BY created_at ASC 
    LIMIT 1
);

-- Option 2: Restaurer le rôle admin pour un utilisateur spécifique par email
-- Décommentez et modifiez l'email ci-dessous selon vos besoins
-- UPDATE users 
-- SET role = 'admin' 
-- WHERE email = 'votre-email@exemple.com';

-- Option 3: Créer un utilisateur admin de test (si nécessaire)
-- Décommentez et modifiez les informations ci-dessous
-- INSERT INTO users (
--     id,
--     email,
--     first_name,
--     last_name,
--     role,
--     phone,
--     created_at
-- ) VALUES (
--     gen_random_uuid(),
--     'admin@test.com',
--     'Admin',
--     'Test',
--     'admin',
--     '+33123456789',
--     NOW()
-- );

-- ============================================
-- 3. VÉRIFICATION DES MODIFICATIONS
-- ============================================

SELECT '=== VÉRIFICATION DES MODIFICATIONS ===' as info;

-- Afficher les utilisateurs avec le rôle admin
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    created_at
FROM users 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Compter les utilisateurs par rôle
SELECT 
    role,
    COUNT(*) as count
FROM users 
GROUP BY role
ORDER BY role;

-- ============================================
-- 4. INSTRUCTIONS POUR L'UTILISATEUR
-- ============================================

SELECT '=== INSTRUCTIONS ===' as info;

-- Si vous voulez restaurer les privilèges pour un utilisateur spécifique :
-- 1. Remplacez 'votre-email@exemple.com' par votre vraie adresse email
-- 2. Décommentez la ligne UPDATE correspondante
-- 3. Exécutez le script

-- Si vous voulez créer un nouvel utilisateur admin :
-- 1. Décommentez la section INSERT INTO users
-- 2. Modifiez les informations (email, nom, téléphone)
-- 3. Exécutez le script

SELECT '=== SCRIPT TERMINÉ ===' as info;
