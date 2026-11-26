// src/models/photo.ts
// RÔLE : décrire le document qui contient une grande photo en base64.
import { collection, doc, type FieldValue, type Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'

// Limites — DOIVENT être identiques à celles de firestore.rules
export const PHOTO_MAX_CHARS = 700_000 // ≈ 510 Ko de JPEG (un document fait 1 Mio max)
export const THUMB_MAX_CHARS = 30_000  // ≈ 22 Ko (miniature rangée dans la note)

// Ce qui est STOCKÉ : photos/{photoId}
export interface PhotoDb {
  owner: string
  b64: string // l'image JPEG encodée en base64, sans le préfixe "data:..."
  createdAt: Timestamp
}

// Ce qu'on ENVOIE pour créer
export interface PhotoCreate {
  owner: string
  b64: string
  createdAt: FieldValue
}

export const photosWrite = collection(db, 'photos')

export function photoDoc(id: string) {
  return doc(db, 'photos', id)
}
