'use client';

import { useState } from 'react';

const CATEGORY = 'Pornografi / Kesusilaan';

function CopyRow({
  label,
  hint,
  value,
  onChange,
  rows,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange?: (v: string) => void;
  rows?: number;
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
        <p className="text-[13px] font-medium text-[color:var(--warm)]">{label}</p>
        <button
          onClick={copy}
          disabled={!value.trim()}
          className="shrink-0 rounded-md border border-[color:var(--line)] px-2.5 py-1.5 text-[11px] text-[color:var(--muted)] transition-colors hover:text-[color:var(--warm)] disabled:opacity-40"
        >
          {copied ? 'Tersalin' : 'Salin'}
        </button>
      </div>
      {hint && <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--muted)]">{hint}</p>}
      {readOnly ? (
        <p className="mt-2.5 break-all font-mono text-[12px] leading-relaxed text-[color:var(--mist)]">
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

export function KomdigiHelper({
  screenshotCount,
  defaultReason,
}: {
  screenshotCount: number;
  defaultReason: string;
}) {
  const [reason, setReason] = useState(defaultReason);
  const [opened, setOpened] = useState(false);

  const tooShort = reason.trim().length < 20;

  async function openForm() {
    try {
      await navigator.clipboard.writeText(reason);
      setOpened(true);
      setTimeout(() => setOpened(false), 2000);
    } catch {
      // Opening still helps even if clipboard is blocked.
    }
    window.open('https://aduankonten.id', '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-2)] p-4">
        <p className="text-[13px] font-medium text-[color:var(--warm)]">
          Formulir Komdigi cuma minta tiga hal
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--muted)]">
          Kategori, alasan, dan tangkapan layar. Tidak ada nama, tidak ada NIK — kamu melapor tanpa
          menyebut siapa kamu.
        </p>
      </div>

      <CopyRow
        label="1. Kandungan Konten"
        hint="Pilih ini di dropdown. Cukup dipilih, tidak perlu disalin."
        value={CATEGORY}
      />

      <div>
        <CopyRow
          label="2. Alasan"
          hint="Minimal 20 huruf. Ubah sesukamu — ini kata-katamu sendiri."
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

      <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--night)] p-4">
        <p className="text-[13px] font-medium text-[color:var(--warm)]">3. Unggah tangkapan layar</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--muted)]">
          {screenshotCount > 0
            ? 'Komdigi mewajibkan filenya diunggah dari device kamu. Kalau tangkapan layarnya sudah kamu hapus dari galeri, kamu bisa mengunduhnya kembali dari brankas.'
            : 'Komdigi mewajibkan tangkapan layar. Brankas kamu belum berisi satu pun — kamu bisa menambahkannya dulu di halaman brankas.'}
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--muted)]">
          Maksimal 5MB. Format: jpg, png, mp4, pdf, doc, docx.
        </p>
      </div>

      <button
        onClick={openForm}
        className="flex w-full items-center justify-center rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-2)] px-4 py-3.5 text-[14px] text-[color:var(--warm)] transition-colors hover:border-[color:var(--mist)]"
      >
        {opened ? 'Alasan tersalin — formulir terbuka' : 'Salin alasan, lalu buka aduankonten.id'}
      </button>
      <p className="text-[11px] leading-relaxed text-[color:var(--muted)]">
        Formulirnya terbuka di tab baru. Tempel tautan kontennya di sana, lalu isi tiga bagian di
        atas. Kamu yang menekan kirim.
      </p>
    </div>
  );
}