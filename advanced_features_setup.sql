-- =====================================================
-- 🚀 FONCTIONNALITÉS AVANCÉES - SETUP SUPABASE
-- =====================================================

-- 1. Table des templates de missions
CREATE TABLE IF NOT EXISTS mission_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    required_volunteers INTEGER DEFAULT 1,
    duration_hours DECIMAL(3,1) DEFAULT 2.0,
    skills_required TEXT[] DEFAULT '{}',
    equipment_needed TEXT[] DEFAULT '{}',
    instructions TEXT,
    is_urgent BOOLEAN DEFAULT false,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- 2. Table des patterns utilisateur pour l'IA
CREATE TABLE IF NOT EXISTS user_patterns (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_times TEXT[] DEFAULT '{}',
    preferred_locations TEXT[] DEFAULT '{}',
    preferred_categories TEXT[] DEFAULT '{}',
    average_availability DECIMAL(3,2) DEFAULT 0.0,
    response_rate DECIMAL(3,2) DEFAULT 0.0,
    mission_completion_rate DECIMAL(3,2) DEFAULT 0.0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Table des suggestions IA
CREATE TABLE IF NOT EXISTS ai_suggestions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'mission_recommendation', 'availability_prediction', 'conflict_warning', 'optimization_tip'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    confidence DECIMAL(3,2) DEFAULT 0.0,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    action VARCHAR(100),
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 4. Table des conflits de planning
CREATE TABLE IF NOT EXISTS planning_conflicts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mission1_id BIGINT REFERENCES missions(id) ON DELETE CASCADE,
    mission2_id BIGINT REFERENCES missions(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) DEFAULT 'time_overlap', -- 'time_overlap', 'location_conflict', 'capacity_exceeded'
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    description TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table des favoris utilisateur
CREATE TABLE IF NOT EXISTS user_favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id BIGINT REFERENCES missions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, mission_id)
);

-- 6. Table des tags de missions
CREATE TABLE IF NOT EXISTS mission_tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(20) DEFAULT '#3B82F6',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table de liaison missions-tags
CREATE TABLE IF NOT EXISTS mission_tag_relations (
    id BIGSERIAL PRIMARY KEY,
    mission_id BIGINT REFERENCES missions(id) ON DELETE CASCADE,
    tag_id BIGINT REFERENCES mission_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mission_id, tag_id)
);

-- 8. Table des commentaires sur les missions
CREATE TABLE IF NOT EXISTS mission_comments (
    id BIGSERIAL PRIMARY KEY,
    mission_id BIGINT REFERENCES missions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- true pour les commentaires internes (responsables/admin)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Table des notifications par email
CREATE TABLE IF NOT EXISTS email_notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'mission_reminder', 'new_mission', 'conflict_warning', 'achievement'
    subject VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Table des niveaux utilisateur
CREATE TABLE IF NOT EXISTS user_levels (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    level_name VARCHAR(50) DEFAULT 'Débutant',
    badge_color VARCHAR(20) DEFAULT '#6B7280',
    benefits JSONB DEFAULT '{}',
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================
-- INDEXES POUR PERFORMANCE
-- =====================================================

-- Index pour les templates
CREATE INDEX IF NOT EXISTS idx_mission_templates_category ON mission_templates(category);
CREATE INDEX IF NOT EXISTS idx_mission_templates_created_by ON mission_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_mission_templates_usage_count ON mission_templates(usage_count DESC);

-- Index pour les patterns utilisateur
CREATE INDEX IF NOT EXISTS idx_user_patterns_user_id ON user_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_patterns_last_updated ON user_patterns(last_updated DESC);

-- Index pour les suggestions IA
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON ai_suggestions(type);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_priority ON ai_suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_created_at ON ai_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_expires_at ON ai_suggestions(expires_at);

-- Index pour les conflits
CREATE INDEX IF NOT EXISTS idx_planning_conflicts_user_id ON planning_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_planning_conflicts_severity ON planning_conflicts(severity);
CREATE INDEX IF NOT EXISTS idx_planning_conflicts_is_resolved ON planning_conflicts(is_resolved);

-- Index pour les favoris
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_mission_id ON user_favorites(mission_id);

-- Index pour les tags
CREATE INDEX IF NOT EXISTS idx_mission_tag_relations_mission_id ON mission_tag_relations(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_tag_relations_tag_id ON mission_tag_relations(tag_id);

-- Index pour les commentaires
CREATE INDEX IF NOT EXISTS idx_mission_comments_mission_id ON mission_comments(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_comments_user_id ON mission_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_comments_created_at ON mission_comments(created_at DESC);

-- Index pour les notifications email
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at DESC);

-- Index pour les niveaux
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_levels_level ON user_levels(level DESC);

-- =====================================================
-- TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- =====================================================

-- Trigger pour mettre à jour updated_at sur mission_comments
CREATE OR REPLACE FUNCTION update_mission_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mission_comments_updated_at
    BEFORE UPDATE ON mission_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_mission_comments_updated_at();

-- =====================================================
-- RLS POLICIES (Row Level Security)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE mission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_tag_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;

-- Policies pour mission_templates
CREATE POLICY "Everyone can view active templates" ON mission_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON mission_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies pour user_patterns
CREATE POLICY "Users can view their own patterns" ON user_patterns
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage patterns" ON user_patterns
    FOR ALL WITH CHECK (true);

-- Policies pour ai_suggestions
CREATE POLICY "Users can view their own suggestions" ON ai_suggestions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own suggestions" ON ai_suggestions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert suggestions" ON ai_suggestions
    FOR INSERT WITH CHECK (true);

-- Policies pour planning_conflicts
CREATE POLICY "Users can view their own conflicts" ON planning_conflicts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage conflicts" ON planning_conflicts
    FOR ALL WITH CHECK (true);

-- Policies pour user_favorites
CREATE POLICY "Users can manage their own favorites" ON user_favorites
    FOR ALL USING (user_id = auth.uid());

-- Policies pour mission_tags
CREATE POLICY "Everyone can view active tags" ON mission_tags
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage tags" ON mission_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies pour mission_tag_relations
CREATE POLICY "Everyone can view tag relations" ON mission_tag_relations
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage tag relations" ON mission_tag_relations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies pour mission_comments
CREATE POLICY "Users can view mission comments" ON mission_comments
    FOR SELECT USING (
        NOT is_internal OR 
        EXISTS (
            SELECT 1 FROM missions m
            JOIN users u ON u.id = auth.uid()
            WHERE m.id = mission_id AND (u.role = 'admin' OR u.role = 'responsable')
        )
    );

CREATE POLICY "Users can create comments" ON mission_comments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments" ON mission_comments
    FOR UPDATE USING (user_id = auth.uid());

-- Policies pour email_notifications
CREATE POLICY "Users can view their own email notifications" ON email_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage email notifications" ON email_notifications
    FOR ALL WITH CHECK (true);

-- Policies pour user_levels
CREATE POLICY "Users can view their own level" ON user_levels
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage user levels" ON user_levels
    FOR ALL WITH CHECK (true);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour créer une mission à partir d'un template
CREATE OR REPLACE FUNCTION create_mission_from_template(
    template_id_param BIGINT,
    user_id_param UUID,
    custom_date DATE DEFAULT NULL,
    custom_start_time TIME DEFAULT NULL,
    custom_end_time TIME DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    template_record mission_templates%ROWTYPE;
    new_mission_id BIGINT;
    mission_date DATE;
    start_time TIME;
    end_time TIME;
BEGIN
    -- Récupérer le template
    SELECT * INTO template_record FROM mission_templates WHERE id = template_id_param;
    
    IF template_record IS NULL THEN
        RAISE EXCEPTION 'Template non trouvé: %', template_id_param;
    END IF;
    
    -- Déterminer la date et les heures
    mission_date := COALESCE(custom_date, CURRENT_DATE + INTERVAL '7 days');
    start_time := COALESCE(custom_start_time, '09:00'::TIME);
    end_time := COALESCE(custom_end_time, start_time + (template_record.duration_hours || ' hours')::INTERVAL);
    
    -- Créer la mission
    INSERT INTO missions (
        title,
        description,
        location,
        date,
        start_time,
        end_time,
        required_volunteers,
        skills_required,
        equipment_needed,
        instructions,
        is_urgent,
        category,
        status,
        created_by
    ) VALUES (
        template_record.name,
        template_record.description,
        template_record.location,
        mission_date,
        start_time,
        end_time,
        template_record.required_volunteers,
        template_record.skills_required,
        template_record.equipment_needed,
        template_record.instructions,
        template_record.is_urgent,
        template_record.category,
        'draft',
        user_id_param
    ) RETURNING id INTO new_mission_id;
    
    -- Incrémenter le compteur d'utilisation du template
    UPDATE mission_templates 
    SET usage_count = usage_count + 1 
    WHERE id = template_id_param;
    
    RETURN new_mission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour détecter les conflits de planning
CREATE OR REPLACE FUNCTION detect_planning_conflicts(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
    conflict_record RECORD;
BEGIN
    -- Supprimer les anciens conflits non résolus
    DELETE FROM planning_conflicts 
    WHERE user_id = user_id_param AND is_resolved = false;
    
    -- Détecter les nouveaux conflits
    FOR conflict_record IN
        SELECT DISTINCT
            i1.user_id,
            i1.mission_id as mission1_id,
            i2.mission_id as mission2_id,
            'time_overlap' as conflict_type,
            CASE 
                WHEN m1.is_urgent OR m2.is_urgent THEN 'high'
                ELSE 'medium'
            END as severity,
            'Conflit d''horaire entre ' || m1.title || ' et ' || m2.title as description
        FROM inscriptions i1
        JOIN inscriptions i2 ON i1.user_id = i2.user_id AND i1.mission_id < i2.mission_id
        JOIN missions m1 ON i1.mission_id = m1.id
        JOIN missions m2 ON i2.mission_id = m2.id
        WHERE i1.user_id = user_id_param
        AND i1.status = 'confirmed'
        AND i2.status = 'confirmed'
        AND m1.date = m2.date
        AND m1.start_time < m2.end_time
        AND m2.start_time < m1.end_time
    LOOP
        INSERT INTO planning_conflicts (
            user_id,
            mission1_id,
            mission2_id,
            conflict_type,
            severity,
            description
        ) VALUES (
            conflict_record.user_id,
            conflict_record.mission1_id,
            conflict_record.mission2_id,
            conflict_record.conflict_type,
            conflict_record.severity,
            conflict_record.description
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer le niveau d'un utilisateur
CREATE OR REPLACE FUNCTION calculate_user_level(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
    total_points INTEGER;
    new_level INTEGER;
    level_name VARCHAR(50);
    badge_color VARCHAR(20);
BEGIN
    -- Calculer le total de points d'expérience
    SELECT COALESCE(SUM(up.points * pt.points_value), 0) INTO total_points
    FROM user_points up
    JOIN point_types pt ON up.point_type_id = pt.id
    WHERE up.user_id = user_id_param;
    
    -- Déterminer le niveau basé sur les points
    new_level := GREATEST(1, LEAST(50, (total_points / 100) + 1));
    
    -- Déterminer le nom et la couleur du niveau
    CASE 
        WHEN new_level <= 5 THEN
            level_name := 'Débutant';
            badge_color := '#6B7280';
        WHEN new_level <= 15 THEN
            level_name := 'Bénévole';
            badge_color := '#3B82F6';
        WHEN new_level <= 30 THEN
            level_name := 'Expert';
            badge_color := '#10B981';
        WHEN new_level <= 45 THEN
            level_name := 'Maître';
            badge_color := '#F59E0B';
        ELSE
            level_name := 'Légende';
            badge_color := '#8B5CF6';
    END CASE;
    
    -- Mettre à jour ou créer le niveau
    INSERT INTO user_levels (user_id, level, experience_points, level_name, badge_color)
    VALUES (user_id_param, new_level, total_points, level_name, badge_color)
    ON CONFLICT (user_id) DO UPDATE SET
        level = new_level,
        experience_points = total_points,
        level_name = level_name,
        badge_color = badge_color,
        achieved_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Tags par défaut
INSERT INTO mission_tags (name, color, description) VALUES
('urgent', '#EF4444', 'Mission urgente nécessitant une attention immédiate'),
('technique', '#3B82F6', 'Mission nécessitant des compétences techniques'),
('logistique', '#10B981', 'Mission liée à l''organisation et la logistique'),
('communication', '#F59E0B', 'Mission de communication et relations publiques'),
('accueil', '#8B5CF6', 'Mission d''accueil et orientation'),
('securite', '#DC2626', 'Mission de sécurité et surveillance'),
('nettoyage', '#059669', 'Mission de nettoyage et entretien'),
('cuisine', '#D97706', 'Mission liée à la restauration'),
('transport', '#7C3AED', 'Mission de transport et logistique'),
('exterieur', '#16A34A', 'Mission en extérieur')
ON CONFLICT (name) DO NOTHING;

-- Templates par défaut
INSERT INTO mission_templates (name, description, location, required_volunteers, duration_hours, skills_required, equipment_needed, instructions, category) VALUES
('Accueil Festival', 'Accueillir les visiteurs et les orienter vers les différentes activités', 'Hall d''entrée principal', 4, 3.0, ARRAY['Accueil', 'Communication'], ARRAY['Table', 'Chaise', 'Plan du festival'], 'Sourire et être disponible pour les visiteurs', 'accueil'),
('Sécurité Parking', 'Surveiller le parking et s''assurer de la sécurité des véhicules', 'Parking principal', 2, 4.0, ARRAY['Vigilance', 'Communication'], ARRAY['Gilet de sécurité', 'Radio'], 'Rester vigilant et signaler tout incident', 'securite'),
('Nettoyage Espaces', 'Nettoyer et entretenir les espaces communs du festival', 'Espaces communs', 3, 2.0, ARRAY['Organisation'], ARRAY['Produits de nettoyage', 'Équipement de protection'], 'Maintenir la propreté des espaces', 'nettoyage'),
('Service Restauration', 'Servir les repas et boissons aux visiteurs', 'Espace restauration', 6, 3.5, ARRAY['Service client', 'Hygiene'], ARRAY['Tablier', 'Gants', 'Chapeau'], 'Respecter les règles d''hygiène alimentaire', 'cuisine'),
('Transport Matériel', 'Aider au transport et à l''installation du matériel', 'Divers lieux', 4, 2.5, ARRAY['Manutention', 'Organisation'], ARRAY['Gants de protection', 'Chariot'], 'Manipuler le matériel avec précaution', 'transport')
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE mission_templates IS 'Templates de missions réutilisables';
COMMENT ON TABLE user_patterns IS 'Patterns d''activité des utilisateurs pour l''IA';
COMMENT ON TABLE ai_suggestions IS 'Suggestions générées par l''intelligence artificielle';
COMMENT ON TABLE planning_conflicts IS 'Conflits de planning détectés automatiquement';
COMMENT ON TABLE user_favorites IS 'Missions favorites des utilisateurs';
COMMENT ON TABLE mission_tags IS 'Tags pour catégoriser les missions';
COMMENT ON TABLE mission_tag_relations IS 'Relations entre missions et tags';
COMMENT ON TABLE mission_comments IS 'Commentaires sur les missions';
COMMENT ON TABLE email_notifications IS 'Notifications par email';
COMMENT ON TABLE user_levels IS 'Niveaux et expérience des utilisateurs';

COMMENT ON COLUMN mission_templates.usage_count IS 'Nombre de fois que le template a été utilisé';
COMMENT ON COLUMN ai_suggestions.confidence IS 'Niveau de confiance de la suggestion (0.0 à 1.0)';
COMMENT ON COLUMN planning_conflicts.severity IS 'Gravité du conflit: low, medium, high';
COMMENT ON COLUMN mission_comments.is_internal IS 'Commentaire visible uniquement par les responsables/admin';
COMMENT ON COLUMN email_notifications.status IS 'Statut de l''envoi: pending, sent, failed';
COMMENT ON COLUMN user_levels.experience_points IS 'Points d''expérience utilisateur';
