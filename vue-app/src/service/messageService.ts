import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, Timestamp, where, } from "firebase/firestore"
import { db, ensureUser } from "@/firebase"
import { askGemini, GeminiError } from "./gemini"
import { messageConverter } from "@/type/message"

import type { Message, Auteur, CreateMessage } from "@/type/message"

// pour ecrire
const messageCol = collection(db, 'messages')
// pour lire
const messageLus = messageCol.withConverter(messageConverter)

export async function fetchMessage(max=50): Promise<Message[]> {
    const  user = await ensureUser()
    // recent
    const q = query(messageLus, where('owner', '==', user.uid), orderBy('createdAt', 'desc'), limit(max))
    const snap = await getDocs(q)
    // les plus anciens en premier
    return snap.docs.map((d) => d.data()).reverse()
}

export async function registerMessage(texte: string, auteur: Auteur): Promise<Message> {
    const  user = await ensureUser()
    const now = serverTimestamp()
    const ref = await addDoc(messageCol, {owner: user.uid,texte, auteur, createdAt: now, updatedAt: now} satisfies CreateMessage)
    // evite de rappeller la base pour l'affichage
    const ici = Timestamp.now()
    // le serveur rappelle apres
    return {id: ref.id,owner: user.uid, texte, auteur, createdAt: ici, updatedAt: ici}
}

export async function sendMessage(texte: string, history: Message[]): Promise<Message[]> {
    if (!navigator.onLine)
        throw new GeminiError('Pas de connexion internet')

    const question = await registerMessage(texte, 'user')
    const rep = await askGemini(history.slice(-20), texte)
    const message = await registerMessage(rep, 'gemini')
    return [question, message]
}