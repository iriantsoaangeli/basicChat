// src/services/gemini.ts
import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
const MODEL = 'gemini-3.8-flash';

export interface ChatMsg {
  role: 'user' | 'bot';
  text: string;
}

export async function askGemini(history: ChatMsg[], text: string): Promise<string> {
  const chat = genai.chats.create({
    model: MODEL,
    history: history.map(m => ({
      role: m.role === 'bot' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })),
    config: { systemInstruction: 'Réponds en français, brièvement.' },
  });

  const res = await chat.sendMessage({ message: text });
  return res.text ?? '';
}