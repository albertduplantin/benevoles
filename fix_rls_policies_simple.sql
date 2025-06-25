-- Script pour corriger les politiques RLS du système de communication
-- Ce script résout les erreurs 406 (Not Acceptable) en simplifiant les politiques

-- Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs conversations" ON conversations;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des conversations" ON conversations;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs conversations" ON conversations;

DROP POLICY IF EXISTS "Les participants peuvent voir leurs participations" ON conversation_participants;
DROP POLICY IF EXISTS "Les créateurs peuvent ajouter des participants" ON conversation_participants;
DROP POLICY IF EXISTS "Les participants peuvent quitter une conversation" ON conversation_participants;

DROP POLICY IF EXISTS "Les participants peuvent voir les messages de leurs conversations" ON messages;
DROP POLICY IF EXISTS "Les participants peuvent envoyer des messages" ON messages;

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs compteurs non lus" ON conversation_unread_counts;
DROP POLICY IF EXISTS "Le système peut mettre à jour les compteurs non lus" ON conversation_unread_counts;

-- Créer des politiques RLS simplifiées et plus permissives

-- Politique pour les conversations
CREATE POLICY "Conversations accessibles aux participants" ON conversations
FOR ALL USING (
  id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Politique pour les participants de conversation
CREATE POLICY "Participants visibles dans leurs conversations" ON conversation_participants
FOR ALL USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Politique pour les messages
CREATE POLICY "Messages accessibles aux participants" ON messages
FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Utilisateurs peuvent envoyer des messages" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Politique pour les compteurs de messages non lus
CREATE POLICY "Compteurs non lus accessibles par utilisateur" ON conversation_unread_counts
FOR ALL USING (user_id = auth.uid());

-- Politique pour la table users (nécessaire pour les jointures)
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir les profils publics" ON users;
CREATE POLICY "Profils utilisateurs accessibles" ON users
FOR SELECT USING (true);

-- Fonction pour marquer les conversations comme lues (corriger les erreurs de fonction)
CREATE OR REPLACE FUNCTION mark_conversation_as_read(p_conversation_id bigint, p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Mettre à jour ou insérer le compteur de messages non lus
  INSERT INTO conversation_unread_counts (conversation_id, user_id, unread_count)
  VALUES (p_conversation_id, p_user_id, 0)
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET unread_count = 0, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions nécessaires sur la fonction
GRANT EXECUTE ON FUNCTION mark_conversation_as_read(bigint, uuid) TO authenticated;

-- Vérifier que RLS est activé
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

-- Message de confirmation
SELECT 'Politiques RLS simplifiées appliquées avec succès!' as status; 