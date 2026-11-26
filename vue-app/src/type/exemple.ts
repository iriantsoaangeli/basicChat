// src/type/exemple.ts
// RÔLE : exemple classique d'utilisation de Firestore pour un message.
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { CreateDocument, DbDocument, UpdateDocument } from './firebase'

// Forme LUE depuis la base (id vient du snapshot, dates = Timestamp)
interface Message extends DbDocument {
  text: string
  authorId: string
}

// Forme ENVOYÉE à la création (pas d'id, dates = serverTimestamp())
interface CreateMessage extends CreateDocument {
  text: string
  authorId: string
}

// Forme ENVOYÉE à la mise à jour (champs optionnels, updatedAt toujours rafraîchi)
interface UpdateMessage extends UpdateDocument {
  text?: string
}

const messagesCol = collection(db, 'messages')

// Snapshot → Message : l'id est ajouté à la main, il n'est pas dans les données
const toMessage = (snap: DocumentSnapshot) => ({ id: snap.id, ...snap.data() }) as Message

// Créer : Firestore génère l'id, on le renvoie
export async function createMessage(text: string, authorId: string): Promise<string> {
  const now = serverTimestamp()
  const ref = await addDoc(messagesCol, {
    text,
    authorId,
    createdAt: now,
    updatedAt: now,
  } satisfies CreateMessage)
  return ref.id
}

// Modifier : seulement les champs qui changent
export function editMessage(id: string, text: string): Promise<void> {
  return updateDoc(doc(messagesCol, id), { text, updatedAt: serverTimestamp() } satisfies UpdateMessage)
}

// Lire un message (null s'il n'existe pas)
export async function getMessage(id: string): Promise<Message | null> {
  const snap = await getDoc(doc(messagesCol, id))
  return snap.exists() ? toMessage(snap) : null
}

// Écouter tous les messages en temps réel, triés par date ; renvoie la fonction pour arrêter
export function listenMessages(cb: (messages: Message[]) => void) {
  const q = query(messagesCol, orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) => cb(snap.docs.map(toMessage)))
}
