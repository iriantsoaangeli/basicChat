# 08 — Tester

## A. Sur l'émulateur (recommandé d'abord : 0 quota consommé)

1. Terminal 1, à la racine du projet :
   ```bash
   $ firebase emulators:start
   ```
2. Dans `.env.local`, mets `VITE_USE_EMULATORS=1`
3. Terminal 2 :
   ```bash
   $ npm run dev
   ```
4. Ouvre l'adresse affichée (http://localhost:5173)
5. Ouvre aussi http://127.0.0.1:4000 → onglet **Firestore** : tu vois les documents `notes/...` et `photos/...` apparaître.

### Ce qu'il faut vérifier

| Action dans l'app | Ce que tu dois voir |
|---|---|
| Ouvrir l'app | Onglet **Authentication** de l'émulateur : 1 utilisateur anonyme |
| Ajouter une note sans photo | 1 document dans `notes`, avec `owner`, `title`, `text`, `createdAt`, `updatedAt` |
| Ajouter une note avec photo | 1 document `notes` avec `thumb` et `photoId` + 1 document `photos` |
| Cliquer sur la miniature | La grande photo s'affiche |
| Recharger la page | Les notes sont toujours là (même utilisateur) |
| Supprimer | La note et sa photo disparaissent des deux collections |
| Ouvrir l'app dans une fenêtre privée | Nouvel utilisateur → liste vide (il ne voit pas les notes de l'autre) |

### Tester un refus des règles

1. Dans `src/services/notes.ts`, fonction `createNote`, ajoute **temporairement** juste avant `const ref = await addDoc(...)` :
   ```ts
   Object.assign(data, { couleur: 'rouge' }) // champ non prévu par les règles
   ```
2. Crée une note → l'app doit afficher **« Action refusée par les règles de sécurité. »**
3. **Retire la ligne.**

Même principe pour les autres tests du zip 1 (doc 06) : titre de 101 caractères, etc.

## B. Sur la vraie base

1. Dans `.env.local`, mets `VITE_USE_EMULATORS=0`
2. Vérifie que les règles et l'index sont déployés : `firebase deploy --only firestore` (zip 1, doc 07)
3. Relance `npm run dev`
4. Données visibles ici : 🔗 `https://console.firebase.google.com/project/PROJECT_ID/firestore/databases/-default-/data`

### Erreurs fréquentes

| Message affiché | Cause | Solution |
|---|---|---|
| « Action refusée par les règles » dès l'ouverture | Règles pas déployées (la base est encore « tout fermé ») | `firebase deploy --only firestore` |
| « Index manquant » | Index pas déployé, ou en construction | Attends que l'index soit **Enabled** dans la console |
| Liste vide après chaque redémarrage | Nouvel utilisateur anonyme à chaque fois | Vérifie `indexedDBLocalPersistence` dans `src/firebase/index.ts` |
| `auth/configuration-not-found` ou `auth/operation-not-allowed` | Connexion anonyme non activée | Zip 1, doc 02, étape 3 |
| `auth/invalid-api-key` | `.env.local` mal rempli, ou `npm run dev` pas relancé | Vérifie les 4 valeurs, relance |
