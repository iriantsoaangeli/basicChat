import { Timestamp, type FirestoreDataConverter } from 'firebase/firestore'
import type { CreateDocument, DbDocument } from '@/type/firebase'

// user = toi ; gemini = l'IA ; autre = TOUT autre auteur (voir fromFirestore)
export type Auteur = 'user' | 'gemini' | 'autre'

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

// Transforme n'importe quelle date venant de la base en vrai Timestamp :
// - Timestamp           → gardé tel quel
// - texte ou nombre     → converti (document créé à la main avec le mauvais type)
// - null / absent       → heure actuelle (ne devrait plus arriver grâce à 'estimate')
function enTimestamp(valeur: unknown): Timestamp {
    if (valeur instanceof Timestamp) return valeur
    if (typeof valeur === 'string' || typeof valeur === 'number') {
        const d = new Date(valeur)
        if (!isNaN(d.getTime())) return Timestamp.fromDate(d)
    }
    return Timestamp.now()
}

export const messageConverter: FirestoreDataConverter<Message> = {
    toFirestore: ({id, ...data}) => data,
    fromFirestore: (snap, options) => {
        // 'estimate' : un message pas encore confirmé par le serveur a une date
        // ESTIMÉE au lieu de null (sinon .toDate() plante à l'affichage)
        const data = snap.data({ ...options, serverTimestamps: 'estimate' })
        // Tout auteur qui n'est ni 'user' ni 'gemini' devient 'autre' (sa propre couleur)
        const auteur: Auteur = data.auteur === 'user' || data.auteur === 'gemini' ? data.auteur : 'autre'
        return {
            ...data,
            id: snap.id,
            auteur,
            createdAt: enTimestamp(data.createdAt),
            updatedAt: enTimestamp(data.updatedAt),
        } as Message
    },
}