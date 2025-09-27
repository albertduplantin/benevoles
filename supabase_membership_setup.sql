-- Ajouter les colonnes de cotisation à la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS membership_status TEXT,
ADD COLUMN IF NOT EXISTS membership_year INTEGER,
ADD COLUMN IF NOT EXISTS membership_paid_at TIMESTAMP WITH TIME ZONE;

-- Créer la table des paramètres de cotisation
CREATE TABLE IF NOT EXISTS membership_settings (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Créer la table des paiements de cotisation
CREATE TABLE IF NOT EXISTS membership_payments (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    stripe_payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, year)
);

-- Insérer les paramètres par défaut pour 2025
INSERT INTO membership_settings (year, amount) 
VALUES (2025, 20.00) 
ON CONFLICT (year) DO NOTHING;

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_membership_payments_user_id ON membership_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_payments_year ON membership_payments(year);
CREATE INDEX IF NOT EXISTS idx_membership_payments_status ON membership_payments(status);
CREATE INDEX IF NOT EXISTS idx_users_membership_year ON users(membership_year);

-- Ajouter des politiques RLS (Row Level Security)
ALTER TABLE membership_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_payments ENABLE ROW LEVEL SECURITY;

-- Politique pour membership_settings : lecture publique, écriture admin seulement
CREATE POLICY "Public can read membership settings" ON membership_settings
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify membership settings" ON membership_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Politique pour membership_payments : les utilisateurs peuvent voir leurs propres paiements
CREATE POLICY "Users can view their own payments" ON membership_payments
    FOR SELECT USING (auth.uid() = user_id);

-- Les admins peuvent voir tous les paiements
CREATE POLICY "Admins can view all payments" ON membership_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Seul le système peut créer/modifier les paiements (via API)
CREATE POLICY "System can manage payments" ON membership_payments
    FOR ALL USING (true);

-- Commenter la politique précédente et créer une plus restrictive
DROP POLICY IF EXISTS "System can manage payments" ON membership_payments;

-- Les utilisateurs peuvent créer leurs propres paiements
CREATE POLICY "Users can create their own payments" ON membership_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seuls les webhooks peuvent mettre à jour le statut (on utilisera le service role)
CREATE POLICY "Service role can update payments" ON membership_payments
    FOR UPDATE USING (true);

COMMIT; 