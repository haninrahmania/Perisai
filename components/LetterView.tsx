'use client';

import { useMemo, useState } from 'react';

const PLACEHOLDER_SPLIT = /(\[[^\]\n]+\])/g;

export function extractPlaceholders(text: string): string[] {
  return Array.from(new Set(text.match(/\[[^\]\n]+\]/g) ?? []));
}

function isLongField(p: string) {
  return /alamat|kronologi|keterangan|deskripsi/i.test(p);
}

function hintFor(p: string): string | null {
  if (/nomor induk kependudukan|nik/i.test(p)) return '16 digit, sesuai KTP';
  if (/nama lengkap/i.test(p)) return 'Sesuai KTP';
  if (/telepon|hp/i.test(p)) return 'Nomor yang bisa dihubungi';
  if (/email/i.test(p)) return 'Email yang kamu pakai untuk mengirim laporan';
  if (/tanggal/i.test(p)) return 'Contoh: 14 Juli 2026';
  return null;
}

export function LetterView({
  text,
  values,
  onChange,
  needsIdentity = false,
  mailto,
  formUrl,
  formLabel,
}: {
  text: string;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  needsIdentity?: boolean;
  mailto?: string;
  formUrl?: string;
  formLabel?: string;
}) {
  const placeholders = useMemo(() => extractPlaceholders(text), [text]);
  const [copied, setCopied] = useState(false);
  const hasNik = /NIK|Nomor Induk Kependudukan/i.test(text);

  const filled = useMemo(() => {
    let out = text;
    for (const p of placeholders) {
      const v = values[p]?.trim();
      if (v) out = out.split(p).join(v);
    }
    return out;
  }, [text, placeholders, values]);

  const parts = useMemo(() => filled.split(PLACEHOLDER_SPLIT), [filled]);
  const remaining = placeholders.filter((p) => !values[p]?.trim()).length;

  const subjectLine = useMemo(() => {
    const first = filled.split('\n').find((l) => /^subject:/i.test(l.trim()));
    return first ? first.replace(/^subject:\s*/i, '').trim() : 'Report: Non-consensual content';
  }, [filled]);

  const bodyText = useMemo(
    () =>
      filled
        .split('\n')
        .filter((l) => !/^subject:/i.test(l.trim()))
        .join('\n')
        .trim(),
    [filled],
  );

  async function copy() {
    await navigator.clipboard.writeText(filled);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyThenOpen() {
    try {
      await navigator.clipboard.writeText(filled);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can fail; opening the form still helps.
    }
    window.open(formUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-4">
      {placeholders.length > 0 && (
        <div className="rounded-xl border border-[color:var(--fill)] bg-[rgba(196,132,106,0.08)] p-4">
          <p className="text-[13px] font-medium text-[color:var(--fill)]">
            {remaining === 0 ? 'Semua bagian sudah terisi' : `${remaining} bagian perlu kamu isi`}
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--muted)]">
            {needsIdentity
              ? 'Komdigi dan kepolisian mewajibkan identitas pelapor — laporan tanpa itu tidak bisa diproses. '
              : ''}
            Yang kamu ketik di sini masuk ke salinan suratmu saja: tidak dikirim ke server Perisai,
            tidak disimpan, dan hilang begitu kamu berpindah halaman.
          </p>

          <div className="mt-4 space-y-3">
            {placeholders.map((p) => {
              const label = p.slice(1, -1);
              const hint = hintFor(p);
              return (
                <div key={p}>
                  <label className="block text-[12px] text-[color:var(--muted)]">{label}</label>
                  {isLongField(p) ? (
                    <textarea
                      rows={2}
                      value={values[p] ?? ''}
                      onChange={(e) => onChange(p, e.target.value)}
                      className="mt-1.5 w-full resize-y rounded-lg border border-[color:var(--line)] bg-[color:var(--night)] px-3 py-2.5 text-[13px] leading-relaxed text-[color:var(--warm)] focus:border-[color:var(--mist)] focus:outline-none"
                    />
                  ) : (
                    <input
                      value={values[p] ?? ''}
                      onChange={(e) => onChange(p, e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-[color:var(--line)] bg-[color:var(--night)] px-3 py-2.5 text-[13px] text-[color:var(--warm)] focus:border-[color:var(--mist)] focus:outline-none"
                    />
                  )}
                  {hint && <p className="mt-1 text-[11px] text-[color:var(--muted)]">{hint}</p>}
                </div>
              );
            })}
          </div>

          {hasNik && (
            <p className="mt-4 border-t border-[rgba(196,132,106,0.25)] pt-3 text-[12px] leading-relaxed text-[color:var(--muted)]">
              Kamu yang memutuskan kapan dan kepada siapa nama kamu diberikan. Perisai tidak pernah
              tahu — dan tidak bisa memberitahukannya ke siapa pun, karena memang tidak
              menyimpannya.
            </p>
          )}
        </div>
      )}

      <div className="max-h-[380px] overflow-y-auto rounded-xl border border-[color:var(--line)] bg-[color:var(--night)] p-4">
        <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-[1.75] text-[color:var(--warm)]">
          {parts.map((part, i) =>
            /^\[[^\]\n]+\]$/.test(part) ? (
              <mark
                key={i}
                className="rounded bg-[rgba(196,132,106,0.22)] px-1 py-0.5 text-[color:var(--fill)] outline outline-1 outline-[rgba(196,132,106,0.45)]"
              >
                {part}
              </mark>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </pre>
      </div>

      <div className="space-y-2.5">
        <button
          onClick={copy}
          className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-2)] px-4 py-3.5 text-[14px] text-[color:var(--warm)] transition-colors hover:border-[color:var(--mist)]"
        >
          {copied
            ? 'Tersalin'
            : remaining > 0
              ? `Salin surat (${remaining} bagian masih kosong)`
              : 'Salin surat'}
        </button>

        {mailto && (
          <>
            <a
              href={`mailto:${mailto}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(bodyText)}`}
              className="flex w-full items-center justify-center rounded-xl border border-[color:var(--line)] px-4 py-3.5 text-[14px] text-[color:var(--warm)] transition-colors hover:border-[color:var(--mist)]"
            >
              Buka aplikasi email
            </a>
            <p className="text-[11px] leading-relaxed text-[color:var(--muted)]">
              Ini membuka aplikasi email di device kamu dengan surat sudah terisi. Kamu yang menekan
              kirim — periksa dulu isinya.
            </p>
          </>
        )}

        {formUrl && (
          <>
            <button
              onClick={copyThenOpen}
              className="flex w-full items-center justify-center rounded-xl border border-[color:var(--line)] px-4 py-3.5 text-[14px] text-[color:var(--warm)] transition-colors hover:border-[color:var(--mist)]"
            >
              Salin surat, lalu buka {formLabel ?? 'formulir'}
            </button>
            <p className="text-[11px] leading-relaxed text-[color:var(--muted)]">
              Suratnya tersalin dan formulirnya terbuka di tab baru. Tempel ke kolom uraian aduan,
              lalu kamu yang mengirim. Siapkan juga KTP kalau formulirnya memintanya.
            </p>
          </>
        )}
      </div>
    </div>
  );
}