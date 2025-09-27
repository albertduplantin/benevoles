# Configuration Supabase Storage pour les Photos de Profil

## Étapes à suivre dans Supabase Dashboard

### 1. Créer le bucket pour les avatars

1. Allez dans votre projet Supabase Dashboard
2. Cliquez sur "Storage" dans la sidebar
3. Cliquez sur "New bucket"
4. Nommez le bucket : `avatars`
5. Rendez-le public : cochez "Public bucket"
6. Cliquez sur "Save"

### 2. Configurer les politiques RLS (Row Level Security)

Exécutez ces requêtes SQL dans l'onglet "SQL Editor" :

```sql
-- Politique pour permettre aux utilisateurs de voir les avatars
INSERT INTO storage.policies (name, bucket_id, action, source, definition)
VALUES ('Public Avatar Access', 'avatars', 'SELECT', 'storage.objects', 'bucket_id = ''avatars''');

-- Politique pour permettre aux utilisateurs authentifiés d'uploader leur avatar
INSERT INTO storage.policies (name, bucket_id, action, source, definition)
VALUES ('User can upload avatar', 'avatars', 'INSERT', 'storage.objects', 'auth.uid()::text = (storage.foldername(name))[1]');

-- Politique pour permettre aux utilisateurs de mettre à jour leur avatar
INSERT INTO storage.policies (name, bucket_id, action, source, definition)
VALUES ('User can update own avatar', 'avatars', 'UPDATE', 'storage.objects', 'auth.uid()::text = (storage.foldername(name))[1]');

-- Politique pour permettre aux utilisateurs de supprimer leur avatar
INSERT INTO storage.policies (name, bucket_id, action, source, definition)
VALUES ('User can delete own avatar', 'avatars', 'DELETE', 'storage.objects', 'auth.uid()::text = (storage.foldername(name))[1]');
```

### 3. Ajouter la colonne avatar_url (optionnel)

Si vous voulez stocker l'URL de l'avatar en base :

```sql
ALTER TABLE users ADD COLUMN avatar_url TEXT;
```

## Test

Une fois configuré, la fonctionnalité de photo de profil sera automatiquement activée !

## Structure des fichiers

Les avatars seront stockés avec le nom : `{user_id}.{extension}`
Exemple : `123e4567-e89b-12d3-a456-426614174000.jpg` 