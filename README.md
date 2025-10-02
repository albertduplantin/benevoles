# Portail Bénévoles – Festival du Film Court 🎬

Ce dépôt contient l’application Next.js 15 permettant de gérer les bénévoles, les missions et les cotisations du Festival du Film Court de Clermont-Ferrand.

## Aperçu rapide

| Fonction | Détails |
|----------|---------|
| Authentification | Email + Google OAuth (avec collecte téléphone) |
| Gestion missions | Création (classique, long cours, urgente), inscription, calendrier interactif |
| Administration | Tableau missions & utilisateurs, export CSV, modif rôle + téléphone |
| Paiement | Stripe – cotisation annuelle, webhook sécurisé |
| Base de données | Supabase Postgres, RLS active, stockage avatars |
| Déploiement | Vercel (build automatique), scripts SQL fournis |

## Lancer en local

1. Copier `.env.example` → `.env.local` puis renseigner les variables (Supabase, Stripe…).
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Démarrer le serveur de dev :
   ```bash
   npm run dev
   ```
4. Accéder à http://localhost:3000.

## Build de production
```bash
npm run build
npm start
```

## Documentation complète

Consultez `HISTORIQUE.md` pour le journal détaillé des évolutions et la roadmap à venir.
