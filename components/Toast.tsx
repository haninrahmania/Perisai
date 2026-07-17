'use client';

import { useEffect } from 'react';

export function Toast({
  message,
  onDone,
}: {
  message: string | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-5"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-2)] px-5 py-4 shadow-lg">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M4 10.5l4 4 8-9"
            stroke="var(--mist)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-[14px] leading-snug text-[color:var(--warm)]">{message}</p>
      </div>
    </div>
  );
}