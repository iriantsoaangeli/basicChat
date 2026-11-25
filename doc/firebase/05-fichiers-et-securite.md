# 05 — Fichiers (photos/docs) et règles de sécurité

## ✅ Checklist

- [ ] 1. Générer les fichiers de règles
- [ ] 2. Règles Firestore : tout fermé
- [ ] 3. Règles Storage : chacun son dossier, taille et type limités
- [ ] 4. Déployer les règles
- [ ] 5. Côté app : compresser puis uploader en direct (code dans le doc 07)

---

## Le principe

- **Firestore** : seule ton API y touche. L'API utilise le SDK Admin, qui **ignore** les règles → on peut tout fermer côté client. Résultat : personne ne peut lire/écrire ta base en direct avec ta clé publique.
- **Storage** : l'app uploade **en direct** (pas via l'API) pour ne pas payer le temps CPU et la bande passante Functions pour chaque fichier. La sécurité est donc assurée **par les règles** Storage.

## 1. Générer les fichiers

```bash
$ cd mon-backend
$ firebase init firestore
$ firebase init storage
```

Accepte les noms par défaut (`firestore.rules`, `firestore.indexes.json`, `storage.rules`).

## 2. `firestore.rules`

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tout passe par l'API (SDK Admin) → aucun accès direct depuis l'app
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 3. `storage.rules`

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Chaque utilisateur (même anonyme) a son dossier : users/<son uid>/...
    match /users/{uid}/{fileName} {
      allow read:   if request.auth != null && request.auth.uid == uid;
      allow delete: if request.auth != null && request.auth.uid == uid;
      allow create, update: if request.auth != null
                    && request.auth.uid == uid
                    && request.resource.size < 10 * 1024 * 1024            // 10 Mo max
                    && (request.resource.contentType.matches('image/.*')
                        || request.resource.contentType == 'application/pdf');
    }
    // Tout le reste : interdit
  }
}
```

| Règle | Pourquoi |
|---|---|
| `request.auth.uid == uid` | Un utilisateur ne peut ni lire ni écraser les fichiers d'un autre. |
| `size < 10 Mo` | Empêche qu'on remplisse tes 5 Go gratuits avec quelques fichiers. Baisse à 2-3 Mo si tu ne stockes que des photos compressées. |
| `contentType` | Seulement images et PDF. Ajoute d'autres types si besoin (ex : `'application/vnd.openxmlformats-officedocument.wordprocessingml.document'` pour du .docx). |
| `delete` séparé | À la suppression, `request.resource` n'existe pas → si on l'avait mis dans la même règle que `create`, la suppression serait toujours refusée. |

**Fichiers publics** (ex : photo affichée à tous les utilisateurs) : ajoute un bloc `match /public/{uid}/{fileName}` avec `allow read: if true;` et la même règle d'écriture.

## 4. Déployer les règles

```bash
$ firebase deploy --only firestore:rules,storage
```

Vérifier dans la console :
- 🔗 `https://console.firebase.google.com/project/PROJECT_ID/firestore/rules`
- 🔗 `https://console.firebase.google.com/project/PROJECT_ID/storage/rules`

## 5. Économiser le quota Storage

| Action | Gain |
|---|---|
| Compresser côté app (1600 px, JPEG 80 %) — fonction `compressImage` dans le doc 07 | Photo de 4 Mo → ~300 Ko. Ton quota de 5 Go passe de ~1 200 à ~15 000 photos. |
| Garder l'URL de téléchargement dans Firestore (via l'API) | Évite de re-lister le bucket. |
| Mettre en cache les images dans l'app | Chaque affichage = 1 téléchargement sur 50 000/mois. |
| Supprimer les fichiers orphelins via la tâche planifiée (doc 06) | Stockage qui ne gonfle pas. |

➡️ Suite : `06-push-et-taches.md`
