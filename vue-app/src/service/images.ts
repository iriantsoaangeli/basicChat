// src/service/images.ts
// RÔLE : transformer une image choisie en base64 assez petit pour Firestore,
// donner les références images/{id} et relire une image (cache du téléphone d'abord).
// L'écriture et la suppression se font dans service/photos.ts, en batch avec la photo.
// Repris de doc/2-vue-firestore/exemple-complet/src/services/photos.ts
import { collection, doc, getDoc, getDocFromCache } from 'firebase/firestore'
import { db } from '@/firebase'
import { estRefuse } from '@/service/errors'
import { IMAGE_MAX_CHARS, THUMB_MAX_CHARS } from '@/type/photo'

const imagesCol = collection(db, 'images')

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
async function imageToBase64(bitmap: ImageBitmap, maxSide: number, maxChars: number): Promise<string> {
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

/**
 * Prépare les 2 tailles d'une image, en base64 (rien n'est écrit, c'est creerPhoto qui enregistre) :
 *   thumb : miniature 240 px, rangée DANS le document photos/{id}
 *   b64   : grande image 1280 px, rangée dans images/{id}
 * La photo n'est décompressée qu'UNE fois (≈ 48 Mo en mémoire pour 12 mégapixels),
 * et cette mémoire est libérée tout de suite après, même si la compression échoue.
 */
export async function compresserImage(file: File): Promise<{ thumb: string; b64: string }> {
  const bitmap = await createImageBitmap(file)
  try {
    return {
      thumb: await imageToBase64(bitmap, 240, THUMB_MAX_CHARS),
      b64: await imageToBase64(bitmap, 1280, IMAGE_MAX_CHARS),
    }
  } finally {
    bitmap.close()
  }
}

/** Référence images/{id} ; sans id, Firestore en génère un nouveau (sans rien écrire) */
export function refImage(id?: string) {
  return id ? doc(imagesCol, id) : doc(imagesCol)
}

/**
 * Lit une grande image : cache du téléphone d'abord (gratuit), sinon Firestore (1 lecture).
 * null si elle n'existe pas (ou n'est pas à nous : les règles répondent alors "refusé").
 */
export async function lireImage(imageId: string): Promise<string | null> {
  const ref = doc(imagesCol, imageId)
  try {
    const cached = await getDocFromCache(ref)
    if (cached.exists()) return cached.get('b64') as string
  } catch {
    // pas dans le cache → on va chercher sur le serveur
  }
  try {
    const snap = await getDoc(ref)
    return snap.exists() ? (snap.get('b64') as string) : null
  } catch (e) {
    if (estRefuse(e)) return null
    throw e
  }
}

/** Pour <img :src="toSrc(b64)"> */
export function toSrc(b64: string): string {
  return 'data:image/jpeg;base64,' + b64
}
