-- Script SQL complet pour le système de communication
-- Crée toutes les tables nécessaires et applique les politiques RLS

-- ============================================
-- 1. CRÉATION DES TABLES
-- ============================================

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')) DEFAULT 'direct',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des participants aux conversations
CREATE TABLE IF NOT EXISTS conversation_participants (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des annonces
CREATE TABLE IF NOT EXISTS announcements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_roles TEXT[] DEFAULT ARRAY['volunteer', 'coordinator', 'admin'],
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Table pour suivre les lectures d'annonces
CREATE TABLE IF NOT EXISTS announcement_reads (
  id BIGSERIAL PRIMARY KEY,
  announcement_id BIGINT REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

-- 1. Créer la table des compteurs de messages non lus (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS conversation_unread_counts (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unread_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- ============================================
-- 2. SUPPRESSION DES POLICIES EXISTANTES
-- ============================================

-- Supprimer toutes les policies existantes
DROP POLICY IF EXISTS "Authenticated users can view all conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can update conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can view all participants" ON conversation_participants;
DROP POLICY IF EXISTS "Authenticated users can join conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their participation" ON conversation_participants;
DROP POLICY IF EXISTS "Authenticated users can view all messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can view all announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated users can create announcements" ON announcements;
DROP POLICY IF EXISTS "Users can update their own announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated users can view all reads" ON announcement_reads;
DROP POLICY IF EXISTS "Users can manage their own reads" ON announcement_reads;

-- 2. Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs conversations" ON conversations;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des conversations" ON conversations;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs conversations" ON conversations;
DROP POLICY IF EXISTS "Conversations accessibles aux participants" ON conversations;

DROP POLICY IF EXISTS "Les participants peuvent voir leurs participations" ON conversation_participants;
DROP POLICY IF EXISTS "Les créateurs peuvent ajouter des participants" ON conversation_participants;
DROP POLICY IF EXISTS "Les participants peuvent quitter une conversation" ON conversation_participants;
DROP POLICY IF EXISTS "Participants visibles dans leurs conversations" ON conversation_participants;

DROP POLICY IF EXISTS "Les participants peuvent voir les messages de leurs conversations" ON messages;
DROP POLICY IF EXISTS "Les participants peuvent envoyer des messages" ON messages;
DROP POLICY IF EXISTS "Messages accessibles aux participants" ON messages;
DROP POLICY IF EXISTS "Utilisateurs peuvent envoyer des messages" ON messages;

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs compteurs non lus" ON conversation_unread_counts;
DROP POLICY IF EXISTS "Le système peut mettre à jour les compteurs non lus" ON conversation_unread_counts;
DROP POLICY IF EXISTS "Compteurs non lus accessibles par utilisateur" ON conversation_unread_counts;

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir les profils publics" ON users;
DROP POLICY IF EXISTS "Profils utilisateurs accessibles" ON users;

-- ============================================
-- 3. POLICIES SIMPLIFIÉES
-- ============================================

-- Politique pour les conversations
CREATE POLICY "conversation_policy_simple" ON conversations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = conversations.id 
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Politique pour les participants de conversation
CREATE POLICY "participants_policy_simple" ON conversation_participants
FOR ALL USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = conversation_participants.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

-- Politique pour les messages
CREATE POLICY "messages_select_policy_simple" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = messages.conversation_id 
    AND conversation_participants.user_id = auth.uid()
  )
);

CREATE POLICY "messages_insert_policy_simple" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = messages.conversation_id 
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Politique pour les compteurs de messages non lus
CREATE POLICY "unread_counts_policy_simple" ON conversation_unread_counts
FOR ALL USING (user_id = auth.uid());

-- Politique pour la table users (lecture publique)
CREATE POLICY "users_read_policy_simple" ON users
FOR SELECT USING (true);

-- ============================================
-- 4. PERMISSIONS
-- ============================================

-- Donner les permissions nécessaires sur les tables
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON announcements TO authenticated;
GRANT ALL ON announcement_reads TO authenticated;
GRANT ALL ON conversation_unread_counts TO authenticated;
GRANT SELECT ON users TO authenticated;

-- Donner les permissions sur les séquences
GRANT USAGE, SELECT ON SEQUENCE conversations_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE conversation_participants_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE messages_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE announcements_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE announcement_reads_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE conversation_unread_counts_id_seq TO authenticated;

-- ============================================
-- 5. INDEX POUR PERFORMANCE
-- ============================================

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_unread_counts_user_id ON conversation_unread_counts(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_unread_counts_conversation_id ON conversation_unread_counts(conversation_id);

-- ============================================
-- 6. TRIGGERS POUR UPDATED_AT
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. TRIGGERS POUR MESSAGES NON LUS
-- ============================================

-- Fonction pour marquer les conversations comme lues
CREATE OR REPLACE FUNCTION mark_conversation_as_read(p_conversation_id bigint, p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Vérifier que l'utilisateur est participant de la conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant of this conversation';
  END IF;

  -- Mettre à jour ou insérer le compteur de messages non lus
  INSERT INTO conversation_unread_counts (conversation_id, user_id, unread_count)
  VALUES (p_conversation_id, p_user_id, 0)
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET 
    unread_count = 0, 
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter les compteurs de messages non lus
CREATE OR REPLACE FUNCTION increment_unread_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrémenter le compteur pour tous les participants sauf l'expéditeur
  INSERT INTO conversation_unread_counts (conversation_id, user_id, unread_count)
  SELECT NEW.conversation_id, cp.user_id, 1
  FROM conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_id
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET 
    unread_count = conversation_unread_counts.unread_count + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour incrémenter automatiquement les compteurs
DROP TRIGGER IF EXISTS trigger_increment_unread_counts ON messages;
CREATE TRIGGER trigger_increment_unread_counts
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_counts();

-- ============================================
-- 8. MESSAGE DE CONFIRMATION
-- ============================================

-- Message de confirmation
SELECT 'Système de communication configuré avec succès!' as status,
       'Tables créées et politiques RLS appliquées' as details; 

-- 1. Structure de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'conversation_unread_counts' 
ORDER BY ordinal_position; 