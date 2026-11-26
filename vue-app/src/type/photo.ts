// src/type/photo.ts
// RÔLE : forme d'une photo, telle qu'affichée par PhotoCard et ListPhoto.
import type { DbDocument } from './firebase'

// Photo LUE depuis la base : id + createdAt + updatedAt (DbDocument) + ses données
export interface Photo extends DbDocument {
  nom: string
  description?: string
  image?: string // URL de l'image
}

// Un champ sur lequel ListPhoto peut trier, avec le texte affiché sur le bouton
export interface ChampTri {
  cle: keyof Photo
  label: string
}
