// src/services/gemini.ts
import { GoogleGenAI, ApiError } from '@google/genai';
import type { Message } from '@/type/message';
const genai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
const MODEL = 'gemini-3.8-flash';

export class GeminiError extends Error {}

export async function askGemini(history: Message[], texte: string): Promise<string> {
  const chat = genai.chats.create({
    model: MODEL,
    history: history.map(m => ({
      role: m.auteur === 'gemini' ? 'model' : 'user',
      parts: [{ text: m.texte }],
    })),
    config: { systemInstruction: 'Réponds en français, brièvement.' },
  });

  let res
  try {
    res = await chat.sendMessage({ message: texte })
  } catch (e) {
    console.error('Erreur Gemini', e)
    if (e instanceof ApiError && e.status === 429) throw new GeminiError('Quota atteint, réessaie plus tard')
    if (e instanceof ApiError && e.status === 503) throw new GeminiError('Gemini est surchargé, réessaie')
    throw new GeminiError('Gemini ne répond pas')
  }

  if (!res.text) throw new GeminiError('Gemini a renvoyé une réponse vide')
  return res.text
}