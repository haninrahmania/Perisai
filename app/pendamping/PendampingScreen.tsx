'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { caseStore, type ReportRecord } from '@/lib/case-store';
import {
  reviewAssistantDisclosure,
  type AssistantBoundaryResult,
  type AssistantReportContext,
} from '@/lib/assistant-boundary';
import { REPORT_STATUS_LABEL, REPORT_TARGET_METADATA } from '@/lib/reporting';
import { useActiveCase } from '@/components/useActiveCase';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import { Button, Lede, Notice, PageSkeleton, Shell, Title } from '@/components/ui';

const SUGGESTED = [
  'Apa langkah yang masuk akal setelah laporan dikirim?',
  'Bagaimana menindaklanjuti laporan yang belum dijawab?',
  'Siapa yang bisa mendampingi proses pelaporan?',
];

const transport = new DefaultChatTransport({ api: '/api/navigator' });

export default function PendampingScreen() {
  const { activeCase, loading: caseLoading, error: caseError } = useActiveCase();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [consent, setConsent] = useState(false);
  const [reportId, setReportId] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [crisis, setCrisis] = useState<Extract<AssistantBoundaryResult, { kind: 'crisis' }> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status, error: chatError } = useChat({ transport });

  useEffect(() => {
    if (!activeCase) return;
    void caseStore.listReports(activeCase.id)
      .then((records) => setReports(records.filter((record) => record.status !== 'draft')))
      .catch(() => setLocalError('Daftar laporan belum bisa dibuka. Muat ulang halaman untuk mencoba lagi.'))
      .finally(() => setLoading(false));
  }, [activeCase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status, crisis]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === reportId),
    [reportId, reports],
  );
  const busy = status === 'submitted' || status === 'streaming';

  async function send(text: string) {
    if (busy) return;
    setLocalError(null);
    setCrisis(null);

    const reportContext: AssistantReportContext | null =
      selectedReport && selectedReport.status !== 'draft'
        ? { target: selectedReport.target, status: selectedReport.status }
        : null;

    try {
      const disclosure = reviewAssistantDisclosure({ message: text, consent, reportContext });
      if (disclosure.kind === 'crisis') {
        setCrisis(disclosure);
        return;
      }
      setInput('');
      await sendMessage(
        { text: disclosure.disclosure.message },
        { body: { consent: true, reportContext: disclosure.disclosure.reportContext } },
      );
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : 'Pesan belum bisa dikirim.');
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  if (caseLoading || loading) {
    return <PageSkeleton cards={3} />;
  }
  if (caseError) return <Shell><Notice>{caseError}</Notice></Shell>;
  if (!activeCase) return <Shell><Button href="/">Pilih atau buat kasus</Button></Shell>;
  if (reports.length === 0) {
    return (
      <Shell back={{ href: '/dashboard/', label: 'Kasus' }}>
        <Title>Pendamping tersedia setelah melapor</Title>
        <Lede>Ubah status setidaknya satu laporan menjadi sudah dikirim sebelum meminta panduan.</Lede>
        <div className="mt-8"><Button href="/takedown/">Kembali ke laporan</Button></div>
      </Shell>
    );
  }

  return (
    <Shell back={{ href: '/dashboard/', label: 'Kasus' }} step="Pendamping AI">
      <Title>Pendamping Perisai</Title>
      <Lede>
        Hanya pesan yang kamu tulis yang dikirim ke Google Gemini. Bukti, tautan, isi laporan,
        identitas, dan informasi kasus tetap di perangkat ini.
      </Lede>

      <section className="mt-6 rounded-2xl border border-[color:var(--fill)] bg-[rgba(255,141,92,0.08)] p-5">
        <label className="flex gap-3 text-[13px] leading-relaxed text-[color:var(--muted)]">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          Saya mengerti bahwa pesan yang saya tulis akan dikirim ke Google Gemini. Saya tidak akan
          menyertakan nama, kontak, tautan bukti, atau detail pribadi yang tidak diperlukan.
        </label>
        <label className="mt-4 block text-[12px] text-[color:var(--muted)]">
          Sertakan tujuan dan status laporan (opsional)
          <select
            value={reportId}
            onChange={(event) => setReportId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-[13px] text-[color:var(--warm)]"
          >
            <option value="">Jangan sertakan informasi laporan</option>
            {reports.map((report) => (
              <option key={report.id} value={report.id}>
                {REPORT_TARGET_METADATA[report.target].label} · {REPORT_STATUS_LABEL[report.status]}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-[11px] text-[color:var(--muted)]">
          Jika dipilih, Gemini hanya menerima tujuan laporan dan statusnya. Isi laporan dan bukti
          tetap di perangkat ini.
        </p>
      </section>

      <div className="mt-6 space-y-3" role="log" aria-live="polite" aria-busy={busy}>
        {messages.length === 0 && (
          <Notice>Pilih pertanyaan contoh atau tulis pertanyaan singkat tanpa data identitas.</Notice>
        )}
        {messages.map((message) => {
          const text = message.parts
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join('');
          return (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.role === 'assistant' ? <MessageResponse>{text}</MessageResponse> : text}
              </MessageContent>
            </Message>
          );
        })}
        {status === 'submitted' && (
          <Message from="assistant">
            <MessageContent>
              <div role="status" aria-live="polite" aria-busy="true">
                <span className="sr-only">Pendamping sedang menyiapkan jawaban</span>
                <div aria-hidden="true" className="space-y-2 py-1">
                  <div className="skeleton-block h-3 w-full rounded-full" />
                  <div className="skeleton-block h-3 w-5/6 rounded-full" />
                  <div className="skeleton-block h-3 w-2/3 rounded-full" />
                </div>
              </div>
            </MessageContent>
          </Message>
        )}
        {crisis && <CrisisCard result={crisis} />}
        <div ref={bottomRef} />
      </div>

      {messages.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTED.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setInput(suggestion)}
              className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3.5 py-2.5 text-left text-[13px] text-[color:var(--muted)]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <textarea
          value={input}
          onChange={(event) => { setInput(event.target.value); setLocalError(null); setCrisis(null); }}
          maxLength={1000}
          rows={2}
          placeholder="Tulis pertanyaan tanpa nama, kontak, atau tautan bukti…"
          disabled={busy}
          className="min-w-0 flex-1 resize-none rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-[14px] text-[color:var(--warm)]"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="self-stretch rounded-xl bg-[color:var(--mist)] px-5 text-[14px] font-medium text-white disabled:opacity-50"
        >
          Kirim ke Gemini
        </button>
      </form>
      {(localError || chatError) && (
        <p className="mt-3 text-[12px] text-[color:var(--fill)]">
          {localError ?? 'Pendamping belum bisa dihubungi. Bukti dan laporan tetap di perangkat ini.'}
        </p>
      )}
    </Shell>
  );
}

function CrisisCard({
  result,
}: {
  result: Extract<AssistantBoundaryResult, { kind: 'crisis' }>;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--fill)] bg-[rgba(255,141,92,0.08)] p-5">
      <p className="text-[15px] font-medium text-[color:var(--heading)]">Keselamatanmu lebih penting.</p>
      <p className="mt-2 text-[13px] text-[color:var(--muted)]">Pesan ini tidak dikirim ke Gemini. Hubungi bantuan manusia sekarang:</p>
      {result.contacts.map((contact) => (
        <div key={contact.contact} className="mt-3 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
          <p className="text-[13px] font-medium text-[color:var(--warm)]">{contact.name}</p>
          <p className="mt-1 font-mono text-[12px] text-[color:var(--mist)]">{contact.contact}</p>
          <p className="mt-1 text-[12px] text-[color:var(--muted)]">{contact.note}</p>
        </div>
      ))}
    </div>
  );
}
