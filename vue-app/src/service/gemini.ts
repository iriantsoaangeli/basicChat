import { ApiError, GoogleGenAI } from '@google/genai'
import type { Message } from '@/type/message'

const genai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })

const MODELES = ['gemini-3.8-flash', 'gemini-3.5-flash-lite']
const CONSIGNE = 'Réponds en français, brièvement.'
const DELAI_MAX = 20_000

export class GeminiError extends Error {}

export async function askGemini(history: Message[], texte: string): Promise<string> {
  const historique = history.map((m) => ({
    // Gemini ne connaît que 2 rôles : 'model' (lui) et 'user' (les autres).
    // Un message d'un autre participant part en 'user', préfixé pour que Gemini sache qui parle.
    role: m.auteur === 'gemini' ? 'model' : 'user',
    parts: [{ text: m.auteur === 'autre' ? `[Autre participant] ${m.texte}` : m.texte }],
  }))

  for (const model of MODELES) {
    const chat = genai.chats.create({ model, history: historique })
    try {
      const res = await chat.sendMessage({
        message: texte,
        config: { systemInstruction: CONSIGNE, abortSignal: AbortSignal.timeout(DELAI_MAX) },
      })
      if (!res.text) throw new GeminiError('Gemini a renvoyé une réponse vide')
      return res.text
    } catch (e) {
      console.error('[Gemini]', model, e)
      if (e instanceof GeminiError) throw e
      const surcharge = e instanceof ApiError && e.status === 503
      const tropLong = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError')
      if (surcharge || tropLong) continue
      if (e instanceof ApiError && e.status === 429) throw new GeminiError('Quota atteint, réessaie plus tard')
      throw new GeminiError('Gemini ne répond pas')
    }
  }
  throw new GeminiError('Gemini est surchargé, réessaie dans un moment')
}


// ==================================================================
// MISE EN FORME DES RÉPONSES : Markdown de Gemini → HTML sûr
// ==================================================================
// Gemini écrit en Markdown : **gras**, *italique*, `code`, listes "- ",
// "1. ", titres "# ", blocs ```code```. On le transforme en HTML pour
// l'afficher avec v-html dans ChatBubble.
//
// SÉCURITÉ : on ÉCHAPPE d'abord tout le texte ("<" devient "&lt;"...).
// Le seul HTML qui reste est donc celui qu'on ajoute nous-mêmes :
// un "<script>" renvoyé par Gemini s'affiche comme du texte.

// "<b>" → "&lt;b&gt;" : plus aucune balise venant de Gemini ne peut s'exécuter
function echapper(t: string): string {
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Mise en forme À L'INTÉRIEUR d'une ligne (texte déjà échappé)
function enLigne(t: string): string {
  // On découpe autour des `code` : ce qui est dans du code reste tel quel
  return t
    .split(/(`[^`]+`)/g)
    .map((morceau) => {
      if (morceau.length > 1 && morceau.startsWith('`') && morceau.endsWith('`')) {
        return `<code>${morceau.slice(1, -1)}</code>`
      }
      return morceau
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
        .replace(
          /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
        )
    })
    .join('')
}

export function beautifyAnswer(texte: string): string {
  const lignes = echapper(texte.trim()).split('\n')
  const html: string[] = []

  let paragraphe: string[] = []          // lignes du paragraphe en cours
  let liste: 'ul' | 'ol' | null = null   // liste ouverte (à puces ou numérotée)
  let code: string[] | null = null       // lignes du bloc ``` en cours

  const fermerParagraphe = () => {
    if (paragraphe.length) html.push(`<p>${paragraphe.map(enLigne).join('<br>')}</p>`)
    paragraphe = []
  }
  const fermerListe = () => {
    if (liste) html.push(`</${liste}>`)
    liste = null
  }

  for (const ligne of lignes) {
    // Bloc de code ``` ... ``` : on garde les lignes telles quelles
    if (ligne.trim().startsWith('```')) {
      if (code) {
        html.push(`<pre><code>${code.join('\n')}</code></pre>`)
        code = null
      } else {
        fermerParagraphe()
        fermerListe()
        code = []
      }
      continue
    }
    if (code) {
      code.push(ligne)
      continue
    }

    const titre = ligne.match(/^#{1,6}\s+(.*)$/)
    const puce = ligne.match(/^\s*[-*•]\s+(.*)$/)
    const numero = ligne.match(/^\s*\d+[.)]\s+(.*)$/)
    const separateur = /^\s*([-*_])\1{2,}\s*$/.test(ligne)

    if (ligne.trim() === '' || separateur) {
      // ligne vide ou "---" = fin du bloc en cours
      fermerParagraphe()
      fermerListe()
    } else if (titre) {
      fermerParagraphe()
      fermerListe()
      html.push(`<p class="titre">${enLigne(titre[1] ?? '')}</p>`)
    } else if (puce || numero) {
      fermerParagraphe()
      const type = puce ? 'ul' : 'ol'
      if (liste !== type) {
        fermerListe()
        html.push(`<${type}>`)
        liste = type
      }
      html.push(`<li>${enLigne((puce ?? numero)?.[1] ?? '')}</li>`)
    } else {
      fermerListe()
      paragraphe.push(ligne)
    }
  }

  // Ferme ce qui est resté ouvert à la fin du texte
  if (code) html.push(`<pre><code>${code.join('\n')}</code></pre>`)
  fermerParagraphe()
  fermerListe()
  return html.join('')
}