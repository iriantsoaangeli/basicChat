// src/service/photos.ts
// RÔLE : les opérations sur les photos (créer, lister par lots de 8, lire, supprimer).
// Firestore renvoie toujours le même ordre (plus récentes d'abord) : le tri choisi
// par l'utilisateur est fait dans usePhotos, sur les photos chargées.
// Les composants n'appellent QUE ces fonctions (via usePhotos), jamais Firestore directement.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db, ensureUser } from '@/firebase'
import { estRefuse } from '@/service/errors'
import { creerMiniature, enregistrerImage, supprimerImage } from '@/service/images'
import {
  PHOTOS_PAR_LOT,
  type NouvellePhoto,
  type Photo,
  type PhotoCreate,
  type PhotoDb,
} from '@/type/photo'

// Firestore → objet Photo de l'app
const photoConverter: FirestoreDataConverter<Photo, PhotoDb> = {
  toFirestore(): PhotoDb {
    throw new Error('Écris avec PhotoCreate, pas avec Photo')
  },
  fromFirestore(snap: QueryDocumentSnapshot<PhotoDb>, options) {
    // 'estimate' : date estimée tant que le serveur n'a pas confirmé (jamais null)
    const d = snap.data({ ...options, serverTimestamps: 'estimate' })
    return {
      id: snap.id,
      nom: d.nom,
      description: d.description,
      thumb: d.thumb,
      imageId: d.imageId,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }
  },
}

const photosRead = collection(db, 'photos').withConverter(photoConverter)
const photosWrite = collection(db, 'photos')

// Curseur de pagination : la dernière photo du lot précédent
export type Curseur = QueryDocumentSnapshot<Photo, PhotoDb>

/** CRÉER une photo. L'image est compressée puis rangée en 2 tailles. Renvoie l'id. */
export async function creerPhoto(nouvelle: NouvellePhoto): Promise<string> {
  const user = await ensureUser()
  const data: PhotoCreate = {
    owner: user.uid,
    nom: nouvelle.nom,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  // Firestore refuse les champs undefined : on n'ajoute que ce qui est rempli
  if (nouvelle.description) data.description = nouvelle.description
  if (nouvelle.fichier) {
    data.thumb = await creerMiniature(nouvelle.fichier) // petite image, pour la galerie
    data.imageId = await enregistrerImage(nouvelle.fichier) // grande image, pour PhotoGrand
  }
  const ref = await addDoc(photosWrite, data)
  return ref.id
}

/**
 * LISTER mes photos, 8 par lot, les plus récentes d'abord.
 * Passe `apres` (le curseur renvoyé par l'appel précédent) pour le lot suivant.
 * Index nécessaire : owner (asc) + createdAt (desc), voir firestore.indexes.json
 */
export async function listerMesPhotos(apres?: Curseur) {
  const user = await ensureUser()
  const filtres = [
    where('owner', '==', user.uid),
    orderBy('createdAt', 'desc'),
    ...(apres ? [startAfter(apres)] : []),
    limit(PHOTOS_PAR_LOT),
  ]
  const snap = await getDocs(query(photosRead, ...filtres))
  return {
    photos: snap.docs.map((d) => d.data()),
    curseur: snap.docs.at(-1),
    encore: snap.docs.length === PHOTOS_PAR_LOT, // lot plein → il y en a peut-être d'autres
  }
}

/**
 * LIRE une photo par son id.
 * null si elle n'existe pas (ou n'est pas à nous : les règles répondent alors "refusé").
 */
export async function lirePhoto(id: string): Promise<Photo | null> {
  try {
    const snap = await getDoc(doc(photosRead, id))
    return snap.exists() ? snap.data() : null
  } catch (e) {
    if (estRefuse(e)) return null
    throw e
  }
}

/**
 * SUPPRIMER une photo et sa grande image.
 * La photo d'abord : si la suite échoue, il reste au pire une image orpheline
 * (invisible, juste de la place perdue), jamais une photo qui pointe vers une image absente.
 */
export async function supprimerPhoto(photo: Photo): Promise<void> {
  await deleteDoc(doc(photosWrite, photo.id))
  if (photo.imageId) await supprimerImage(photo.imageId)
}
