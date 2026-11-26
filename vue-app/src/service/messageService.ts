import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, startAfter, Timestamp, where, } from "firebase/firestore"
import { db, ensureUser } from "@/firebase"
import { askGemini, GeminiError } from "./gemini"
import { messageConverter } from "@/type/message"

import type { Message, Auteur, CreateMessage } from "@/type/message"

// pour ecrire
const messageCol = collection(db, 'messages')
// pour lire
const messageLus = messageCol.withConverter(messageConverter)

// avant = date du plus vieux message déjà affiché (curseur) ; absent = les plus récents
export async function fetchMessage(max=50, avant?: Timestamp): Promise<Message[]> {
    const  user = await ensureUser()
    // recent ; avec startAfter : la page juste avant le curseur
    const q = avant
        ? query(messageLus, where('owner', '==', user.uid), orderBy('createdAt', 'desc'), startAfter(avant), limit(max))
        : query(messageLus, where('owner', '==', user.uid), orderBy('createdAt', 'desc'), limit(max))
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

// Étape 1 : enregistrer la question. La page l'affiche dès que c'est fait,
// SANS attendre Gemini.
export async function sendQuestion(texte: string): Promise<Message> {
    if (!navigator.onLine)
        throw new GeminiError('Pas de connexion internet')

    return registerMessage(texte, 'user')
}

// Étape 2 : demander la réponse à Gemini, puis l'enregistrer.
// history = les messages AVANT la question (la question part à part, dans texte)
export async function answerMessage(texte: string, history: Message[]): Promise<Message> {
    const rep = await askGemini(history.slice(-20), texte)
    return registerMessage(rep, 'gemini')
}