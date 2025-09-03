-- =====================================================
-- 🚀 SYSTÈME DE CHAT/COMMUNICATION - SETUP SUPABASE
-- =====================================================

-- 1. Table des conversations/chat rooms
CREATE TABLE IF NOT EXISTS chat_rooms (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'mission', -- 'mission', 'global', 'admin', 'responsable'
    mission_id BIGINT REFERENCES missions(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 2. Table des messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'file', 'system'
    file_url TEXT, -- URL du fichier si c'est un message avec fichier
    file_name TEXT, -- Nom du fichier
    file_size INTEGER, -- Taille du fichier en bytes
    reply_to_id BIGINT REFERENCES chat_messages(id) ON DELETE SET NULL, -- Pour les réponses
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des participants aux conversations
CREATE TABLE IF NOT EXISTS chat_participants (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'admin', 'moderator', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT false,
    UNIQUE(room_id, user_id)
);

-- 4. Table des réactions aux messages
CREATE TABLE IF NOT EXISTS chat_reactions (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL, -- 😀, 👍, ❤️, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- 5. Table des messages épinglés
CREATE TABLE IF NOT EXISTS chat_pinned_messages (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES chat_messages(id) ON DELETE CASCADE,
    pinned_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES POUR PERFORMANCE
-- =====================================================

-- Index pour les messages par room
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Index pour les participants
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);

-- Index pour les réactions
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message_id ON chat_reactions(message_id);

-- =====================================================
-- TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- =====================================================

-- Trigger pour mettre à jour updated_at sur chat_rooms
CREATE OR REPLACE FUNCTION update_chat_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_rooms_updated_at
    BEFORE UPDATE ON chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_rooms_updated_at();

-- Trigger pour mettre à jour updated_at sur chat_messages
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_messages_updated_at();

-- =====================================================
-- RLS POLICIES (Row Level Security)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_pinned_messages ENABLE ROW LEVEL SECURITY;

-- Policies pour chat_rooms
CREATE POLICY "Users can view rooms they participate in" ON chat_rooms
    FOR SELECT USING (
        id IN (
            SELECT room_id FROM chat_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can create rooms" ON chat_rooms
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Room creators can update their rooms" ON chat_rooms
    FOR UPDATE USING (created_by = auth.uid());

-- Policies pour chat_messages
CREATE POLICY "Users can view messages in rooms they participate in" ON chat_messages
    FOR SELECT USING (
        room_id IN (
            SELECT room_id FROM chat_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages in rooms they participate in" ON chat_messages
    FOR INSERT WITH CHECK (
        room_id IN (
            SELECT room_id FROM chat_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON chat_messages
    FOR DELETE USING (user_id = auth.uid());

-- Policies pour chat_participants
CREATE POLICY "Users can view participants in rooms they participate in" ON chat_participants
    FOR SELECT USING (
        room_id IN (
            SELECT room_id FROM chat_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can add participants" ON chat_participants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can leave rooms" ON chat_participants
    FOR DELETE USING (user_id = auth.uid());

-- Policies pour chat_reactions
CREATE POLICY "Users can view reactions in rooms they participate in" ON chat_reactions
    FOR SELECT USING (
        message_id IN (
            SELECT cm.id FROM chat_messages cm
            JOIN chat_participants cp ON cm.room_id = cp.room_id
            WHERE cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add reactions in rooms they participate in" ON chat_reactions
    FOR INSERT WITH CHECK (
        message_id IN (
            SELECT cm.id FROM chat_messages cm
            JOIN chat_participants cp ON cm.room_id = cp.room_id
            WHERE cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove their own reactions" ON chat_reactions
    FOR DELETE USING (user_id = auth.uid());

-- Policies pour chat_pinned_messages
CREATE POLICY "Users can view pinned messages in rooms they participate in" ON chat_pinned_messages
    FOR SELECT USING (
        message_id IN (
            SELECT cm.id FROM chat_messages cm
            JOIN chat_participants cp ON cm.room_id = cp.room_id
            WHERE cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can pin messages" ON chat_pinned_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour créer une conversation de mission automatiquement
CREATE OR REPLACE FUNCTION create_mission_chat_room(mission_id_param BIGINT)
RETURNS BIGINT AS $$
DECLARE
    room_id BIGINT;
    mission_title TEXT;
BEGIN
    -- Récupérer le titre de la mission
    SELECT title INTO mission_title FROM missions WHERE id = mission_id_param;
    
    -- Créer la room de chat
    INSERT INTO chat_rooms (name, description, type, mission_id, created_by)
    VALUES (
        'Mission: ' || mission_title,
        'Chat pour la mission: ' || mission_title,
        'mission',
        mission_id_param,
        auth.uid()
    ) RETURNING id INTO room_id;
    
    -- Ajouter le créateur comme participant
    INSERT INTO chat_participants (room_id, user_id, role)
    VALUES (room_id, auth.uid(), 'admin');
    
    RETURN room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour ajouter automatiquement les bénévoles inscrits à une mission
CREATE OR REPLACE FUNCTION add_mission_volunteers_to_chat(mission_id_param BIGINT)
RETURNS VOID AS $$
DECLARE
    room_id BIGINT;
    volunteer_record RECORD;
BEGIN
    -- Trouver la room de chat de la mission
    SELECT id INTO room_id FROM chat_rooms 
    WHERE mission_id = mission_id_param AND type = 'mission';
    
    IF room_id IS NULL THEN
        RAISE EXCEPTION 'Room de chat non trouvée pour la mission %', mission_id_param;
    END IF;
    
    -- Ajouter tous les bénévoles inscrits
    FOR volunteer_record IN 
        SELECT DISTINCT i.user_id 
        FROM inscriptions i 
        WHERE i.mission_id = mission_id_param
    LOOP
        -- Ajouter le participant s'il n'existe pas déjà
        INSERT INTO chat_participants (room_id, user_id, role)
        VALUES (room_id, volunteer_record.user_id, 'member')
        ON CONFLICT (room_id, user_id) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Créer la room de chat global
INSERT INTO chat_rooms (name, description, type, created_by)
VALUES (
    'Chat Global',
    'Conversation générale pour tous les bénévoles',
    'global',
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Ajouter tous les utilisateurs au chat global
INSERT INTO chat_participants (room_id, user_id, role)
SELECT 
    cr.id,
    u.id,
    CASE 
        WHEN u.role = 'admin' THEN 'admin'
        WHEN u.role = 'responsable' THEN 'moderator'
        ELSE 'member'
    END
FROM chat_rooms cr
CROSS JOIN users u
WHERE cr.type = 'global'
ON CONFLICT (room_id, user_id) DO NOTHING;

-- =====================================================
-- ACTIVATION DU REALTIME
-- =====================================================

-- Activer le realtime pour les tables de chat
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_reactions;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE chat_rooms IS 'Conversations/chat rooms du système';
COMMENT ON TABLE chat_messages IS 'Messages dans les conversations';
COMMENT ON TABLE chat_participants IS 'Participants aux conversations';
COMMENT ON TABLE chat_reactions IS 'Réactions aux messages (emojis)';
COMMENT ON TABLE chat_pinned_messages IS 'Messages épinglés dans les conversations';

COMMENT ON COLUMN chat_rooms.type IS 'Type de conversation: mission, global, admin, responsable';
COMMENT ON COLUMN chat_messages.message_type IS 'Type de message: text, image, file, system';
COMMENT ON COLUMN chat_participants.role IS 'Rôle dans la conversation: admin, moderator, member';
