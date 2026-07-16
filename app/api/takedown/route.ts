import { GoogleGenAI } from '@google/genai';
import { buildPrompt, type TakedownTarget } from '@/lib/takedown-prompts';
import { FALLBACKS } from '@/lib/takedown-fallbacks';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';

export async function POST(req: Request) {
  const { target, ctx } = await req.json();

  try {
    const { system, user } = buildPrompt(target as TakedownTarget, ctx);

    const res = await ai.models.generateContent({
      model: MODEL,
      contents: user,
      config: {
        systemInstruction: system,
        maxOutputTokens: 8000,
        temperature: 0.4,
      },
    });

    const clean = (res.text ?? '')
      .replace(/^```[a-z]*\n?/i, '')
      .replace(/```\s*$/, '')
      .trim();

    if (!clean) {
      console.error('empty response', res.usageMetadata);
      throw new Error('empty response');
    }

    return Response.json({ text: clean, source: 'live' });
  } catch (e: any) {
    console.error('takedown route error:', e.message);
    const fallback = FALLBACKS[target as TakedownTarget];
    if (fallback) return Response.json({ text: fallback, source: 'cached' });
    return Response.json({ error: e.message }, { status: 500 });
  }
}