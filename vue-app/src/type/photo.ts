// src/type/photo.ts
// RÔLE : forme d'une photo dans Firestore et dans l'app (PhotoCard, ListPhoto, PhotoGrand).
// Plan Spark = pas de Cloud Storage : l'image est rangée en base64 dans Firestore,
// en 2 tailles (doc/1-firestore/05-photos-base64.md) :
//   photos/{id} → nom, description, miniature (thumb) : léger, lu par la galerie
//   images/{id} → la grande image : lue seulement quand on ouvre la photo en grand
import type { FieldValue, Timestamp } from 'firebase/firestore'
import type { CreateDocument, DbDocument } from './firebase'

// Limites — DOIVENT être identiques à celles de firestore.rules
export const NOM_MAX = 100
export const DESCRIPTION_MAX = 500
export const THUMB_MAX_CHARS = 30_000 // ≈ 22 Ko, miniature rangée dans la photo
export const IMAGE_MAX_CHARS = 700_000 // ≈ 510 Ko, grande image (un document fait 1 Mio max)

// La galerie charge les photos par lots de 8
export const PHOTOS_PAR_LOT = 8

// ---------- photos/{id} ----------

// Ce qui est STOCKÉ dans Firestore
export interface PhotoDb {
  owner: string // uid de l'auteur : chacun ne voit que ses photos
  nom: string
  description?: string
  thumb?: string // miniature JPEG en base64, sans le préfixe "data:..."
  imageId?: string // id du document images/{imageId}
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Ce que l'APP manipule (id inclus ; owner inutile à l'affichage)
export interface Photo extends DbDocument {
  nom: string
  description?: string
  thumb?: string
  imageId?: string
}

// Ce qu'on ENVOIE pour créer (dates = serverTimestamp())
export interface PhotoCreate extends CreateDocument {
  owner: string
  nom: string
  description?: string
  thumb?: string
  imageId?: string
}

// Ce que l'utilisateur remplit dans PhotoForm
export interface NouvellePhoto {
  nom: string
  description?: string
  fichier?: File // l'image choisie, compressée seulement à l'envoi
}

// ---------- images/{id} : la grande image ----------

export interface ImageCreate {
  owner: string
  b64: string
  createdAt: FieldValue
}

// ---------- Tri de la galerie ----------

// Champs triables par usePhotos (le tri se fait dans l'app, pas dans Firestore)
export type ChampTriable = 'nom' | 'createdAt' | 'updatedAt'

// Un champ proposé dans la barre de tri, avec le texte du bouton
export interface ChampTri {
  cle: ChampTriable
  label: string
}

// Le tri choisi : quel champ, dans quel sens
export interface Tri {
  champ: ChampTriable
  croissant: boolean
}
