'use client';

import { useState } from 'react';

function CopyRow({
  step,
  label,
  hint,
  value,
  onChange,
  rows,
  mono,
}: {
  step: string;
  label: string;
  hint?: string;
  value: string;
  onChange?: (v: string) => void;
  rows?: number;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const readOnly = !onChange;

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--night)] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[11px] text-[color:var(--mist)]">{step}</span>
          <p className="text-[13px] font-medium text-[color:var(--warm)]">{label}</p>
        </div>
        <button
          onClick={copy}
          disabled={!value.trim()}
          className="shrink-0 rounded-md border border-[color:var(--line)] px-2.5 py-1.5 text-[11px] text-[color:var(--muted)] transition-colors hover:text-[color:var(--warm)] disabled:opacity-40"
        >
          {copied ? 'Tersalin' : 'Salin'}
        </button>
      </div>
      {hint && (
        <p className="mt-1 pl-[26px] text-[11px] leading-relaxed text-[color:var(--muted)]">
          {hint}
        </p>
      )}
      {readOnly ? (
        <p
          className={`mt-2.5 break-all text-[12px] leading-relaxed text-[color:var(--mist)] ${
            mono ? 'font-mono' : ''
          }`}
        >
          {value || '—'}
        </p>
      ) : (
        <textarea
          rows={rows ?? 4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2.5 w-full resize-y rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2.5 text-[13px] leading-relaxed text-[color:var(--warm)] focus:border-[color:var(--mist)] focus:outline-none"
        />
      )}
    </div>
  );
}

export function KomdigiHelper({ defaultReason }: { defaultReason: string }) {
  const [reason, setReason] = useState(defaultReason);
  const [tab, setTab] = useState<'reason' | 'site'>('reason');

  const tooShort = reason.trim().length < 20;

  function openSite() {
    setTab('site');
    window.open('https://aduankonten.id', '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTab('reason')}
          className={`flex-1 rounded-lg border px-3 py-2.5 text-[13px] transition-colors ${
            tab === 'reason'
              ? 'border-[color:var(--mist)] bg-[color:var(--surface-2)] text-[color:var(--warm)]'
              : 'border-[color:var(--line)] text-[color:var(--muted)]'
          }`}
        >
          Isi alasan
        </button>
        <button
          onClick={openSite}
          className={`flex-1 rounded-lg border px-3 py-2.5 text-[13px] transition-colors ${
            tab === 'site'
              ? 'border-[color:var(--mist)] bg-[color:var(--surface-2)] text-[color:var(--warm)]'
              : 'border-[color:var(--line)] text-[color:var(--muted)]'
          }`}
        >
          Buka aduankonten.id
        </button>
      </div>

      {tab === 'reason' ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-2)] p-4">
            <p className="text-[13px] font-medium text-[color:var(--warm)]">
              Komdigi tidak menanyakan siapa kamu
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--muted)]">
              Tidak ada nama, tidak ada NIK. Tulis alasanmu di sini dulu, baru buka formulirnya.
            </p>
          </div>
          <div>
            <CopyRow
              step="1"
              label="Alasan"
              hint="Minimal 20 huruf. Ubah sesukamu — ini kata-katamu sendiri. Tempel di kolom alasan pada formulir."
              value={reason}
              onChange={setReason}
              rows={6}
            />
            {tooShort && (
              <p className="mt-1.5 px-1 text-[11px] text-[color:var(--fill)]">
                Masih kurang dari 20 huruf — formulirnya akan menolak.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--night)] p-4">
          <p className="text-[13px] font-medium text-[color:var(--warm)]">
            Situsnya sudah terbuka di tab baru
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--muted)]">
            Balik ke tab “Isi alasan” untuk menyalin alasanmu, lalu tempel di formulir
            aduankonten.id. Kamu yang menekan kirim.
          </p>
        </div>
      )}
    </div>
  );
}