-- 1. Activer la sécurité RLS sur les tables concernées
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_availability ENABLE ROW LEVEL SECURITY;

-- 2. Policies pour la table users
DROP POLICY IF EXISTS "Lire son propre profil" ON public.users;
CREATE POLICY "Lire son propre profil"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Modifier son propre profil" ON public.users;
CREATE POLICY "Modifier son propre profil"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- 3. Policies pour la table inscriptions
DROP POLICY IF EXISTS "Voir ses propres inscriptions" ON public.inscriptions;
CREATE POLICY "Voir ses propres inscriptions"
  ON public.inscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Créer une inscription" ON public.inscriptions;
CREATE POLICY "Créer une inscription"
  ON public.inscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Modifier ou supprimer sa propre inscription" ON public.inscriptions;
CREATE POLICY "Modifier ou supprimer sa propre inscription"
  ON public.inscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Supprimer sa propre inscription" ON public.inscriptions;
CREATE POLICY "Supprimer sa propre inscription"
  ON public.inscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Policies pour la table user_availability
DROP POLICY IF EXISTS "Lire ses propres disponibilités" ON public.user_availability;
CREATE POLICY "Lire ses propres disponibilités"
  ON public.user_availability
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Modifier ses propres disponibilités" ON public.user_availability;
CREATE POLICY "Modifier ses propres disponibilités"
  ON public.user_availability
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Créer ses propres disponibilités" ON public.user_availability;
CREATE POLICY "Créer ses propres disponibilités"
  ON public.user_availability
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Supprimer ses propres disponibilités" ON public.user_availability;
CREATE POLICY "Supprimer ses propres disponibilités"
  ON public.user_availability
  FOR DELETE
  USING (auth.uid() = user_id); 