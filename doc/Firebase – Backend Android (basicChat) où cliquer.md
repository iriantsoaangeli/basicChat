# Firebase – Backend Android (basicChat) : où cliquer

Nov 25, 2026 · @angeli

Chemins dans l'ordre, pour une app **Android** avec **Firestore**. Les menus correspondent à la console Firebase actuelle.

## Cible : une API mobile 100 % gratuite (plan Spark)

Sur Spark, sans carte bancaire, l'app Android parle directement à Firestore via le SDK. Les **Rules** jouent le rôle de l'API : elles décident qui peut lire et écrire quoi. Pas de serveur à coder, et le temps réel est inclus.

### Ce qu'on utilise, ce qu'on évite

| Service | Sur Spark | Rôle |
| --- | --- | --- |
| Authentication (email, Google) | Gratuit | Identifier l'utilisateur |
| Firestore | Gratuit, 50K lectures/jour | Base de données + « API » |
| Messaging (notifications) | Gratuit | Notifications push |
| Emulator Suite (local) | Gratuit, sans quota | Tester sans consommer le quota |
| Storage | Non (Blaze requis) | À éviter |
| Cloud Functions | Non (Blaze requis) | À éviter |
| SQL Connect | 90 jours seulement | À éviter |

Sur Spark, aucun compte de facturation n'est lié : tu ne peux pas être facturé. Si un quota est dépassé, les opérations échouent jusqu'à sa remise à zéro.

### Étapes

1. **Brancher l'app Android** : voir la section 0 plus bas.
2. **Activer l'authentification** : voir la section 1.
3. **Créer la base** : voir la section 2 (Firestore, *production mode*).
4. **Définir les « routes » sous forme de collections** :

| Équivalent API | Firestore |
| --- | --- |
| `GET /me` | lire `users/{uid}` |
| `GET /conversations` | requête sur `conversations` où `members` contient `uid` |
| `POST /conversations` | créer un document dans `conversations` avec `members: [uid, autreUid]` |
| `GET /conversations/{id}/messages` | écoute temps réel sur `conversations/{id}/messages` |
| `POST /conversations/{id}/messages` | ajouter un document dans `conversations/{id}/messages` |

5. **Écrire les Rules** (Firestore → onglet Rules → Publish) :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /conversations/{convId} {
      allow read, update: if request.auth != null
        && request.auth.uid in resource.data.members;
      allow create: if request.auth != null
        && request.auth.uid in request.resource.data.members;

      match /messages/{msgId} {
        allow read: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/conversations/$(convId)).data.members;
        allow create: if request.auth != null
          && request.resource.data.senderId == request.auth.uid
          && request.auth.uid in get(/databases/$(database)/documents/conversations/$(convId)).data.members;
      }
    }
  }
}
```

Chaque `get()` dans une règle compte comme une lecture dans le quota.

6. **Ajouter le SDK** dans `app/build.gradle.kts` (prendre la dernière version du BoM dans la doc Firebase) :

```kotlin
implementation(platform("com.google.firebase:firebase-bom:<derniere-version>"))
implementation("com.google.firebase:firebase-auth")
implementation("com.google.firebase:firebase-firestore")
```

7. **Appeler l'« API » depuis l'app** :

```kotlin
val db = Firebase.firestore
val uid = Firebase.auth.currentUser!!.uid
val messages = db.collection("conversations").document(convId).collection("messages")

// POST /conversations/{id}/messages
messages.add(mapOf(
    "senderId" to uid,
    "text" to texte,
    "createdAt" to FieldValue.serverTimestamp()
))

// GET /conversations/{id}/messages, en temps réel
messages.orderBy("createdAt").limitToLast(50)
    .addSnapshotListener { snap, e -> /* mettre à jour l'UI */ }

// GET /conversations
db.collection("conversations").whereArrayContains("members", uid).get()
```

8. **Tester en local, gratuitement** : `npm i -g firebase-tools`, `firebase login`, `firebase init firestore emulators`, puis `firebase emulators:start`. Les règles se déploient avec `firebase deploy --only firestore:rules`.

### Rester dans le gratuit

- Toujours limiter les requêtes (`limit`, `limitToLast`) et paginer.
- Garder un seul listener temps réel par écran et le retirer quand l'écran se ferme.
- Développer sur l'émulateur, pas sur la vraie base.
- Pas d'images ni de fichiers dans cette option : Storage demande Blaze.

Les sections 3 et 4 ci-dessous (Storage, Functions) sont hors de cette option gratuite.

## À savoir avant de commencer

- **Gratuit (plan Spark)** : Authentication, Firestore, notifications (Messaging).
- **Plan Blaze requis** (carte bancaire, mais avec une partie gratuite) : Storage (fichiers/images) et Cloud Functions (code serveur).
- Sur Spark, l'app n'a accès à aucun espace Storage : les appels renvoient des erreurs 402/403.
- Firebase recommande fortement de configurer des alertes de budget dès le passage à Blaze.

## 0. Brancher l'app Android (en premier)

**Project Overview → + Add app → icône Android**

- *Package name* : l'`applicationId` dans `app/build.gradle`.
- *SHA-1* : lancer `./gradlew signingReport`. Obligatoire pour la connexion Google.
- Télécharger **google-services.json**, le mettre dans `app/`, puis ajouter les lignes Gradle indiquées.

## 1. Comptes utilisateurs

**Security → Authentication → Get started → onglet Sign-in method**

- Activer *Email/Password*, et *Google* si voulu.

## 2. Base de données

**Databases and storage → Firestore → Create database**

- Choisir la région avec soin : elle ne peut plus être changée.
- Démarrer en *production mode*.
- Onglet **Rules** : définit qui peut lire et écrire quoi. C'est la sécurité du backend.

## 3. Fichiers et images (Blaze)

**Upgrade (en bas à gauche) → carte bancaire → Databases and storage → Storage → Get started**

- Onglet **Rules** : règle l'accès aux fichiers.
- Juste après l'upgrade, créer une alerte de budget : **⚙ Settings → Usage and billing**.

## 4. Code serveur (Blaze)

**Hosting and serverless → Functions**

- La console sert seulement à voir les fonctions et leurs logs.
- Le code s'écrit et se déploie depuis le PC : `firebase init functions` puis `firebase deploy`.

## 5. Notifications push (gratuit)

**DevOps and engagement → Messaging**

## 6. « Hoster l'app »

Une app Android ne s'héberge pas sur Firebase Hosting (réservé aux sites web).

- **Distribuer à des testeurs** : **DevOps and engagement → App Distribution** (envoi de l'APK/AAB).
- **Publier pour tout le monde** : Google Play Store, pas Firebase.

## Notes

- Les libellés exacts des boutons peuvent bouger : Google change souvent l'interface.
- Avec cette architecture, le « backend » est surtout Firestore + ses **Rules**. Cloud Functions n'est pas forcément nécessaire.

## Sources

- [Changements Cloud Storage for Firebase (Blaze requis)](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)
- [FAQ Cloud Functions (Blaze requis, alertes de budget)](https://firebase.google.com/docs/functions/faq-and-troubleshooting)
- [Plans tarifaires Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
