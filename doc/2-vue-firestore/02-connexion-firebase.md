# 02 — Connexion à Firebase

## À quoi sert ce fichier

Il se connecte à Firebase **une seule fois** au démarrage et exporte deux objets utilisés partout :
- `auth` : l'utilisateur connecté ;
- `db` : la base Firestore.

Il exporte aussi `ensureUser()` : donne l'utilisateur connecté, et le crée en anonyme au premier lancement.

**Où :** crée le dossier `src/firebase/` et le fichier `index.ts` dedans. Grâce à l'alias `@` (déjà configuré par Vue dans `vite.config.ts`), les autres fichiers l'importent avec `import { db } from '@/firebase'`.

**Fichier :** `src/firebase/index.ts`

```ts
// src/firebase/index.ts
// RÔLE : se connecter à Firebase UNE seule fois et partager `auth` et `db` dans toute l'app.
import { initializeApp } from 'firebase/app'
import {
  initializeAuth,
  indexedDBLocalPersistence,
  signInAnonymously,
  connectAuthEmulator,
  type User,
} from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  connectFirestoreEmulator,
} from 'firebase/firestore'

// 1. Connexion au projet (valeurs lues dans .env.local)
const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
})

// 2. Authentification. indexedDB = l'utilisateur reste connecté entre deux lancements de l'APK
export const auth = initializeAuth(app, { persistence: indexedDBLocalPersistence })

// 3. Base de données. Cache local = les documents déjà lus restent sur le téléphone
export const db = initializeFirestore(app, { localCache: persistentLocalCache() })

// 4. En développement, on peut tout rediriger vers les émulateurs locaux
if (import.meta.env.VITE_USE_EMULATORS === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099')
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

// 5. Renvoie l'utilisateur connecté ; le crée en anonyme la première fois
export async function ensureUser(): Promise<User> {
  await auth.authStateReady()
  if (!auth.currentUser) await signInAnonymously(auth)
  return auth.currentUser!
}
```

## Partie par partie

| Partie | Ce qu'elle fait | Pourquoi ce choix |
|---|---|---|
| 1. `initializeApp` | Identifie ton projet | Les valeurs viennent de `.env.local` |
| 2. `initializeAuth` + `indexedDBLocalPersistence` | Gère la connexion | Dans un APK, c'est le stockage le plus fiable : l'utilisateur garde **le même uid** entre deux lancements. Sinon il perdrait l'accès à ses notes (les règles filtrent par uid). |
| 3. `initializeFirestore` + `persistentLocalCache` | Ouvre la base | Les documents lus sont gardés sur le téléphone → les photos déjà vues ne sont pas re-téléchargées, et l'app affiche quelque chose hors ligne |
| 4. `connect...Emulator` | Redirige vers les émulateurs | Seulement si `VITE_USE_EMULATORS=1` (doc 08) |
| 5. `ensureUser()` | Renvoie l'utilisateur, le crée si besoin | `authStateReady()` attend que Firebase ait relu la session sauvegardée ; sans ça on créerait un nouvel utilisateur à chaque lancement |

➡️ Suite : `03-modeles-typescript.md`
