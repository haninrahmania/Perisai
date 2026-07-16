'use client';
import { useEffect, useState } from 'react';
import { previewUrl } from '@/lib/evidence';

export function EvidenceCard({ item }: { item: any }) {
  const [url, setUrl] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (item.storage_path) previewUrl(item.storage_path).then(setUrl);
  }, [item.storage_path]);

  return (
    <div className="rounded-xl border p-4 space-y-3">
      {url && (
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={url}
            alt=""
            className={`w-full transition ${revealed ? '' : 'blur-2xl scale-105'}`}
          />
          {!revealed && (
            <button
              onClick={() => setRevealed(true)}
              className="absolute inset-0 grid place-items-center bg-black/30 text-sm text-white"
            >
              Tap to reveal — you don't have to
            </button>
          )}
        </div>
      )}
      <div className="space-y-1 text-sm">
        <p className="font-medium">{item.platform ?? 'Unknown platform'}</p>
        <p className="text-gray-500">{item.description}</p>
        <p className="font-mono text-[10px] break-all text-gray-400">
          SHA-256: {item.sha256}
        </p>
        <p className="text-xs text-gray-400">
          Secured {new Date(item.hashed_at).toLocaleString('id-ID')}
        </p>
      </div>
    </div>
  );
}