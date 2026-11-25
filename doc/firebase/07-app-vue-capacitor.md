# 07 — Brancher l'app Vue + Capacitor (option D)

> Option B : ce doc ne s'applique pas, le code app est dans `04c-option-a.md` et `04d-option-b.md`. Seules les sections 1 (app Web) et « Build de l'APK » restent utiles.

## ✅ Checklist

- [ ] 1. Déclarer une app **Web** dans Firebase et copier la config
- [ ] 2. Installer le SDK Firebase
- [ ] 3. Variables d'environnement (URL de l'API)
- [ ] 4. Coller `src/firebase.ts`
- [ ] 5. Utiliser dans un composant
- [ ] 6. Vérifier le CORS

---

## 1. App Web dans Firebase

Pourquoi « Web » alors que c'est un APK : ton app Vue tourne dans une WebView → c'est le **SDK JavaScript web** qui est utilisé (l'app Android déclarée au doc 06 ne sert qu'au push).

🔗 `https://console.firebase.google.com/project/PROJECT_ID/settings/general`

1. **Your apps** → 🖱️ **Add app** → icône **`</>`** (Web)
2. Surnom : `vue-app` · **ne coche pas** Firebase Hosting → 🖱️ **Register app**
3. Copie l'objet `firebaseConfig` affiché → 🖱️ **Continue to console**

La clé `apiKey` n'est pas un secret (elle identifie le projet, la sécurité vient des règles du doc 05). Tu peux la commiter.

## 2. SDK

```bash
$ cd ton-app-vue
$ npm install firebase
```

## 3. Variables d'environnement

`.env.production`
```bash
VITE_API_URL=https://europe-west1-PROJECT_ID.cloudfunctions.net/api
```

`.env.development`
```bash
# API sur les émulateurs locaux (doc 04, étape 4)
VITE_API_URL=http://127.0.0.1:5001/PROJECT_ID/europe-west1/api
```

⚠️ Dans l'émulateur Android, `127.0.0.1` = le téléphone virtuel, pas ton PC → utilise `10.0.2.2` à la place. Sur un vrai téléphone : l'IP locale de ton PC, et lance les émulateurs Firebase avec `host: "0.0.0.0"` dans `firebase.json`. Le plus simple pour débuter : tester l'app dans le navigateur avec `npm run dev`, et l'APK contre l'API déployée.

## 4. `src/firebase.ts`

```ts
// src/firebase.ts — à importer partout dans l'app
import { initializeApp } from "firebase/app";
import { initializeAuth, indexedDBLocalPersistence, signInAnonymously } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Colle ici l'objet copié depuis la console (Project settings > Your apps > Web app)
const firebaseConfig = {
  apiKey: "...",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.firebasestorage.app",
  appId: "...",
};

const app = initializeApp(firebaseConfig);

// initializeAuth + indexedDB : persistance fiable dans la WebView Capacitor
export const auth = initializeAuth(app, { persistence: indexedDBLocalPersistence });
export const storage = getStorage(app);

/** Connecte l'utilisateur en anonyme une seule fois (l'uid est conservé entre les lancements). */
export async function ensureUser() {
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser!;
}

/** Appel à ton API. Ajoute automatiquement le token si l'utilisateur est connecté. */
const API_URL = import.meta.env.VITE_API_URL as string;

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const res = await fetch(API_URL + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

/** Réduit une photo à 1600 px max et la ré-encode en JPEG 80 % (≈ 200-500 Ko au lieu de 3-8 Mo). */
export async function compressImage(file: File, maxSize = 1600, quality = 0.8): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((ok, ko) =>
    canvas.toBlob((b) => (b ? ok(b) : ko(new Error("compression échouée"))), "image/jpeg", quality)
  );
}

/** Upload direct vers Storage dans users/{uid}/... et renvoie l'URL de téléchargement. */
export async function uploadFile(file: File): Promise<string> {
  const user = await ensureUser();
  const isImage = file.type.startsWith("image/");
  const data: Blob = isImage ? await compressImage(file) : file;
  const name = `${Date.now()}-${isImage ? file.name.replace(/\.\w+$/, ".jpg") : file.name}`;
  const fileRef = ref(storage, `users/${user.uid}/${name}`);
  await uploadBytes(fileRef, data, { contentType: isImage ? "image/jpeg" : file.type });
  return getDownloadURL(fileRef);
}
```

| Élément | Pourquoi |
|---|---|
| `initializeAuth(... indexedDBLocalPersistence)` | Dans une WebView Capacitor, c'est la persistance la plus fiable : l'utilisateur anonyme garde le même uid entre les lancements (sinon nouveau dossier Storage à chaque ouverture). |
| `ensureUser()` | Crée l'utilisateur anonyme seulement s'il n'existe pas. |
| `api()` | Ajoute `Authorization: Bearer <token>` → côté serveur `req.uid` / `current_uid()` est rempli. |
| `compressImage()` | Divise la taille des photos par ~10 avant upload → quota Storage et bande passante préservés. |
| `uploadFile()` | Upload direct vers `users/<uid>/...`, conforme aux règles du doc 05. |

## 5. Exemple dans un composant Vue

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { api, ensureUser, uploadFile } from "@/firebase";
import { initPush } from "@/push";

const items = ref<{ id: string; title: string }[]>([]);
const title = ref("");

onMounted(async () => {
  await ensureUser();
  await initPush();                       // doc 06
  items.value = await api("/items");
});

async function add() {
  await api("/items", { method: "POST", body: JSON.stringify({ title: title.value }) });
  items.value = await api("/items");
  title.value = "";
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const url = await uploadFile(file);
  console.log("fichier en ligne :", url);  // à envoyer à ton API pour l'enregistrer dans Firestore
}
</script>

<template>
  <input v-model="title" placeholder="Titre" /> <button @click="add">Ajouter</button>
  <input type="file" accept="image/*,application/pdf" @change="onFile" />
  <ul><li v-for="i in items" :key="i.id">{{ i.title }}</li></ul>
</template>
```

## 6. CORS — si tu as « blocked by CORS policy »

| Où tourne l'app | Origine envoyée | À mettre dans `cors` côté API |
|---|---|---|
| APK Android (Capacitor 6+) | `https://localhost` | ✅ déjà dans le code du doc 04 |
| `npm run dev` (Vite) | `http://localhost:5173` | ✅ déjà dans le code |
| iOS (si un jour) | `capacitor://localhost` | à ajouter |
| Ton site web | `https://ton-domaine` | à ajouter |

Après modification : `firebase deploy --only functions`.

## Build de l'APK

```bash
$ npm run build
$ npx cap sync android
$ npx cap open android      # Android Studio → Build > Build App Bundle(s) / APK(s) > Build APK(s)
```

➡️ Dernier doc, **à ne pas sauter** : `08-anti-facture.md`
