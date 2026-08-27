# Voom Impulse — Espace Admin

Premiers écrans de l'appli : tableau de bord, entreprises, commerciaux, missions.

## Mise en route

1. Copier `.env.local.example` vers `.env.local` et renseigner l'URL et la clé anonyme
   du projet Supabase (Project Settings → API dans le tableau de bord Supabase).
2. Créer les tables : exécuter le schéma SQL déjà validé (entreprises, commerciaux,
   contrats, missions, activites, commissions, stocks_mouvements, factures) dans
   l'éditeur SQL de Supabase, puis les policies Row Level Security.
3. Installer les dépendances : `npm install`
4. Lancer en local : `npm run dev` puis ouvrir `http://localhost:3000`

## Où en est-on

- Écrans Admin construits : tableau de bord (stats + factures à suivre), liste
  des entreprises, liste des commerciaux, liste des missions.
- Ces écrans lisent directement les données Supabase — sans policy RLS admin en
  place, ils ne remonteront rien.
- Formulaires d'ajout (bouton présent mais pas encore connecté), authentification
  par rôle, espace Entreprise et espace Commercial (PWA terrain) restent à construire.

## Prochaines étapes suggérées

1. Brancher l'authentification Supabase (email/mot de passe) avec redirection
   selon le rôle (admin / entreprise / commercial).
2. Connecter les boutons "Ajouter" à de vrais formulaires.
3. Construire l'espace Entreprise (missions, stock miroir, factures).
4. Construire l'espace Commercial en priorité mobile (saisie d'activité quotidienne).
