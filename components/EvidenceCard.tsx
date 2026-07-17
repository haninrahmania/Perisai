'use client';

import { useEffect, useState } from 'react';
import type { EvidenceRecord } from '@/lib/case-store';

const PLATFORM_LABEL: Record<string, string> = {
  telegram: 'Telegram',
  instagram: 'Instagram',
  x: 'X',
  tiktok: 'TikTok',
  other: 'Platform lain',
};

export default function EvidenceCard({
  evidence,
  onDelete,
}: {
  evidence: EvidenceRecord;
  onDelete: (id: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [fullHash, setFullHash] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  function toggleReveal() {
    if (revealed) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
      setRevealed(false);
      return;
    }
    setObjectUrl(evidence.blob ? URL.createObjectURL(evidence.blob) : null);
    setRevealed(true);
  }

  async function copyHash() {
    await navigator.clipboard.writeText(evidence.sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const canPreviewImage = evidence.kind === 'file' && evidence.mediaType?.startsWith('image/');

  return (
    <article className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]">
      {evidence.kind === 'file' ? (
        <div className="relative min-h-[180px] bg-[color:var(--night)]">
          {revealed && canPreviewImage && objectUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={objectUrl} alt="Pratinjau bukti" className="h-full max-h-[360px] w-full object-contain" />
          ) : (
            <div className="flex min-h-[180px] flex-col items-center justify-center px-6 text-center">
              <ShieldIcon />
              <p className="mt-3 text-[13px] text-[color:var(--warm)]">
                {revealed ? evidence.fileName : 'File tersimpan di perangkat ini dan masih disembunyikan.'}
              </p>
            </div>
          )}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button type="button" onClick={toggleReveal} className="rounded-full border border-[color:var(--line)] bg-[rgba(245,243,255,0.94)] px-3 py-2 text-[12px] text-[color:var(--warm)]">
              {revealed ? 'Tutup lagi' : 'Lihat kalau siap'}
            </button>
            {revealed && objectUrl && (
              <a href={objectUrl} download={evidence.fileName ?? 'bukti'} className="rounded-full border border-[color:var(--line)] bg-[rgba(245,243,255,0.94)] px-3 py-2 text-[12px] text-[color:var(--warm)]">
                Simpan salinan
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="border-b border-[color:var(--line)] px-5 py-5">
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)]">Tautan tersimpan</p>
          <p className="mt-2 break-all font-mono text-[13px] text-[color:var(--warm)]">{evidence.sourceUrl}</p>
          <p className="mt-2 text-[12px] text-[color:var(--muted)]">Perisai menyimpan alamatnya tanpa membuka atau mengunduh isi tautan.</p>
        </div>
      )}

      <div className="space-y-3 px-5 py-5">
        {evidence.platform && <p className="text-[15px] text-[color:var(--warm)]">{PLATFORM_LABEL[evidence.platform]}</p>}
        {evidence.description && <p className="text-[14px] text-[color:var(--muted)]">{evidence.description}</p>}
        <dl className="space-y-2 border-t border-[color:var(--line)] pt-3 text-[12px]">
          <div><dt className="text-[color:var(--muted)]">Sidik digital dibuat</dt><dd className="mt-0.5 text-[color:var(--warm)]">{new Date(evidence.hashedAt).toLocaleString('id-ID')}</dd></div>
          <div>
            <dt className="text-[color:var(--muted)]">SHA-256</dt>
            <dd className="mt-1 break-all font-mono text-[11px] text-[color:var(--mist)]">{fullHash ? evidence.sha256 : `${evidence.sha256.slice(0, 16)}…`}</dd>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setFullHash((value) => !value)} className="rounded-md border border-[color:var(--line)] px-2.5 py-1.5 text-[11px] text-[color:var(--muted)]">{fullHash ? 'Sembunyikan sebagian' : 'Lihat SHA-256 lengkap'}</button>
              <button type="button" onClick={copyHash} className="rounded-md border border-[color:var(--line)] px-2.5 py-1.5 text-[11px] text-[color:var(--muted)]">{copied ? 'SHA-256 tersalin' : 'Salin SHA-256'}</button>
            </div>
          </div>
        </dl>
        <div className="border-t border-[color:var(--line)] pt-3">
          <button type="button" onClick={() => onDelete(evidence.id)} className="px-2.5 py-2 text-[12px] text-[color:var(--muted)] hover:text-[color:var(--fill)]">Hapus bukti ini</button>
        </div>
      </div>
    </article>
  );
}

function ShieldIcon() {
  return (
    <svg width="26" height="30" viewBox="0 0 26 30" fill="none" aria-hidden="true">
      <path d="M13 1.5 24 5.2v9.1c0 6.6-4.5 12.4-11 14.2C6.5 26.7 2 20.9 2 14.3V5.2L13 1.5Z" stroke="var(--mist)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9.5 14.5h7v5.5h-7z" stroke="var(--mist)" strokeWidth="1.4" />
    </svg>
  );
}
