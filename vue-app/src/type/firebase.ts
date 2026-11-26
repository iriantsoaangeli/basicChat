// src/type/firebase.ts
// RÔLE : champs communs à tous nos documents Firestore, selon le moment où on les manipule.
import type { FieldValue, Timestamp } from 'firebase/firestore'

// Document LU depuis la base : id (du snapshot) + dates réelles
export interface DbDocument {
  id: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Données envoyées à la CRÉATION (addDoc / setDoc) : pas d'id, dates = serverTimestamp()
export interface CreateDocument {
  createdAt: FieldValue
  updatedAt: FieldValue
}

// Données envoyées à la MISE À JOUR (updateDoc) : jamais id ni createdAt
export interface UpdateDocument {
  updatedAt: FieldValue
}
