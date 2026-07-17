'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Batal',
  busyLabel = 'Memproses…',
  busy = false,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(30,15,50,0.55)] px-4 pb-4 pt-16 sm:items-center sm:pb-16"
      onClick={() => !busy && onCancel()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-6"
      >
        <h2 id={titleId} className="font-display text-[20px] leading-snug text-[color:var(--heading)]">{title}</h2>
        <div id={descriptionId} className="mt-3 space-y-2.5 text-[14px] leading-relaxed text-[color:var(--muted)]">
          {children}
        </div>
        <div className="mt-7 space-y-2.5">
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`w-full rounded-xl px-5 py-4 text-[15px] font-medium text-white transition-[background-color,transform] duration-150 active:scale-[0.98] disabled:opacity-60 ${destructive ? 'bg-[color:var(--fill)] hover:bg-[#e97849]' : 'bg-[color:var(--mist)] hover:bg-[#8f6cd9]'}`}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={busy}
            className="w-full rounded-xl border border-[color:var(--line)] px-5 py-4 text-[15px] text-[color:var(--warm)] transition-[background-color,transform] duration-150 hover:bg-[color:var(--surface-2)] active:scale-[0.98] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
