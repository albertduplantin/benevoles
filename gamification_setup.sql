-- =====================================================
-- 🏆 SYSTÈME DE GAMIFICATION - SETUP SUPABASE
-- =====================================================

-- 1. Table des types de points et récompenses
CREATE TABLE IF NOT EXISTS point_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points_value INTEGER NOT NULL DEFAULT 1,
    icon VARCHAR(10) DEFAULT '⭐',
    color VARCHAR(20) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des badges
CREATE TABLE IF NOT EXISTS badges (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10) DEFAULT '🏆',
    color VARCHAR(20) DEFAULT '#F59E0B',
    rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
    requirements JSONB, -- Conditions pour obtenir le badge
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des points des utilisateurs
CREATE TABLE IF NOT EXISTS user_points (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    point_type_id BIGINT REFERENCES point_types(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 1,
    source_type VARCHAR(50) NOT NULL, -- 'mission_completion', 'badge_earned', 'challenge_completed', 'bonus'
    source_id BIGINT, -- ID de la mission, badge, challenge, etc.
    description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, point_type_id, source_type, source_id)
);

-- 4. Table des badges des utilisateurs
CREATE TABLE IF NOT EXISTS user_badges (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id BIGINT REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- 5. Table des défis
CREATE TABLE IF NOT EXISTS challenges (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'mission_count', 'points_total', 'streak', 'special'
    target_value INTEGER NOT NULL,
    reward_points INTEGER DEFAULT 0,
    reward_badge_id BIGINT REFERENCES badges(id) ON DELETE SET NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_recurring BOOLEAN DEFAULT false, -- Pour les défis répétables
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table des progrès des défis
CREATE TABLE IF NOT EXISTS challenge_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id BIGINT REFERENCES challenges(id) ON DELETE CASCADE,
    current_value INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- 7. Table des streaks (séries)
CREATE TABLE IF NOT EXISTS user_streaks (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    streak_type VARCHAR(50) NOT NULL, -- 'missions', 'days_active', 'weeks_active'
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

-- 8. Table des célébrations/notifications de gamification
CREATE TABLE IF NOT EXISTS gamification_notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'points_earned', 'badge_earned', 'challenge_completed', 'streak_milestone'
    title VARCHAR(200) NOT NULL,
    message TEXT,
    points INTEGER DEFAULT 0,
    badge_id BIGINT REFERENCES badges(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES POUR PERFORMANCE
-- =====================================================

-- Index pour les points des utilisateurs
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_earned_at ON user_points(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_source ON user_points(source_type, source_id);

-- Index pour les badges des utilisateurs
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC);

-- Index pour les progrès des défis
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_id ON challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge_id ON challenge_progress(challenge_id);

-- Index pour les streaks
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);

-- Index pour les notifications de gamification
CREATE INDEX IF NOT EXISTS idx_gamification_notifications_user_id ON gamification_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_notifications_created_at ON gamification_notifications(created_at DESC);

-- =====================================================
-- TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- =====================================================

-- Trigger pour mettre à jour updated_at sur challenge_progress
CREATE OR REPLACE FUNCTION update_challenge_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_challenge_progress_updated_at
    BEFORE UPDATE ON challenge_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_challenge_progress_updated_at();

-- Trigger pour mettre à jour updated_at sur user_streaks
CREATE OR REPLACE FUNCTION update_user_streaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_streaks_updated_at
    BEFORE UPDATE ON user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streaks_updated_at();

-- =====================================================
-- RLS POLICIES (Row Level Security)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE point_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_notifications ENABLE ROW LEVEL SECURITY;

-- Policies pour point_types
CREATE POLICY "Everyone can view point types" ON point_types
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage point types" ON point_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies pour badges
CREATE POLICY "Everyone can view badges" ON badges
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage badges" ON badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies pour user_points
CREATE POLICY "Users can view their own points" ON user_points
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert points" ON user_points
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all points" ON user_points
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies pour user_badges
CREATE POLICY "Users can view their own badges" ON user_badges
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert badges" ON user_badges
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all badges" ON user_badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies pour challenges
CREATE POLICY "Everyone can view active challenges" ON challenges
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage challenges" ON challenges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies pour challenge_progress
CREATE POLICY "Users can view their own progress" ON challenge_progress
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage progress" ON challenge_progress
    FOR ALL WITH CHECK (true);

-- Policies pour user_streaks
CREATE POLICY "Users can view their own streaks" ON user_streaks
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage streaks" ON user_streaks
    FOR ALL WITH CHECK (true);

-- Policies pour gamification_notifications
CREATE POLICY "Users can view their own notifications" ON gamification_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON gamification_notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON gamification_notifications
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour calculer le total de points d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_total_points(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER;
BEGIN
    SELECT COALESCE(SUM(up.points * pt.points_value), 0) INTO total_points
    FROM user_points up
    JOIN point_types pt ON up.point_type_id = pt.id
    WHERE up.user_id = user_id_param;
    
    RETURN total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour attribuer des points à un utilisateur
CREATE OR REPLACE FUNCTION award_points(
    user_id_param UUID,
    point_type_name VARCHAR(100),
    points_param INTEGER DEFAULT 1,
    source_type_param VARCHAR(50),
    source_id_param BIGINT DEFAULT NULL,
    description_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    point_type_id_var BIGINT;
BEGIN
    -- Récupérer l'ID du type de point
    SELECT id INTO point_type_id_var FROM point_types WHERE name = point_type_name;
    
    IF point_type_id_var IS NULL THEN
        RAISE EXCEPTION 'Type de point non trouvé: %', point_type_name;
    END IF;
    
    -- Insérer les points (avec ON CONFLICT pour éviter les doublons)
    INSERT INTO user_points (user_id, point_type_id, points, source_type, source_id, description)
    VALUES (user_id_param, point_type_id_var, points_param, source_type_param, source_id_param, description_param)
    ON CONFLICT (user_id, point_type_id, source_type, source_id) DO NOTHING;
    
    -- Créer une notification
    INSERT INTO gamification_notifications (user_id, type, title, message, points)
    VALUES (
        user_id_param,
        'points_earned',
        'Points gagnés !',
        COALESCE(description_param, 'Vous avez gagné ' || points_param || ' points !'),
        points_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour attribuer un badge à un utilisateur
CREATE OR REPLACE FUNCTION award_badge(
    user_id_param UUID,
    badge_id_param BIGINT
)
RETURNS VOID AS $$
DECLARE
    badge_name_var VARCHAR(100);
BEGIN
    -- Récupérer le nom du badge
    SELECT name INTO badge_name_var FROM badges WHERE id = badge_id_param;
    
    IF badge_name_var IS NULL THEN
        RAISE EXCEPTION 'Badge non trouvé: %', badge_id_param;
    END IF;
    
    -- Insérer le badge (avec ON CONFLICT pour éviter les doublons)
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (user_id_param, badge_id_param)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    
    -- Créer une notification
    INSERT INTO gamification_notifications (user_id, type, title, message, badge_id)
    VALUES (
        user_id_param,
        'badge_earned',
        'Nouveau badge !',
        'Félicitations ! Vous avez gagné le badge "' || badge_name_var || '" !',
        badge_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour les streaks
CREATE OR REPLACE FUNCTION update_user_streak(
    user_id_param UUID,
    streak_type_param VARCHAR(50)
)
RETURNS VOID AS $$
DECLARE
    current_streak_var INTEGER;
    longest_streak_var INTEGER;
    last_activity_var DATE;
    today_var DATE := CURRENT_DATE;
BEGIN
    -- Récupérer les données actuelles
    SELECT current_streak, longest_streak, last_activity_date
    INTO current_streak_var, longest_streak_var, last_activity_var
    FROM user_streaks
    WHERE user_id = user_id_param AND streak_type = streak_type_param;
    
    -- Si c'est le premier streak ou si c'est un nouveau jour
    IF current_streak_var IS NULL THEN
        INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date)
        VALUES (user_id_param, streak_type_param, 1, 1, today_var);
    ELSIF last_activity_var < today_var THEN
        -- Vérifier si c'est consécutif (hier)
        IF last_activity_var = today_var - INTERVAL '1 day' THEN
            current_streak_var := current_streak_var + 1;
        ELSE
            current_streak_var := 1; -- Reset si pas consécutif
        END IF;
        
        -- Mettre à jour le plus long streak
        IF current_streak_var > longest_streak_var THEN
            longest_streak_var := current_streak_var;
        END IF;
        
        UPDATE user_streaks
        SET current_streak = current_streak_var,
            longest_streak = longest_streak_var,
            last_activity_date = today_var
        WHERE user_id = user_id_param AND streak_type = streak_type_param;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Types de points par défaut
INSERT INTO point_types (name, description, points_value, icon, color) VALUES
('Mission Complétée', 'Points pour avoir complété une mission', 10, '🎯', '#10B981'),
('Mission Urgente', 'Points bonus pour une mission urgente', 15, '🚨', '#EF4444'),
('Première Mission', 'Points bonus pour la première mission', 25, '🌟', '#F59E0B'),
('Streak 7 jours', 'Points pour 7 jours consécutifs', 50, '🔥', '#F97316'),
('Streak 30 jours', 'Points pour 30 jours consécutifs', 200, '💎', '#8B5CF6'),
('Badge Gagné', 'Points pour avoir gagné un badge', 5, '🏆', '#F59E0B'),
('Défi Complété', 'Points pour avoir complété un défi', 100, '🎖️', '#EC4899'),
('Participation Chat', 'Points pour participation active au chat', 2, '💬', '#06B6D4'),
('Aide Bénévole', 'Points pour avoir aidé un autre bénévole', 20, '🤝', '#84CC16')
ON CONFLICT DO NOTHING;

-- Badges par défaut
INSERT INTO badges (name, description, icon, color, rarity) VALUES
('Premier Pas', 'Compléter votre première mission', '👶', '#10B981', 'common'),
('Bénévole Actif', 'Compléter 5 missions', '⭐', '#3B82F6', 'common'),
('Super Bénévole', 'Compléter 10 missions', '🌟', '#F59E0B', 'rare'),
('Héros Local', 'Compléter 25 missions', '🦸', '#EF4444', 'epic'),
('Légende', 'Compléter 50 missions', '👑', '#8B5CF6', 'legendary'),
('Urgence', 'Compléter 3 missions urgentes', '🚨', '#EF4444', 'rare'),
('Streak Master', 'Maintenir un streak de 30 jours', '🔥', '#F97316', 'epic'),
('Chatteur', 'Envoyer 100 messages dans le chat', '💬', '#06B6D4', 'common'),
('Entraide', 'Aider 5 autres bénévoles', '🤝', '#84CC16', 'rare'),
('Fidèle', 'Être bénévole depuis 1 an', '💎', '#8B5CF6', 'legendary')
ON CONFLICT DO NOTHING;

-- Défis par défaut
INSERT INTO challenges (name, description, type, target_value, reward_points, reward_badge_id, is_recurring) VALUES
('Premier Défi', 'Complétez votre première mission', 'mission_count', 1, 25, (SELECT id FROM badges WHERE name = 'Premier Pas'), false),
('Bénévole Actif', 'Complétez 5 missions ce mois', 'mission_count', 5, 100, (SELECT id FROM badges WHERE name = 'Bénévole Actif'), true),
('Streak de Feu', 'Maintenez un streak de 7 jours', 'streak', 7, 50, NULL, false),
('Chatteur Pro', 'Envoyez 50 messages ce mois', 'points_total', 50, 25, (SELECT id FROM badges WHERE name = 'Chatteur'), true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE point_types IS 'Types de points et leurs valeurs';
COMMENT ON TABLE badges IS 'Badges disponibles dans le système';
COMMENT ON TABLE user_points IS 'Points gagnés par les utilisateurs';
COMMENT ON TABLE user_badges IS 'Badges gagnés par les utilisateurs';
COMMENT ON TABLE challenges IS 'Défis disponibles pour les utilisateurs';
COMMENT ON TABLE challenge_progress IS 'Progrès des utilisateurs dans les défis';
COMMENT ON TABLE user_streaks IS 'Séries (streaks) des utilisateurs';
COMMENT ON TABLE gamification_notifications IS 'Notifications de gamification';

COMMENT ON COLUMN badges.rarity IS 'Rareté du badge: common, rare, epic, legendary';
COMMENT ON COLUMN challenges.type IS 'Type de défi: mission_count, points_total, streak, special';
COMMENT ON COLUMN user_streaks.streak_type IS 'Type de streak: missions, days_active, weeks_active';
