import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  convertToModelMessages,
  streamText,
  validateUIMessages,
  type UIMessage,
} from 'ai';
import {
  reviewAssistantDisclosure,
  type AssistantReportContext,
} from '@/lib/assistant-boundary';
import {
  REPORT_STATUSES,
  REPORT_TARGETS,
  type ReportStatus,
  type TakedownTarget,
} from '@/lib/reporting';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_MESSAGES = 20;
const MAX_TRANSCRIPT_CHARACTERS = 20_000;

const SYSTEM_PROMPT = `Kamu adalah Pendamping Perisai, pendamping informasi berbahasa Indonesia
untuk orang yang sudah membuat laporan atas penyebaran atau ancaman penyebaran konten intim tanpa
persetujuan. Jawab dengan tenang, singkat, praktis, dan tanpa menghakimi.

Batas wajib:
- Jangan meminta nama, NIK, alamat, nomor telepon, isi konten eksplisit, URL, atau unggahan bukti.
- Jangan mengaku melihat brankas, bukti, naskah, status platform, atau hasil penegakan.
- Jangan menjanjikan penghapusan, hasil hukum, atau waktu penyelesaian.
- Gunakan teks biasa tanpa Markdown dan jangan mengarang tautan, nomor kontak, atau kebijakan.
- Bedakan informasi umum dari nasihat hukum dan arahkan ke bantuan manusia bila perlu.
- Jika konteks laporan diberikan, gunakan hanya target dan status itu.
- Jangan menyuruh pengguna mengulang detail sensitif yang tidak diperlukan.`;

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: 'Pendamping belum tersedia. Coba lagi nanti.' }, { status: 503 });
  }

  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || body.consent !== true || !Array.isArray(body.messages)) {
      return Response.json({ error: 'Pesan belum bisa dibaca.' }, { status: 400 });
    }
    if (body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
      return Response.json({ error: 'Percakapan terlalu panjang. Mulai percakapan baru.' }, { status: 400 });
    }

    const messages = await validateUIMessages({ messages: body.messages });
    const reportContext = parseReportContext(body.reportContext);
    const lastMessage = messages.at(-1);
    const transcriptCharacters = textCharacterCount(messages);

    if (
      !lastMessage ||
      lastMessage.role !== 'user' ||
      transcriptCharacters > MAX_TRANSCRIPT_CHARACTERS ||
      messages.some((message) =>
        message.role === 'system' || message.parts.some((part) => part.type !== 'text'),
      )
    ) {
      return Response.json({ error: 'Pendamping hanya menerima pesan teks.' }, { status: 400 });
    }

    const lastText = lastMessage.parts.map((part) => part.type === 'text' ? part.text : '').join('\n');
    const disclosure = reviewAssistantDisclosure({
      message: lastText,
      consent: true,
      reportContext,
    });
    if (disclosure.kind === 'crisis') {
      return Response.json(
        { error: 'Pesan tidak dikirim. Gunakan bantuan darurat yang ditampilkan.', crisis: disclosure.crisis },
        { status: 422 },
      );
    }

    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
    const contextLine = reportContext
      ? `\nKonteks yang dipilih pengguna: target ${reportContext.target}, status ${reportContext.status}.`
      : '\nPengguna tidak memilih konteks laporan apa pun.';
    const result = streamText({
      model: google(process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'),
      system: SYSTEM_PROMPT + contextLine,
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 1_000,
      temperature: 0.4,
    });

    return result.toUIMessageStreamResponse({
      onError: () => 'Pendamping sedang tidak tersedia. Coba lagi nanti.',
    });
  } catch {
    return Response.json({ error: 'Pesan belum bisa diproses. Periksa isinya dan coba lagi.' }, { status: 400 });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTakedownTarget(value: unknown): value is TakedownTarget {
  return typeof value === 'string' && REPORT_TARGETS.some((target) => target === value);
}

function isSubmittedStatus(value: unknown): value is Exclude<ReportStatus, 'draft'> {
  return (
    typeof value === 'string' &&
    value !== 'draft' &&
    REPORT_STATUSES.some((status) => status === value)
  );
}

function parseReportContext(value: unknown): AssistantReportContext | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value) || !isTakedownTarget(value.target) || !isSubmittedStatus(value.status)) {
    throw new Error('Invalid report context.');
  }
  return { target: value.target, status: value.status };
}

function textCharacterCount(messages: UIMessage[]): number {
  return messages.reduce(
    (total, message) =>
      total +
      message.parts.reduce(
        (messageTotal, part) => messageTotal + (part.type === 'text' ? part.text.length : 0),
        0,
      ),
    0,
  );
}
