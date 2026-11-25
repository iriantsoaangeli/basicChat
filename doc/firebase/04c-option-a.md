# 04c — Option A : pas d'API, l'app parle directement à Firestore

## En une phrase

Pas de serveur à toi : l'app utilise le SDK Firebase pour lire et écrire dans Firestore, et le fichier `firestore.rules` décide qui a le droit de faire quoi.

```
App Vue ──SDK──► Firestore (serveurs Google)
                   ▲
                   └── firestore.rules : « qui peut lire / écrire quoi »
```

| Tu écris | Tu n'écris pas |
|---|---|
| `src/db.ts` (fonctions CRUD côté app) | Routes, `fetch`, serveur |
| `firestore.rules` (sécurité) | Functions (donc 0 appel facturé) |
| `firestore.indexes.json` (si tri + filtre) | |

**Limite :** pas de notifs push automatiques, pas de tâches planifiées, pas de clés secrètes. Si tu en as besoin → `04d-option-b.md` (même chose + 3 fonctions).

**Plan :** A marche même en Spark pour Firestore seul, mais tu veux des photos → Storage → Blaze quand même (doc 01).

## ✅ Checklist

- [ ] 1. Docs 02 faits (projet, Blaze, Firestore, Storage, auth anonyme) et 02b (modélisation). Ce doc implémente une **version minimale** (une seule collection `items`) ; le modèle complet et ses règles sont dans le 02b.
- [ ] 2. Générer les fichiers de règles et d'index
- [ ] 3. Coller `firestore.rules`
- [ ] 4. Coller `firestore.indexes.json`
- [ ] 5. Règles Storage du doc 05 (inchangées)
- [ ] 6. Déployer règles + index
- [ ] 7. Côté app : déclarer une app Web (doc 07, section 1, pour copier `firebaseConfig`) puis `src/firebase.ts` + `src/db.ts`
- [ ] 8. Tester

---

## 2. Générer les fichiers

```bash
$ cd mon-backend
$ firebase init firestore
$ firebase init storage
```

Accepte les noms par défaut.

## 3. `firestore.rules`

⚠️ Remplace la version « tout fermé » du doc 05 : elle bloquerait l'app.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }

    // Une annonce valide : seulement ces champs, avec ces types
    function validItem(d) {
      return d.keys().hasAll(['title', 'owner', 'createdAt'])
          && d.keys().hasOnly(['title', 'owner', 'createdAt', 'photoUrl'])
          && d.title is string && d.title.size() > 0 && d.title.size() <= 200
          && (!('photoUrl' in d) || d.photoUrl is string);
    }

    match /items/{id} {
      allow read:   if signedIn();
      allow create: if isOwner(request.resource.data.owner)
                    && validItem(request.resource.data)
                    && request.resource.data.createdAt == request.time;
      allow update: if isOwner(resource.data.owner)
                    && validItem(request.resource.data)
                    && request.resource.data.owner == resource.data.owner
                    && request.resource.data.createdAt == resource.data.createdAt;
      allow delete: if isOwner(resource.data.owner);
    }
    // Toute autre collection : interdite (rien n'est autorisé par défaut)
  }
}
```

### Ce que font ces règles

| Règle | Effet |
|---|---|
| `read: if signedIn()` | Tout utilisateur connecté (même anonyme) voit toutes les annonces. Pour « chacun ne voit que les siennes » : `if isOwner(resource.data.owner)`. |
| `create` + `isOwner(request.resource.data.owner)` | Impossible de créer une annonce au nom de quelqu'un d'autre. |
| `validItem` | Refuse les champs inconnus, les titres vides ou de plus de 200 caractères. **C'est ta validation de données** : sans serveur, c'est ici qu'elle se fait. |
| `createdAt == request.time` | Oblige l'app à utiliser l'heure du serveur (`serverTimestamp()`), pas une date trafiquée. |
| `update` : owner et createdAt inchangés | On peut modifier le titre ou la photo, pas voler l'annonce ni changer sa date. |
| `delete` | Seul le propriétaire. |
| Pas de `match` pour le reste | Tout ce qui n'est pas autorisé est refusé. |

Vocabulaire : `resource.data` = le document **tel qu'il est en base**. `request.resource.data` = le document **tel qu'il sera après l'écriture**.

## 4. `firestore.indexes.json`

Pourquoi : Firestore n'accepte une requête « filtre sur un champ + tri sur un autre » (ici : `owner == moi` trié par `createdAt`) que si un **index composite** existe. Sans lui, la requête échoue avec une erreur qui contient un lien pour le créer.

```json
{
  "indexes": [
    {
      "collectionGroup": "items",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "owner", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## 5. Règles Storage

Celles du doc 05 restent valables telles quelles.

## 6. Déployer

```bash
$ firebase deploy --only firestore,storage
```

`firestore` = règles + index. La construction d'un index prend quelques minutes : suivi sur 🔗 `https://console.firebase.google.com/project/PROJECT_ID/firestore/indexes`

## 7. Côté app

```bash
$ cd ton-app-vue
$ npm install firebase
```

### `src/firebase.ts`

Remplace la version du doc 07 (on enlève `api()`, on ajoute `db`) :

```ts
// src/firebase.ts — version A/B (Firestore en direct, sans API)
import { initializeApp } from "firebase/app";
import { initializeAuth, indexedDBLocalPersistence, signInAnonymously } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Colle ici l'objet copié depuis la console (Project settings > Your apps > Web app)
const firebaseConfig = {
  apiKey: "...",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.firebasestorage.app",
  appId: "...",
};

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, { persistence: indexedDBLocalPersistence });
// Cache local : l'app affiche les dernières données même hors ligne
export const db = initializeFirestore(app, { localCache: persistentLocalCache() });
export const storage = getStorage(app);

/** Connecte l'utilisateur en anonyme une seule fois (l'uid est conservé entre les lancements). */
export async function ensureUser() {
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser!;
}

/** Réduit une photo à 1600 px max, JPEG 80 %. */
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

### `src/db.ts` — tout le CRUD

```ts
// src/db.ts — tout le CRUD des annonces, sans API
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot,
  query, where, orderBy, limit, startAfter, serverTimestamp,
  QueryDocumentSnapshot, DocumentSnapshot,
} from "firebase/firestore";
import { db, ensureUser } from "./firebase";

export type Item = { id: string; title: string; owner: string; photoUrl?: string; createdAt?: Date };

const items = collection(db, "items");

function toItem(d: DocumentSnapshot): Item {
  const x = d.data()!;
  return { id: d.id, title: x.title, owner: x.owner, photoUrl: x.photoUrl, createdAt: x.createdAt?.toDate() };
}

/** CREATE */
export async function createItem(title: string, photoUrl?: string): Promise<string> {
  const user = await ensureUser();
  const ref = await addDoc(items, {
    title,
    owner: user.uid,
    createdAt: serverTimestamp(),
    ...(photoUrl ? { photoUrl } : {}),
  });
  return ref.id;
}

/** READ — une annonce */
export async function getItem(id: string): Promise<Item | null> {
  const d = await getDoc(doc(db, "items", id));
  return d.exists() ? toItem(d) : null;
}

/** READ — toutes les annonces, 20 par page. Passe `last` pour la page suivante. */
export async function listItems(last?: QueryDocumentSnapshot) {
  const q = last
    ? query(items, orderBy("createdAt", "desc"), startAfter(last), limit(20))
    : query(items, orderBy("createdAt", "desc"), limit(20));
  const snap = await getDocs(q);
  return { items: snap.docs.map(toItem), last: snap.docs.at(-1) };
}

/** READ — mes annonces (nécessite l'index composite owner + createdAt) */
export async function listMyItems(): Promise<Item[]> {
  const user = await ensureUser();
  const q = query(items, where("owner", "==", user.uid), orderBy("createdAt", "desc"), limit(20));
  return (await getDocs(q)).docs.map(toItem);
}

/** READ en temps réel — appelle `cb` à chaque changement. Renvoie la fonction pour arrêter. */
export function watchMyItems(uid: string, cb: (items: Item[]) => void) {
  const q = query(items, where("owner", "==", uid), orderBy("createdAt", "desc"), limit(20));
  return onSnapshot(q, (snap) => cb(snap.docs.map(toItem)));
}

/** UPDATE */
export async function renameItem(id: string, title: string): Promise<void> {
  await updateDoc(doc(db, "items", id), { title });
}

/** DELETE */
export async function removeItem(id: string): Promise<void> {
  await deleteDoc(doc(db, "items", id));
}
```

### Utilisation dans un composant

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { createItem, listItems, renameItem, removeItem, type Item } from "@/db";
import { uploadFile } from "@/firebase";

const items = ref<Item[]>([]);
const title = ref("");

async function refresh() { items.value = (await listItems()).items; }
onMounted(refresh);

async function add() {
  const file = (document.querySelector("#photo") as HTMLInputElement).files?.[0];
  const photoUrl = file ? await uploadFile(file) : undefined;
  await createItem(title.value, photoUrl);
  title.value = "";
  await refresh();
}
</script>

<template>
  <input v-model="title" placeholder="Titre" />
  <input id="photo" type="file" accept="image/*" />
  <button @click="add">Publier</button>
  <ul>
    <li v-for="i in items" :key="i.id">
      <img v-if="i.photoUrl" :src="i.photoUrl" width="60" /> {{ i.title }}
      <button @click="renameItem(i.id, i.title + ' !').then(refresh)">Renommer</button>
      <button @click="removeItem(i.id).then(refresh)">Supprimer</button>
    </li>
  </ul>
</template>
```

Si tu cliques « Renommer » sur l'annonce de quelqu'un d'autre → erreur `permission-denied` : ce sont les règles qui bloquent. C'est voulu.

## 8. Tester en local

```bash
$ cd mon-backend
$ firebase init emulators      # coche Firestore, Storage, Authentication
$ firebase emulators:start
```

Ajoute temporairement dans `src/firebase.ts`, juste après les `export const` :

```ts
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";
import { connectStorageEmulator } from "firebase/storage";
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}
```

Puis `npm run dev` et ouvre http://127.0.0.1:4000 pour voir les données. Les émulateurs appliquent **les mêmes règles** que la prod → c'est là que tu vérifies que les refus marchent.

## Économiser les lectures (50 000/jour gratuites)

| Réflexe | Pourquoi |
|---|---|
| Toujours `limit(20)` + pagination (`listItems(last)`) | 1 document = 1 lecture. Une liste de 1 000 annonces sans limit = 1 000 lectures par ouverture d'écran. |
| `watchMyItems` (temps réel) seulement si utile | À l'ouverture : 1 lecture par document, puis 1 lecture par document modifié. Pense à appeler la fonction renvoyée pour arrêter l'écoute quand tu quittes l'écran. |
| Mettre `userNom` dans l'annonce plutôt que lire le profil à chaque fois | Une seule lecture par annonce au lieu de deux (voir Q&A : NoSQL). |
