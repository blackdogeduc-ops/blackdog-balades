# Black Dog Balades – Application web

Ce dossier contient une base d'application pour **Black Dog Balades** :

- `index.html` – structure de l'interface
- `style.css` – thème noir & orange
- `script.js` – logique côté client (auth, créneaux, profil, groupes, chat)
- `firebase-config.js` – à remplir avec la config de ton projet Firebase
- `functions/` – code des Cloud Functions pour le matching automatique

## Étapes pour démarrer

1. Crée un projet Firebase (gratuit).
2. Active **Authentication (Email/Mot de passe)**.
3. Active **Firestore** en mode production.
4. Copie la configuration Web de Firebase dans `firebase-config.js`.
5. Déploie les **Cloud Functions** :

```bash
cd functions
npm install
firebase init functions (si nécessaire)
firebase deploy --only functions
```

6. Héberge ce dossier sur **GitHub Pages** (ou autre) :
   - mets `index.html`, `style.css`, `script.js`, `firebase-config.js` à la racine du dépôt.
   - active GitHub Pages.

7. Crée un utilisateur admin dans Firestore (`users/{uid}`) avec :
   - `role = "admin"`
   - `approved = true`

Ensuite :

- Tes membres peuvent créer un compte via l'écran de connexion.
- Tu peux valider les comptes dans l'écran **Admin**.
- Chacun peut choisir ses créneaux dans **Mes disponibilités**.
- Les Cloud Functions créent les **groupes de balade** automatiquement et suggèrent une ville (Niort en cas d'égalité).
- Les membres voient leurs groupes et discutent dans le **chat** intégré.

Ce n'est qu'une base : tu pourras la faire évoluer à ton goût.
