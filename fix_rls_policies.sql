-- Script pour corriger les politiques RLS des tables de communication
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier et corriger les politiques pour conversation_participants
DROP POLICY IF EXISTS "Users can view conversation participants they are part of" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_select_policy" ON conversation_participants;

CREATE POLICY "Users can view conversation participants"
ON conversation_participants FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE id IN (
      SELECT conversation_id FROM conversation_participants cp2 
      WHERE cp2.user_id = auth.uid()
    )
  )
);

-- 2. Vérifier et corriger les politiques pour users (lecture des profils)
DROP POLICY IF EXISTS "Users can view other users profiles" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;

CREATE POLICY "Users can read all user profiles"
ON users FOR SELECT
USING (true);

-- 3. Vérifier les politiques pour conversations
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;

CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (
  id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- 4. Vérifier les politiques pour messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "messages_select_policy" ON messages;

CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- 5. Politique pour créer des messages
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;

CREATE POLICY "Users can create messages in their conversations"
ON messages FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
  AND sender_id = auth.uid()
);

-- Vérification des politiques créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'messages', 'users')
ORDER BY tablename, policyname; 