-- Script pour corriger les récursions infinies dans les politiques RLS
-- Ce script résout les erreurs de récursion en créant des politiques plus simples

-- Supprimer toutes les politiques existantes qui causent des récursions
DROP POLICY IF EXISTS "conversation_policy_simple" ON conversations;
DROP POLICY IF EXISTS "participants_policy_simple" ON conversation_participants;
DROP POLICY IF EXISTS "messages_select_policy_simple" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy_simple" ON messages;
DROP POLICY IF EXISTS "unread_counts_policy_simple" ON conversation_unread_counts;
DROP POLICY IF EXISTS "users_read_policy_simple" ON users;

DROP POLICY IF EXISTS "Conversations accessibles aux participants" ON conversations;
DROP POLICY IF EXISTS "Participants visibles dans leurs conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Messages accessibles aux participants" ON messages;
DROP POLICY IF EXISTS "Utilisateurs peuvent envoyer des messages" ON messages;
DROP POLICY IF EXISTS "Compteurs non lus accessibles par utilisateur" ON conversation_unread_counts;
DROP POLICY IF EXISTS "Profils utilisateurs accessibles" ON users;

-- Créer des politiques RLS très simples SANS récursion

-- 1. Politique pour conversation_participants (la plus critique)
CREATE POLICY "participant_access" ON conversation_participants
FOR ALL USING (user_id = auth.uid());

-- 2. Politique pour conversations (basée uniquement sur les participants directs)
CREATE POLICY "conversation_access" ON conversations
FOR ALL USING (
  created_by = auth.uid() OR
  id IN (
    SELECT cp.conversation_id 
    FROM conversation_participants cp 
    WHERE cp.user_id = auth.uid()
  )
);

-- 3. Politique pour messages (basée sur les participants directs)
CREATE POLICY "message_select" ON messages
FOR SELECT USING (
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM conversation_participants cp 
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "message_insert" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM conversation_participants cp 
    WHERE cp.user_id = auth.uid()
  )
);

-- 4. Politique pour les compteurs de messages non lus
CREATE POLICY "unread_access" ON conversation_unread_counts
FOR ALL USING (user_id = auth.uid());

-- 5. Politique pour users (lecture publique pour tous les utilisateurs authentifiés)
CREATE POLICY "users_public_read" ON users
FOR SELECT USING (auth.role() = 'authenticated');

-- Vérifier que RLS est activé sur toutes les tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_unread_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Accorder les permissions de base
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, DELETE ON conversation_participants TO authenticated;
GRANT SELECT, INSERT ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversation_unread_counts TO authenticated;
GRANT SELECT ON users TO authenticated;

-- Accorder les permissions sur les séquences
GRANT USAGE, SELECT ON SEQUENCE conversations_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE conversation_participants_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE messages_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE conversation_unread_counts_id_seq TO authenticated;

-- Fonction pour marquer les conversations comme lues (version corrigée)
CREATE OR REPLACE FUNCTION mark_conversation_as_read(p_conversation_id bigint, p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Vérifier que l'utilisateur est participant de la conversation
  IF EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  ) THEN
    -- Mettre à jour ou insérer le compteur de messages non lus
    INSERT INTO conversation_unread_counts (conversation_id, user_id, unread_count)
    VALUES (p_conversation_id, p_user_id, 0)
    ON CONFLICT (conversation_id, user_id)
    DO UPDATE SET unread_count = 0, updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions sur la fonction
GRANT EXECUTE ON FUNCTION mark_conversation_as_read(bigint, uuid) TO authenticated;

-- Message de confirmation
SELECT 'Politiques RLS sans récursion appliquées avec succès!' as status; 