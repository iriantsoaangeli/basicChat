# Firebase – Backend Android (basicChat) : où cliquer

Nov 25, 2026 · @angeli

Chemins dans l'ordre, pour une app **Android** avec **Firestore**. Les menus correspondent à la console Firebase actuelle.

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
