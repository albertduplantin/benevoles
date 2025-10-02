# Historique du projet « Portail Bénévoles »

Dernière mise à jour : 02/10/2025

---

## 1. Contexte

Le dépôt a été entièrement remplacé par le projet _benevoles_ puis largement enrichi :
* migration vers **Next.js 15 (App Router)**
* intégration **Supabase** (auth, RLS, stockage)
* paiement **Stripe**
* déploiement **Vercel**

## 2. Fonctionnalités implémentées

### Gestion des missions
- Affichage des missions (cards) avec état *Complet / Disponible / À planifier*.
- Création de missions "long cours" (sans dates) et marquage *Urgente*.
- Page *Mes missions* + badge « Inscrit·e ».
- Calendrier interactif (react-big-calendar) localisé en français.

### Administration
- Tableau de bord admin : gestion missions / utilisateurs.
- Export CSV/PDF des paiements (en cours → PDF global prévu, cf. §4).
- Édition du rôle ET du téléphone des bénévoles.

### Authentification
- Connexion / inscription classique + **Google OAuth**.
- Mise à jour immédiate du header via composant `AuthStatus`.
- Forçage du numéro de téléphone pour nouveaux comptes OAuth.

### UX/UI
- `Header` always visible, liens conditionnels (Admin, Mes missions, Calendrier).
- Composant réutilisable `CardMission`.
- Formulaire admin repensé (checkbox *long cours* et *urgent* en tête, infobulles).
- Calendrier couleurs (inscrit = indigo, libre = vert, urgent = rouge).

### Qualité & outillage
- **Zod** pour la validation de toutes les routes API critiques.
- ESLint ignoré en build CI pour Vercel.
- Migration Sentry → @sentry/react / node (compatible React 19).
- Scripts SQL fournis : nouvelles colonnes, RLS, index.

## 3. Correctifs majeurs
- Boucle de redirection admin supprimée.
- Problème d’affichage du statut connecté corrigé.
- Multiples erreurs TypeScript / build Vercel résolues.

## 4. Fonctionnalités restantes / backlog

| Priorité | Tâche | Description |
|----------|-------|-------------|
| ★★★ | **Export PDF complet** | Générer un PDF hors-ligne des missions + planning (voir README § Roadmap). |
| ★★☆ | Archivage PDF sur Supabase Storage | Conserver une copie dans un bucket sécurisé. |
| ★★☆ | Table de présence finale | Ajouter la liste des bénévoles réellement venus (post-évènement). |
| ★☆☆ | Notifications push / mails | Relancer automatiquement sur missions urgentes. |
| ★☆☆ | Tests E2E Playwright | Couvrir les flux principaux (login, inscription mission). |

---

## 5. Scripts utiles

```bash
# Générer types Supabase
supabase gen types typescript --project-id <id> --schema public > src/lib/database.types.ts

# Lancer dev
npm run dev

# Build local avant Vercel
npm run build
```
