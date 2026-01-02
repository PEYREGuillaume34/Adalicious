# 🍔 Adalicious - Application de gestion de restaurant

Application web full-stack permettant aux clients de passer des commandes et au personnel de cuisine de gérer les préparations en temps réel.

## 🚀 Technologies utilisées

- **Frontend** : HTML, CSS, JavaScript (Vanilla)
- **Backend** : Node.js, Express.js
- **Base de données** : PostgreSQL (Neon)
- **Architecture** : REST API

## 📋 Fonctionnalités

### Interface Client
- Saisie du prénom
- Affichage du menu depuis la base de données
- Commande de plats
- Confirmation et suivi de commande

### Interface Cuisine
- Visualisation des commandes en temps réel
- Gestion des statuts (en préparation → prête → livrée)
- Rafraîchissement automatique toutes les 5 secondes
- Interface organisée en colonnes par statut

## 🗄️ Structure de la base de données

- **users** : Stockage des clients
- **menus** : Liste des plats disponibles
- **orders** : Commandes avec relations vers users et menus
- **orders_status** : Statuts des commandes (en_preparation, prete, livree)

## 🛠️ Installation

\`\`\`bash
# Backend
cd adalicious_back
npm install
npm run dev

# Frontend
Ouvrir index.html avec Live Server
\`\`\`

## 📸 Captures d'écran

[Ajoutez des screenshots de votre application]

## 👨‍💻 Auteur

Votre nom - [Votre GitHub]