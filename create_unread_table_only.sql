-- Script simple pour créer uniquement la table conversation_unread_counts

-- Supprimer la table si elle existe (pour être sûr)
DROP TABLE IF EXISTS conversation_unread_counts CASCADE;

-- Créer la table conversation_unread_counts
CREATE TABLE conversation_unread_counts (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  user_id UUID NOT NULL,
  unread_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Ajouter les contraintes de clés étrangères après création
ALTER TABLE conversation_unread_counts 
ADD CONSTRAINT fk_conversation_unread_counts_conversation_id 
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE conversation_unread_counts 
ADD CONSTRAINT fk_conversation_unread_counts_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Créer les index
CREATE INDEX idx_conversation_unread_counts_user_id ON conversation_unread_counts(user_id);
CREATE INDEX idx_conversation_unread_counts_conversation_id ON conversation_unread_counts(conversation_id);

-- Activer RLS
ALTER TABLE conversation_unread_counts ENABLE ROW LEVEL SECURITY;

-- Créer une politique RLS simple
CREATE POLICY "unread_counts_user_policy" ON conversation_unread_counts
FOR ALL USING (user_id = auth.uid());

-- Donner les permissions
GRANT ALL ON conversation_unread_counts TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE conversation_unread_counts_id_seq TO authenticated;

-- Vérification
SELECT 'Table conversation_unread_counts créée avec succès!' as status; 