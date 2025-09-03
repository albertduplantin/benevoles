-- Script de correction pour la table notifications
-- À exécuter si la table existe déjà mais avec des colonnes manquantes

-- Vérifier si la colonne 'read' existe, sinon l'ajouter
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'read'
    ) THEN
        ALTER TABLE notifications ADD COLUMN read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Vérifier si la colonne 'type' existe, sinon l'ajouter
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN type TEXT NOT NULL DEFAULT 'info';
        -- Ajouter la contrainte CHECK
        ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
        CHECK (type IN ('info', 'success', 'warning', 'error'));
    END IF;
END $$;

-- Vérifier si la colonne 'mission_id' existe, sinon l'ajouter
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'mission_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN mission_id UUID REFERENCES missions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Vérifier si la colonne 'updated_at' existe, sinon l'ajouter
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE notifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Créer les index s'ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_mission_id ON notifications(mission_id);

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;

-- Recréer les politiques RLS
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'responsable')
    )
  );

-- Message de confirmation
SELECT 'Table notifications corrigée avec succès!' as message;
