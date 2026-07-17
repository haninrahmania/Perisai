'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { listEvidence } from '@/lib/evidence';
import { Shell, Title, Lede } from '@/components/ui';

type Contact = { name: string; contact: string; note: string };
type CrisisKind = 'physical_danger' | 'self_harm';
type ChatItem =
  | { kind: 'user'; text: string }
  | { kind: 'model'; text: string }
  | { kind: 'crisis'; crisisType: CrisisKind; contacts: Contact[] };

const SUGGESTED = [
  'Gimana cara mulai bikin laporan?',
  'Aku butuh KTP atau nama asli buat lapor?',
  'Aku takut malah aku yang dipidana, gimana?',
  'Videonya hasil editan (deepfake) — ngaruh ke laporannya gak?',
  'Berapa lama biasanya sampai kontennya turun?',
  'Siapa yang bisa aku hubungi selain di sini?',
];

const CRISIS_COPY: Record<CrisisKind, { title: string; note: string }> = {
  physical_danger: {
    title: 'Keselamatan kamu dulu.',
    note: 'Ini kedengarannya mendesak. Kalau kamu dalam bahaya sekarang, hubungi salah satu dari ini dulu — laporan bisa menunggu.',
  },
  self_harm: {
    title: 'Kamu tidak sendirian.',
    note: 'Apa yang kamu rasakan itu nyata, dan kamu berhak dapat bantuan sekarang — bukan cuma soal laporan. Hubungi salah satu dari ini.',
  },
};

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      match[1] !== undefined ? (
        <strong key={key++}>{match[1]}</strong>
      ) : (
        <em key={key++}>{match[2]}</em>
      ),
    );
    lastIndex = regex.lastIndex;
  }
  parts.push(text.slice(lastIndex));
  return parts;
}

function Bubble({ role, children }: { role: 'user' | 'model'; children: ReactNode }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
          isUser
            ? 'bg-[color:var(--mist)] text-white'
            : 'border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--warm)]'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function CrisisCard({ crisisType, contacts }: { crisisType: CrisisKind; contacts: Contact[] }) {
  const copy = CRISIS_COPY[crisisType];
  return (
    <div className="rounded-2xl border border-[color:var(--fill)] bg-[rgba(255,141,92,0.08)] p-5">
      <p className="text-[15px] font-medium text-[color:var(--warm)]">{copy.title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted)]">{copy.note}</p>
      <div className="mt-4 space-y-2.5">
        {contacts.map((c) => (
          <a
            key={c.name}
            href={`tel:${c.contact}`}
            className="block rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3.5 transition-colors hover:border-[color:var(--mist)]"
          >
            <p className="text-[14px] font-medium text-[color:var(--warm)]">{c.name}</p>
            <p className="mt-0.5 font-mono text-[13px] text-[color:var(--mist)]">{c.contact}</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--muted)]">{c.note}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

function SuggestionChip({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3.5 py-2.5 text-left text-[13px] leading-snug text-[color:var(--muted)] transition-colors hover:border-[color:var(--mist)] hover:text-[color:var(--warm)]"
    >
      {text}
    </button>
  );
}

export default function PendampingPage() {
  const [display, setDisplay] = useState<ChatItem[]>([]);
  const [history, setHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEvidence()
      .then((rows) => setEvidenceCount(rows.length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [display, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextHistory = [...history, { role: 'user' as const, text: trimmed }];
    setHistory(nextHistory);
    setDisplay((d) => [...d, { kind: 'user', text: trimmed }]);
    setInput('');
    setShowSuggestions(false);
    setLoading(true);

    try {
      const res = await fetch('/api/navigator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextHistory, evidenceCount }),
      });
      const json = await res.json();

      if (json.kind === 'crisis') {
        setDisplay((d) => [
          ...d,
          { kind: 'crisis', crisisType: json.crisis, contacts: json.contacts },
        ]);
      } else {
        setHistory((h) => [...h, { role: 'model', text: json.text }]);
        setDisplay((d) => [...d, { kind: 'model', text: json.text }]);
      }
    } catch {
      setDisplay((d) => [
        ...d,
        {
          kind: 'model',
          text: 'Maaf, aku lagi tidak bisa menjawab sekarang. Coba lagi sebentar lagi.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <Shell back="auto" step="Tanya">
      <Title>Pendamping Perisai</Title>
      <Lede>
        Tanya apa saja soal laporan, bukti, atau langkah berikutnya. Ini pendamping informasi,
        bukan pengganti pengacara — dan kamu tidak perlu menjelaskan isi kontennya.
      </Lede>

      <div className="mt-6 space-y-3">
        {display.length === 0 && (
          <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
            <p className="text-[13px] leading-relaxed text-[color:var(--muted)]">
              Belum tahu mau mulai dari mana? Coba salah satu ini, atau tulis sendiri di bawah.
            </p>
          </div>
        )}

        {display.map((item, i) =>
          item.kind === 'crisis' ? (
            <CrisisCard key={i} crisisType={item.crisisType} contacts={item.contacts} />
          ) : (
            <Bubble key={i} role={item.kind}>
              {item.kind === 'model' ? renderInline(item.text) : item.text}
            </Bubble>
          ),
        )}

        {loading && (
          <Bubble role="model">
            <span className="text-[color:var(--muted)]">Mengetik…</span>
          </Bubble>
        )}

        <div ref={bottomRef} />
      </div>

      {showSuggestions && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTED.map((q) => (
            <SuggestionChip key={q} text={q} onClick={() => send(q)} />
          ))}
        </div>
      )}

      {!showSuggestions && (
        <button
          onClick={() => setShowSuggestions(true)}
          className="mt-4 text-[12px] text-[color:var(--muted)] transition-colors hover:text-[color:var(--warm)]"
        >
          Lihat saran pertanyaan lagi
        </button>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tulis pertanyaanmu…"
          disabled={loading}
          className="flex-1 rounded-xl border border-[color:var(--line)] bg-[color:var(--night)] px-4 py-3.5 text-[14px] text-[color:var(--warm)] placeholder:text-[#a394c4] focus:border-[color:var(--mist)] focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="shrink-0 rounded-xl bg-[color:var(--mist)] px-5 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-[#8f6cd9] disabled:bg-[#adb5e5] disabled:text-[color:var(--muted)]"
        >
          Kirim
        </button>
      </form>
    </Shell>
  );
}
