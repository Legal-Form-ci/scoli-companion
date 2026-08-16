# Izy-Scoly

Plateforme e-commerce de fournitures scolaires et bureautiques en Côte d'Ivoire.

## À propos

**Izy-Scoly** est une plateforme complète dédiée à la vente de fournitures scolaires et bureautiques, avec un système de publication d'actualités et de gestion multi-vendeurs.

## Fonctionnalités

- **E-commerce** : Catalogue produits, panier, commandes, paiements (KkiaPay, Mobile Money)
- **Multi-vendeurs** : Tableau de bord vendeur, gestion des produits, commissions
- **Actualités** : Publication et modération d'articles avec réactions et partages
- **Authentification** : Email/mot de passe, Google OAuth, Apple Sign-In
- **Notifications** : Push notifications, alertes de sécurité en temps réel
- **Livraison** : Gestion des livraisons avec preuves photo et géolocalisation
- **Messagerie interne** : Communication modérateurs ↔ clients
- **Administration** : Tableau de bord complet avec statistiques et gestion

## Technologies

- **Frontend** : React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend** : Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Paiements** : KkiaPay, Mobile Money
- **Hébergement** : Vercel

## Installation locale

```bash
# Cloner le repository
git clone <URL_GIT>

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## Structure du projet

```
src/
├── components/     # Composants React réutilisables
├── contexts/       # Contextes React (Auth, Cart, Language)
├── hooks/          # Hooks personnalisés
├── pages/          # Pages de l'application
├── integrations/   # Intégrations (Supabase, etc.)
└── i18n/           # Traductions multilingues

supabase/
├── functions/      # Edge Functions (webhooks, API)
└── migrations/     # Migrations SQL
```

## Rôles utilisateurs

- **User** : Client standard
- **Vendor** : Vendeur avec boutique
- **Moderator** : Modération du contenu et support client
- **Delivery** : Livreur avec gestion des preuves
- **Admin** : Administration complète

## Sécurité

- Row Level Security (RLS) sur toutes les tables
- Rate limiting sur les actions sensibles
- Validation des webhooks de paiement
- Alertes de connexion sur nouveaux appareils
- Audit logs des actions administratives

## Licence

Propriétaire - Tous droits réservés © Izy-Scoly
