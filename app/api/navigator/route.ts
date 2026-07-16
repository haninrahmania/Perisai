import { GoogleGenAI } from '@google/genai';
import { NAVIGATOR_SYSTEM } from '@/lib/navigator-prompt';
import { detectCrisis, EMERGENCY } from '@/lib/crisis';
import { matchFallback } from '@/lib/navigator-fallbacks';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODELS = (process.env.GEMINI_MODEL ?? 'gemini-3.5-flash,gemini-3.1-flash-lite')
  .split(',').map((m) => m.trim());

type Msg = { role: 'user' | 'model'; text: string };

export async function POST(req: Request) {
  const { messages, evidenceCount = 0 } = await req.json();
  const last = messages[messages.length - 1];

  const crisis = detectCrisis(last?.text ?? '');

  // TEMP — remove before ship
  const _debug = { lastText: last?.text ?? null, crisis };

  if (crisis) {
    return Response.json({ kind: 'crisis', crisis, contacts: EMERGENCY[crisis], text: '…', _debug });
  }

  const ctxLine =
    evidenceCount > 0
      ? `\n\nKONTEKS: Korban sudah mengamankan ${evidenceCount} bukti di Perisai (hash + timestamp) dan sudah punya kronologi yang bisa dibuka kapan saja. JANGAN tanya apakah dia sudah menyimpan bukti — dia sudah. Kalau relevan, rujuk ke bukti yang sudah ada.`
      : '';

  try {
    let res, lastErr;
    for (const model of MODELS) {
      try {
        res = await ai.models.generateContent({
          model,
          contents: messages.map((m: Msg) => ({ role: m.role, parts: [{ text: m.text }] })),
          config: {
            systemInstruction: NAVIGATOR_SYSTEM + ctxLine,   // ← here
            maxOutputTokens: 4000,
            temperature: 0.6,
          },
        });
        break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`${model} failed: ${err.message?.slice(0, 80)}`);
      }
    }
    if (!res) throw lastErr;

    const text = (res.text ?? '').trim();
    if (!text) throw new Error('empty response');
    return Response.json({ kind: 'reply', text, source: 'live' });
  } catch (e: any) {
    console.error('navigator error:', e.message);
    return Response.json({
        kind: 'reply',
        text: matchFallback(last?.text ?? ''),
        source: 'cached',
    });
  }
}