// src/data/photos-exemple.ts
// RÔLE : photos d'exemple partagées par la galerie et la vue en grand,
// en attendant les vraies données Firestore.
import { reactive } from 'vue'
import { Timestamp } from 'firebase/firestore'
import type { NouvellePhoto, Photo } from '@/type/photo'

// Date de novembre 2026 au format Firestore
const date = (jour: number) => Timestamp.fromDate(new Date(2026, 10, jour))

// image vide = PhotoCard / PhotoGrand affichent le dégradé
// reactive : une photo ajoutée apparaît tout de suite dans la galerie
export const photosExemple = reactive<Photo[]>([
  { id: '1', nom: 'Tsingy', description: 'Parc national', image: '', createdAt: date(3), updatedAt: date(20) },
  { id: '2', nom: 'Allée des Baobabs', description: 'Morondava', image: '', createdAt: date(12), updatedAt: date(12) },
  { id: '3', nom: 'Isalo', description: 'Canyons et piscines naturelles', image: '', createdAt: date(1), updatedAt: date(25) },
  { id: '4', nom: 'Nosy Be', description: 'Plage', image: '', createdAt: date(18), updatedAt: date(19) },
  { id: '5', nom: 'Andasibe', description: 'Forêt et lémuriens', image: '', createdAt: date(7), updatedAt: date(8) },
  { id: '6', nom: 'Écureuil', description: 'Photo sans lieu', image: '', createdAt: date(22), updatedAt: date(22) },
])

// Une photo par son id (undefined si elle n'existe pas)
export const trouverPhoto = (id: string) => photosExemple.find((p) => p.id === id)

// Ajoute une photo remplie dans PhotoForm ; l'id et les dates sont créés ici
// (avec Firestore, ce sera addDoc + serverTimestamp(), voir src/type/exemple.ts)
export function ajouterPhoto(donnees: NouvellePhoto) {
  const maintenant = Timestamp.now()
  photosExemple.push({ ...donnees, id: crypto.randomUUID(), createdAt: maintenant, updatedAt: maintenant })
}
