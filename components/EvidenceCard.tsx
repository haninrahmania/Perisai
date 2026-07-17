'use client';

import { useCallback, useEffect, useState } from 'react';
import { previewUrl } from '@/lib/evidence';

export type EvidenceCardProps = {
  evidence: {
    id: string;
    kind: 'url' | 'screenshot';
    source_url: string | null;
    storage_path: string | null;
    sha256: string;
    platform: string | null;
    description: string | null;
    found_at: string | null;
    hashed_at: string;
    created_at: string;
  };
  onDelete?: (id: string) => void;
};

const PLATFORM_LABEL: Record<string, string> = {
  telegram: 'Telegram',
  instagram: 'Instagram',
  x: 'X',
  tiktok: 'TikTok',
  other: 'Platform lain',
};

function formatMoment(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EvidenceCard({ evidence, onDelete }: EvidenceCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [fullHash, setFullHash] = useState(false);
  const [copied, setCopied] = useState(false);

  const isImage = evidence.kind === 'screenshot' && evidence.storage_path;

  const loadPreview = useCallback(async () => {
    if (!evidence.storage_path) return;
    try {
      setImgFailed(false);
      setSrc(await previewUrl(evidence.storage_path));
    } catch {
      setImgFailed(true);
    }
  }, [evidence.storage_path]);

  useEffect(() => {
    if (revealed && isImage) void loadPreview();
    if (!revealed) setSrc(null);
  }, [revealed, isImage, loadPreview]);

  async function copyHash() {
    await navigator.clipboard.writeText(evidence.sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]">
      {isImage ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color:var(--night)]">
          {src && !imgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              onError={() => setImgFailed(true)}
              data-revealed={revealed}
              className="shield-veil h-full w-full object-cover"
            />
          ) : (
            <div className="shield-grid h-full w-full opacity-40" />
          )}

          {!revealed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[rgba(15,29,43,0.55)] px-6 text-center backdrop-blur-[2px]">
              <ShieldIcon />
              <p className="text-[13px] leading-relaxed text-[color:var(--warm)]">
                Ini tersimpan aman. Kamu tidak perlu melihatnya.
              </p>
            </div>
          )}

          {imgFailed && revealed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[rgba(15,29,43,0.8)] px-6 text-center">
              <p className="text-[13px] text-[color:var(--muted)]">
                Tautan pratinjau sudah kedaluwarsa.
              </p>
              <button
                onClick={loadPreview}
                className="rounded-lg border border-[color:var(--line)] px-3 py-2 text-[13px] text-[color:var(--warm)]"
              >
                Muat ulang
              </button>
            </div>
          )}

          <button
            onClick={() => setRevealed((r) => !r)}
            className="absolute bottom-3 right-3 rounded-full border border-[color:var(--line)] bg-[rgba(15,29,43,0.85)] px-4 py-2.5 text-[13px] font-medium text-[color:var(--warm)] transition-colors hover:bg-[color:var(--surface-2)]"
          >
            {revealed ? 'Tutup lagi' : 'Lihat kalau kamu siap'}
          </button>
        </div>
      ) : (
        <div className="border-b border-[color:var(--line)] px-5 py-5">
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)]">
            Tautan tersimpan
          </p>
          <p className="mt-2 break-all font-mono text-[13px] leading-relaxed text-[color:var(--warm)]">
            {evidence.source_url}
          </p>
          <p className="mt-2 text-[12px] text-[color:var(--muted)]">
            Kami menyimpan alamatnya, bukan isinya. Tautan ini tidak terbuka dari sini.
          </p>
        </div>
      )}

      <div className="space-y-3 px-5 py-5">
        {evidence.platform && (
          <p className="text-[15px] text-[color:var(--warm)]">
            {PLATFORM_LABEL[evidence.platform] ?? evidence.platform}
          </p>
        )}
        {evidence.description && (
          <p className="text-[14px] leading-relaxed text-[color:var(--muted)]">
            {evidence.description}
          </p>
        )}

        <dl className="space-y-2 border-t border-[color:var(--line)] pt-3 text-[12px]">
          <div>
            <dt className="text-[color:var(--muted)]">Diamankan</dt>
            <dd className="mt-0.5 text-[color:var(--warm)]">{formatMoment(evidence.hashed_at)}</dd>
          </div>
          {evidence.found_at && (
            <div>
              <dt className="text-[color:var(--muted)]">Kamu menemukannya</dt>
              <dd className="mt-0.5 text-[color:var(--warm)]">
                {new Date(evidence.found_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-[color:var(--muted)]">Sidik digital (SHA-256)</dt>
            <dd className="mt-1">
              <button
                onClick={() => setFullHash((f) => !f)}
                className="block break-all text-left font-mono text-[11px] leading-relaxed text-[color:var(--mist)]"
              >
                {fullHash ? evidence.sha256 : `${evidence.sha256.slice(0, 16)}…`}
              </button>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setFullHash((f) => !f)}
                  className="rounded-md border border-[color:var(--line)] px-2.5 py-1.5 text-[11px] text-[color:var(--muted)]"
                >
                  {fullHash ? 'Ringkas' : 'Lihat lengkap'}
                </button>
                <button
                  onClick={copyHash}
                  className="rounded-md border border-[color:var(--line)] px-2.5 py-1.5 text-[11px] text-[color:var(--muted)]"
                >
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            </dd>
          </div>
        </dl>

        {onDelete && (
          <div className="border-t border-[color:var(--line)] pt-3">
            <button
              onClick={() => onDelete(evidence.id)}
              className="rounded-md px-2.5 py-2 text-[12px] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fill)]"
            >
              Hapus bukti ini
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function ShieldIcon() {
  return (
    <svg width="26" height="30" viewBox="0 0 26 30" fill="none" aria-hidden="true">
      <path
        d="M13 1.5 24 5.2v9.1c0 6.6-4.5 12.4-11 14.2C6.5 26.7 2 20.9 2 14.3V5.2L13 1.5Z"
        stroke="var(--mist)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M9.5 14.5h7v5.5h-7z" stroke="var(--mist)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M11 14.5v-2a2 2 0 0 1 4 0v2" stroke="var(--mist)" strokeWidth="1.4" />
    </svg>
  );
}