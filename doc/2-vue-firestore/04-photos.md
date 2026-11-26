# 04 — Les photos : image → base64 → Firestore

## À quoi sert ce fichier

| Fonction | Rôle | Utilisée par |
|---|---|---|
| `imageToBase64(file, maxSide, maxChars)` | Redimensionne + compresse en JPEG jusqu'à passer sous `maxChars` | les deux suivantes |
| `makeThumb(file)` | Miniature 240 px (≤ 30 000 caractères) à mettre **dans** la note | `services/notes.ts` |
| `savePhoto(file)` | Grande photo 1 280 px → crée un document `photos/{id}`, renvoie l'id | `services/notes.ts` |
| `getPhoto(id)` | Relit une grande photo : **cache du téléphone d'abord**, sinon Firestore | `NoteCard.vue` |
| `deletePhoto(id)` | Supprime `photos/{id}` | `services/notes.ts` |
| `toSrc(b64)` | Ajoute le préfixe pour `<img :src>` | les composants |

**Où :** crée le dossier `src/services/`.

**Fichier :** `src/services/photos.ts`

```ts
// src/services/photos.ts
// RÔLE : transformer une image choisie par l'utilisateur en base64 assez petit pour Firestore,
// l'enregistrer, la relire (cache d'abord) et la supprimer.
import { addDoc, deleteDoc, getDoc, getDocFromCache, serverTimestamp } from 'firebase/firestore'
import { ensureUser } from '@/firebase'
import {
  PHOTO_MAX_CHARS,
  THUMB_MAX_CHARS,
  photoDoc,
  photosWrite,
  type PhotoCreate,
} from '@/models/photo'

/** Blob → texte base64 (sans le préfixe "data:image/jpeg;base64,") */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Redimensionne l'image (côté le plus long = maxSide px) et l'encode en JPEG.
 * Si le résultat dépasse maxChars : baisse la qualité, puis réduit encore les dimensions.
 */
export async function imageToBase64(file: Blob, maxSide: number, maxChars: number): Promise<string> {
  const bitmap = await createImageBitmap(file)
  let side = maxSide
  for (let attempt = 0; attempt < 8; attempt++) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    for (const quality of [0.8, 0.7, 0.6, 0.5]) {
      const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', quality))
      if (!blob) throw new Error('Compression impossible')
      const b64 = await blobToBase64(blob)
      if (b64.length <= maxChars) return b64
    }
    side = Math.round(side * 0.75)
  }
  throw new Error('Image impossible à réduire sous la limite')
}

/** Miniature 240 px, à ranger DANS la note */
export function makeThumb(file: File): Promise<string> {
  return imageToBase64(file, 240, THUMB_MAX_CHARS)
}

/** Grande photo 1280 px → nouveau document photos/{id}. Renvoie l'id. */
export async function savePhoto(file: File): Promise<string> {
  const user = await ensureUser()
  const b64 = await imageToBase64(file, 1280, PHOTO_MAX_CHARS)
  const ref = await addDoc(photosWrite, {
    owner: user.uid,
    b64,
    createdAt: serverTimestamp(),
  } satisfies PhotoCreate)
  return ref.id
}

/** Lit une grande photo : cache du téléphone d'abord (gratuit), sinon Firestore (1 lecture) */
export async function getPhoto(photoId: string): Promise<string | null> {
  const ref = photoDoc(photoId)
  try {
    const cached = await getDocFromCache(ref)
    if (cached.exists()) return cached.get('b64') as string
  } catch {
    // pas dans le cache → on va chercher sur le serveur
  }
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.get('b64') as string) : null
}

export function deletePhoto(photoId: string): Promise<void> {
  return deleteDoc(photoDoc(photoId))
}

/** Pour <img :src="toSrc(b64)"> */
export function toSrc(b64: string): string {
  return 'data:image/jpeg;base64,' + b64
}
```

## Points importants

| Point | Explication |
|---|---|
| `satisfies PhotoCreate` | TypeScript vérifie que l'objet envoyé a **exactement** la forme `PhotoCreate`. Une faute de champ = erreur de compilation. |
| Boucle qualité → dimensions | Qualité 0,8 → 0,7 → 0,6 → 0,5 ; si c'est encore trop gros, l'image est réduite de 25 % et on recommence (8 fois max). |
| `getDocFromCache` | Lit seulement sur le téléphone. Lève une erreur si le document n'y est pas → on passe à `getDoc` (serveur, 1 lecture). |
| Pourquoi pas de `<input>` spécial Android | `<input type="file" accept="image/*">` ouvre la galerie ou l'appareil photo dans l'APK Capacitor, aucun plugin nécessaire. |

➡️ Suite : `05-operations-crud.md`
