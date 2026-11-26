# 01 — Installer le SDK et configurer les identifiants

## ✅ Checklist

- [ ] 1. Installer le SDK Firebase
- [ ] 2. Créer `.env.local` avec tes 4 valeurs
- [ ] 3. Déclarer ces variables à TypeScript (`env.d.ts`)

---

## 1. Installer le SDK

**À quoi ça sert :** le paquet `firebase` contient tout le code pour parler à l'Auth et à Firestore.

```bash
$ cd mes-notes
$ npm install firebase
```

## 2. `.env.local`

**À quoi ça sert :** ranger les identifiants Firebase **hors du code**. Vite lit ce fichier et remplace `import.meta.env.VITE_...` par les valeurs au moment de la compilation.

**Où :** à la racine du projet (à côté de `package.json`).

Pourquoi `.local` : le `.gitignore` créé par Vue ignore déjà `*.local` → le fichier ne part pas sur GitHub.

Modèle (remplis avec les 4 valeurs copiées au zip 1, doc 02, étape 4) :

```bash
# Copie ce fichier en .env.local et remplis avec l'objet firebaseConfig de la console
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=PROJECT_ID
VITE_FIREBASE_APP_ID=
# 1 = utiliser les émulateurs locaux (0 quota consommé), 0 = vraie base
VITE_USE_EMULATORS=0
```

Les variables doivent commencer par `VITE_`, sinon Vite ne les transmet pas au code.

## 3. `env.d.ts`

**À quoi ça sert :** sans ce fichier, TypeScript ne sait pas que `import.meta.env.VITE_FIREBASE_API_KEY` existe → pas d'autocomplétion et pas d'erreur si tu fais une faute de frappe.

**Où :** à la racine du projet. Il existe déjà (créé par Vue) : **remplace son contenu**.

**Fichier :** `env.d.ts`

```ts
/// <reference types="vite/client" />

// Déclare les variables de .env.local pour que TypeScript les connaisse
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_USE_EMULATORS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

⚠️ Après avoir modifié `.env.local`, **relance** `npm run dev` : Vite ne relit pas ce fichier à chaud.

➡️ Suite : `02-connexion-firebase.md`
