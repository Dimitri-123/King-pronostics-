# King Pronostics — Site web

Projet React (Vite) prêt pour GitHub → Vercel, avec paiement Mobile Money (NotchPay), PWA installable, dashboard privé, galerie de tickets, pronostics verrouillés, cotes/matchs en direct, et témoignages défilants.

## ⚠️ À faire AVANT de déployer

### 1. Régénère tes clés NotchPay
Les 3 clés collées plus tôt dans le chat (publique, privée, hachage) doivent être considérées comme compromises. Va sur https://business.notchpay.co/developer/api-keys et régénère les trois. Ne les mets JAMAIS dans le code — uniquement dans les variables d'environnement Vercel (étape 4). La clé publique sert à initier les paiements, la clé privée est réservée aux opérations sensibles (versements vers le numéro de Kelvin), et la clé de hachage sert à vérifier l'authenticité des webhooks.

### 2. Structure des dossiers
```
king-pronostics-app/
├── api/                     fonctions serveur Vercel (paiement)
│   ├── initiate-payment.js
│   └── verify-payment.js
├── src/
│   ├── pages/               Accueil, Matchs, Galerie, Pronostics, Témoignages, Dashboard
│   ├── components/
│   ├── data/                données mock + générateur de 500 témoignages
│   ├── context/              FR/EN
│   └── lib/                  API football, stockage local (à remplacer par une vraie BDD)
├── public/
│   ├── manifest.json         config PWA
│   ├── sw.js                 service worker (installation app)
│   └── icons/
└── .env.example
```

### 3. Pousser sur GitHub (relié à Vercel)
```bash
git init
git add .
git commit -m "King Pronostics - site initial"
git branch -M main
git remote add origin https://github.com/TON-USERNAME/king-pronostics.git
git push -u origin main
```
Sur vercel.com → "Add New Project" → importe ce repo GitHub. Vercel détecte Vite automatiquement.

### 4. Variables d'environnement (Vercel → Settings → Environment Variables)
- VITE_RAPIDAPI_KEY = ta clé API-Football
- VITE_RECIPIENT_DISPLAY_NAME = nom affiché avant paiement (ex: Kelvin - King Pronostics)
- VITE_ADMIN_PASSWORD = mot de passe du dashboard (choisis-en un fort)
- NOTCHPAY_PUBLIC_KEY = ta nouvelle clé publique NotchPay régénérée (commence par pk. ou sb_pk. en sandbox)
- NOTCHPAY_PRIVATE_KEY = ta nouvelle clé privée régénérée (jamais dans le code, jamais côté client)
- NOTCHPAY_HASH_KEY = ta nouvelle clé de hachage (réservée à la vérification des webhooks, pas encore utilisée)
- RECIPIENT_NAME = nom du bénéficiaire (ex: Kelvin - King Pronostics)
- RECIPIENT_MSISDN = le numéro MTN qui reçoit l'argent

### 5. Nom de domaine .com
Une fois le site en ligne sur xxx.vercel.app, achète ton domaine puis dans Vercel → Settings → Domains → ajoute ton .com et suis les instructions DNS.

## Développement local
```bash
npm install
cp .env.example .env
npm run dev
```

## Ce qui est simulé pour l'instant (à connecter avant le vrai lancement)
- Stockage des paiements/tickets/pronostics : actuellement en localStorage (par appareil). Avant le lancement réel, connecte une vraie base de données (Vercel Postgres, Supabase ou Firebase) pour que toi et Mr Kelvin voyiez les mêmes données en temps réel.
- Upload d'images de tickets : le formulaire existe mais il faut connecter un service de stockage (Cloudinary ou Vercel Blob).
- Paiement NotchPay : le code appelle l'API selon leur documentation standard — teste d'abord en mode sandbox avant la production.

## Fonctionnalités incluses
- Toggle langue FR/EN persistant
- Frais de 100 FCFA ajoutés automatiquement (2000 → 2100)
- Confirmation avec nom du bénéficiaire avant paiement
- Dashboard privé (mot de passe) : revenus du jour, répartition automatique du pourcentage, upload tickets/pronostics, historique paiements
- Pronostics floutés/verrouillés → paiement → déverrouillage
- Galerie de tickets avec statuts (en cours / validé / en attente)
- 500 témoignages générés automatiquement, en défilement infini
- Matchs du jour + cotes (API-Football) + codes promo
- PWA installable (pop-up "Installer l'application")
- Design signature : sceau de validation circulaire (vert forêt + or)
