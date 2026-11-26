// src/service/photos.ts
// RÔLE : les opérations sur les photos (créer, lister par lots de 8, lire, supprimer).
// Firestore renvoie toujours le même ordre (plus récentes d'abord) : le tri choisi
// par l'utilisateur est fait dans usePhotos, sur les photos chargées.
// Les composants n'appellent QUE ces fonctions (via usePhotos), jamais Firestore directement.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  writeBatch,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db, ensureUser } from '@/firebase'
import { estRefuse } from '@/service/errors'
import { compresserGrandeImage, creerMiniature, refImage } from '@/service/images'
import {
  PHOTOS_PAR_LOT,
  type ImageCreate,
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

/**
 * CRÉER une photo. L'image est compressée en 2 tailles, puis la photo et la grande image
 * sont écrites dans UN batch : Firestore enregistre les deux, ou aucune (pas d'image orpheline).
 * Renvoie l'id de la photo.
 */
export async function creerPhoto(nouvelle: NouvellePhoto): Promise<string> {
  const user = await ensureUser()
  const batch = writeBatch(db)
  const photoRef = doc(photosWrite) // id généré tout de suite, rien n'est encore écrit
  const data: PhotoCreate = {
    owner: user.uid,
    nom: nouvelle.nom,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  // Firestore refuse les champs undefined : on n'ajoute que ce qui est rempli
  if (nouvelle.description) data.description = nouvelle.description
  if (nouvelle.fichier) {
    // Toute la compression d'abord : si elle échoue, rien n'a été écrit
    data.thumb = await creerMiniature(nouvelle.fichier) // petite image, pour la galerie
    const imageRef = refImage() // grande image, pour PhotoGrand
    batch.set(imageRef, {
      owner: user.uid,
      b64: await compresserGrandeImage(nouvelle.fichier),
      createdAt: serverTimestamp(),
    } satisfies ImageCreate)
    data.imageId = imageRef.id
  }
  batch.set(photoRef, data)
  await batch.commit()
  return photoRef.id
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

/** SUPPRIMER une photo et sa grande image, dans un batch : les deux disparaissent, ou aucune */
export async function supprimerPhoto(photo: Photo): Promise<void> {
  const batch = writeBatch(db)
  batch.delete(doc(photosWrite, photo.id))
  if (photo.imageId) batch.delete(refImage(photo.imageId))
  await batch.commit()
}
