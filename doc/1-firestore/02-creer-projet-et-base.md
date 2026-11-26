# 02 — Créer le projet Firebase et la base

## ✅ Checklist

- [ ] 1. Créer le **projet** Firebase
- [ ] 2. Créer la **base** Firestore
- [ ] 3. Activer la **connexion anonyme**
- [ ] 4. **Déclarer ton app** dans Firebase et copier sa configuration
- [ ] 5. Vérifier que tu es bien en Spark

Aucune étape ne demande de carte. Si un écran en demande une : mauvaise page, reviens en arrière.

> **Deux choses différentes à ne pas confondre :**
> - **Déclarer l'app dans Firebase** (étape 4 ici) = dire à Firebase « une app va se connecter », et récupérer ses identifiants.
> - **Créer le projet Vue** (le code) = zip 3, doc 02.

---

## 1. Créer le projet Firebase

**À quoi ça sert :** le projet est le conteneur de tout (base, utilisateurs, règles).

🔗 https://console.firebase.google.com

1. 🖱️ **Create a project** (ou **Add project**)
2. Tape un nom, ex : `mes-notes`
3. Sous le nom, Firebase affiche l'**ID du projet** (ex : `mes-notes-4f2a1`). **Note-le** : c'est ton `PROJECT_ID`.
4. 🖱️ **Continue**
5. Google Analytics : **désactive** l'interrupteur (inutile ici) → 🖱️ **Create project**
6. Attends → 🖱️ **Continue**

## 2. Créer la base Firestore

**À quoi ça sert :** c'est là que seront rangées les notes.

🔗 `https://console.firebase.google.com/project/PROJECT_ID/firestore`

1. 🖱️ **Create database**
2. Si on te demande l'édition : **Standard edition** → 🖱️ **Next**
3. **Database ID** : laisse `(default)`. **Location** : **`europe-west1 (Belgium)`** → 🖱️ **Next**
   - Pourquoi : région la plus proche de Madagascar. ⚠️ **Impossible à changer ensuite.**
4. Choisis **Start in production mode** → 🖱️ **Create**
   - Pourquoi : la base est fermée à tous. Tu l'ouvriras proprement avec tes règles (doc 06).

Résultat : une page vide avec « Start collection ». **Ne crée rien à la main** : c'est l'app qui créera les documents.

## 3. Activer la connexion anonyme

**À quoi ça sert :** chaque installation de l'app reçoit un identifiant unique (`uid`) sans écran de connexion. Les règles s'en servent pour que chacun ne voie que **ses** notes.

🔗 `https://console.firebase.google.com/project/PROJECT_ID/authentication/providers`

1. Si la page affiche **Get started** → 🖱️ **Get started**
2. Dans la liste **Native providers** → 🖱️ **Anonymous**
3. Active l'interrupteur **Enable** → 🖱️ **Save**

## 4. Déclarer ton app et copier sa configuration

**À quoi ça sert :** Firebase te donne les identifiants que l'app utilisera pour se connecter (fichier `.env.local`, zip 2 doc 01).

Pourquoi « Web » alors que tu fais un APK : ton app Vue tourne dans un navigateur intégré à l'APK. C'est le SDK **web** qui est utilisé.

🔗 `https://console.firebase.google.com/project/PROJECT_ID/settings/general`

1. Descends jusqu'à **Your apps**
2. 🖱️ l'icône **`</>`** (Web)
3. **App nickname** : `mes-notes-vue`
4. **Ne coche pas** « Also set up Firebase Hosting »
5. 🖱️ **Register app**
6. Firebase affiche un bloc de code. Copie **uniquement** ces 4 valeurs dans un fichier texte, tu en auras besoin au zip 2 :

```js
const firebaseConfig = {
  apiKey: "AIza...",              // → VITE_FIREBASE_API_KEY
  authDomain: "PROJECT_ID.firebaseapp.com",   // → VITE_FIREBASE_AUTH_DOMAIN
  projectId: "PROJECT_ID",        // → VITE_FIREBASE_PROJECT_ID
  appId: "1:123...:web:abc...",   // → VITE_FIREBASE_APP_ID
  // les autres lignes (storageBucket, messagingSenderId…) ne servent pas ici
};
```

7. 🖱️ **Continue to console**

Tu as perdu ces valeurs ? Même page → **Your apps** → ton app → section **SDK setup and configuration** → **Config**.

`apiKey` n'est **pas un secret** : elle identifie ton projet. La sécurité vient des règles (doc 06).

## 5. Vérifier le plan

🔗 `https://console.firebase.google.com/project/PROJECT_ID/usage/details` → doit afficher **Spark**.

➡️ Suite : `03-comprendre-nosql.md`
