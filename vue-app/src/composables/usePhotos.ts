// src/composables/usePhotos.ts
// RÔLE : garder les photos chargées dans un état réactif, partagé par toute l'app
// (la galerie remplit la liste, PhotoGrand y retrouve une photo sans la relire).
// Gère aussi "chargement en cours", les erreurs, les lots de 8 et le tri.
//
// Le tri se fait ICI, pas dans Firestore (un seul index au lieu d'un par tri) :
//   - chaque lot reçu est ajouté à la liste, puis TOUTE la liste est retriée
//   - changer de tri retrie les photos déjà chargées (pas de rechargement)
// Donc tant que tout n'est pas chargé, le tri vaut pour ce qui est affiché,
// et une photo d'un nouveau lot peut se placer avant celles déjà affichées.
import { readonly, ref, shallowRef } from 'vue'
import { Timestamp } from 'firebase/firestore'
import { errorMessage } from '@/service/errors'
import { creerPhoto, lirePhoto, listerMesPhotos, supprimerPhoto, type Curseur } from '@/service/photos'
import type { NouvellePhoto, Photo, Tri } from '@/type/photo'

const photos = shallowRef<Photo[]>([]) // shallow : on remplace le tableau, on ne modifie pas les photos
const chargement = ref(false)
const erreur = ref<string | null>(null)
const encore = ref(false) // reste-t-il un lot à charger ?

let tri: Tri = { champ: 'createdAt', croissant: false }
let curseur: Curseur | undefined
let demande = 0 // numéro de la dernière demande : une réponse plus ancienne est ignorée

// Compare deux valeurs d'un champ : dates Firestore ou textes (ordre alphabétique français)
function comparer(a: Photo[Tri['champ']], b: Photo[Tri['champ']]): number {
  if (a instanceof Timestamp && b instanceof Timestamp) return a.toMillis() - b.toMillis()
  return String(a).localeCompare(String(b), 'fr', { numeric: true })
}

// Renvoie une copie triée (ne modifie jamais le tableau reçu)
function trier(liste: readonly Photo[]): Photo[] {
  const sens = tri.croissant ? 1 : -1
  return [...liste].sort((a, b) => sens * comparer(a[tri.champ], b[tri.champ]))
}

// Charge un lot ; `suite` = l'ajouter à la liste au lieu de la remplacer
async function chargerLot(suite: boolean) {
  const numero = ++demande
  chargement.value = true
  erreur.value = null
  try {
    const lot = await listerMesPhotos(suite ? curseur : undefined)
    if (numero !== demande) return // un rechargement a été demandé entre-temps
    photos.value = trier(suite ? [...photos.value, ...lot.photos] : lot.photos)
    curseur = lot.curseur
    encore.value = lot.encore
  } catch (e) {
    if (numero !== demande) return
    erreur.value = errorMessage(e)
    console.error(e)
  } finally {
    if (numero === demande) chargement.value = false
  }
}

/** (Re)charge le premier lot */
function charger() {
  curseur = undefined
  return chargerLot(false)
}

/** Ajoute le lot suivant (défilement infini) */
function chargerPlus() {
  if (!encore.value || chargement.value) return Promise.resolve()
  return chargerLot(true)
}

/** Change le tri : retrie les photos déjà chargées, sans rien relire dans Firestore */
function trierPar(nouveau: Tri) {
  tri = nouveau
  photos.value = trier(photos.value)
}

/**
 * Enregistre une nouvelle photo, l'ajoute à la liste et retrie.
 * Renvoie un message d'erreur ou null.
 */
async function ajouter(nouvelle: NouvellePhoto): Promise<string | null> {
  try {
    const id = await creerPhoto(nouvelle)
    const creee = await lirePhoto(id) // 1 lecture : récupère les dates posées par le serveur
    if (creee) photos.value = trier([...photos.value, creee])
    return null
  } catch (e) {
    console.error(e)
    return errorMessage(e)
  }
}

/** Supprime une photo (et sa grande image) puis la retire de la liste. Renvoie un message d'erreur ou null. */
async function supprimer(photo: Photo): Promise<string | null> {
  try {
    await supprimerPhoto(photo)
    photos.value = photos.value.filter((p) => p.id !== photo.id)
    return null
  } catch (e) {
    console.error(e)
    return errorMessage(e)
  }
}

/** Une photo déjà chargée (undefined sinon : il faudra la lire dans Firestore) */
function trouver(id: string) {
  return photos.value.find((p) => p.id === id)
}

export function usePhotos() {
  return {
    photos: readonly(photos),
    chargement: readonly(chargement),
    erreur: readonly(erreur),
    encore: readonly(encore),
    charger,
    chargerPlus,
    trierPar,
    ajouter,
    supprimer,
    trouver,
  }
}
