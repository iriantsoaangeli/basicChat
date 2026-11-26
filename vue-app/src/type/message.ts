import type { FirestoreDataConverter } from 'firebase/firestore'
import type { CreateDocument, DbDocument } from '@/type/firebase'

export type Auteur = 'user' | 'gemini'

interface MessageData {
    owner: string
    texte: string
    auteur: Auteur
}
// le vakiana
export interface Message extends DbDocument, MessageData {}
// le soratana
export interface CreateMessage extends CreateDocument, MessageData {}
// pas d'update pas besoin

export const messageConverter: FirestoreDataConverter<Message> = {
    toFirestore: ({id, ...data}) => data,
    fromFirestore: (snap) => ({ id: snap.id, ...snap.data() }) as Message,
}