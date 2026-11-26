# 06 — Les règles de sécurité

## À quoi ça sert

Sans serveur, **c'est ta seule protection**. La configuration Firebase est lisible dans l'APK, donc n'importe qui peut appeler ta base sans passer par ton app. Les règles font deux choses :
1. **contrôle d'accès** : qui peut lire / créer / modifier / supprimer ;
2. **validation** : quels champs, quels types, quelles tailles.

**Fichier :** `firestore.rules`, à la racine du projet Vue (à côté de `package.json`).

## Le fichier complet

Traduction directe du dictionnaire des champs du doc 04.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ---------- Fonctions utilitaires ----------
    function signedIn() { return request.auth != null; }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }

    // ---------- notes/{noteId} ----------
    // Une note valide : seulement ces champs, avec ces types et ces tailles
    function validNote(d) {
      return d.keys().hasAll(['owner', 'title', 'text', 'createdAt', 'updatedAt'])
          && d.keys().hasOnly(['owner', 'title', 'text', 'thumb', 'photoId', 'createdAt', 'updatedAt'])
          && d.title is string && d.title.size() > 0 && d.title.size() <= 100
          && d.text is string && d.text.size() <= 5000
          && (!('thumb' in d) || (d.thumb is string && d.thumb.size() <= 30000))
          && (!('photoId' in d) || d.photoId is string);
    }

    match /notes/{noteId} {
      // Lire : seulement ses propres notes
      allow read: if isOwner(resource.data.owner);

      // Créer : en son nom, données valides, dates = heure du serveur
      allow create: if isOwner(request.resource.data.owner)
                    && validNote(request.resource.data)
                    && request.resource.data.createdAt == request.time
                    && request.resource.data.updatedAt == request.time;

      // Modifier : ses notes, seulement titre/texte/photo, owner et createdAt figés
      allow update: if isOwner(resource.data.owner)
                    && validNote(request.resource.data)
                    && request.resource.data.diff(resource.data).affectedKeys()
                         .hasOnly(['title', 'text', 'thumb', 'photoId', 'updatedAt'])
                    && request.resource.data.updatedAt == request.time;

      // Supprimer : ses notes
      allow delete: if isOwner(resource.data.owner);
    }

    // ---------- photos/{photoId} : grande photo en base64 ----------
    match /photos/{photoId} {
      allow read:   if isOwner(resource.data.owner);
      allow create: if isOwner(request.resource.data.owner)
                    && request.resource.data.keys().hasOnly(['owner', 'b64', 'createdAt'])
                    && request.resource.data.b64 is string
                    && request.resource.data.b64.size() <= 700000
                    && request.resource.data.createdAt == request.time;
      allow delete: if isOwner(resource.data.owner);
      // pas de update : une photo ne se modifie pas, on en crée une nouvelle
    }

    // Tout le reste : interdit (rien n'est autorisé par défaut)
  }
}
```

## Explication bloc par bloc

| Bloc | Ce qu'il fait |
|---|---|
| `signedIn()` | Vrai si l'utilisateur est connecté (même en anonyme). |
| `isOwner(uid)` | Vrai si l'utilisateur connecté est `uid`. |
| `validNote(d)` | `hasAll` = champs obligatoires présents ; `hasOnly` = aucun champ inconnu ; puis types et tailles. |
| `allow read: if isOwner(resource.data.owner)` | On ne lit que ses notes. Une requête doit donc filtrer `where("owner", "==", monUid)`, sinon elle est refusée en entier. |
| `createdAt == request.time` | Oblige l'app à envoyer `serverTimestamp()` : impossible de mettre une fausse date. |
| `affectedKeys().hasOnly([...])` | Liste des champs modifiables. `owner` et `createdAt` sont figés. |
| `photos` sans `update` | Une photo ne se modifie pas : on en crée une nouvelle et on supprime l'ancienne. |
| Pas de `match` pour le reste | Toute autre collection est **interdite**. |

Vocabulaire :
- `resource.data` = le document **tel qu'il est en base** (avant l'écriture) ;
- `request.resource.data` = le document **tel qu'il sera** après l'écriture ;
- `request.auth.uid` = l'uid de l'utilisateur qui fait la demande.

## Tests à faire (sur l'émulateur, doc 07)

| Action | Résultat attendu |
|---|---|
| Créer une note avec un titre | ✅ |
| Créer une note avec un titre vide ou > 100 caractères | ❌ refusé |
| Ajouter un champ inconnu (ex : `couleur`) | ❌ refusé |
| Lire les notes d'un autre utilisateur | ❌ refusé |
| Modifier `owner` d'une note | ❌ refusé |
| Envoyer une photo > 700 000 caractères | ❌ refusé |
| Supprimer sa note | ✅ |

## Ajouter une collection plus tard

1. Remplis la grille du doc 04 pour cette collection.
2. Copie le bloc `match /notes/{noteId} { ... }` et sa fonction `validNote`, renomme, adapte les champs.
3. Fais la même chose côté TypeScript (zip 2, doc 09).

➡️ Suite : `07-index-deploiement-emulateur.md`
