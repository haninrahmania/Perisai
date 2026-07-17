'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

export function Shell({
  children,
  back,
  step,
}: {
  children: ReactNode;
  back?: { href: string; label: string } | 'auto';
  step?: string;
}) {
  const router = useRouter();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[540px] flex-col px-5 pb-16 pt-6">
      {(back || step) && (
        <div className="mb-8 flex items-center justify-between text-sm">
          {back === 'auto' ? (
            <button
              onClick={() => router.back()}
              className="-ml-2 rounded px-2 py-2 text-[color:var(--muted)] transition-colors hover:text-[color:var(--warm)]"
            >
              ← Kembali
            </button>
          ) : back ? (
            <Link
              href={back.href}
              className="-ml-2 rounded px-2 py-2 text-[color:var(--muted)] transition-colors hover:text-[color:var(--warm)]"
            >
              ← {back.label}
            </Link>
          ) : (
            <span />
          )}
          {step && (
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)]">
              {step}
            </span>
          )}
        </div>
      )}
      {children}
    </main>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-[color:var(--warm)]">
      {children}
    </h1>
  );
}

export function Lede({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--muted)]">{children}</p>;
}

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  variant?: 'primary' | 'quiet';
  type?: 'button' | 'submit';
};

export function Button({
  children,
  onClick,
  href,
  disabled,
  variant = 'primary',
  type = 'button',
}: BtnProps) {
  const base =
    'flex w-full items-center justify-center rounded-2xl px-5 py-4 text-[15px] font-medium transition-colors min-h-[56px] text-center';
  const styles =
    variant === 'primary'
      ? 'bg-[color:var(--mist)] text-[#0F1D2B] hover:bg-[#96bccb] disabled:bg-[#2a4a60] disabled:text-[color:var(--muted)]'
      : 'border border-[color:var(--line)] bg-transparent text-[color:var(--warm)] hover:bg-[color:var(--surface)]';

  if (href && !disabled) {
    return (
      <Link href={href} className={`${base} ${styles}`}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export function Choice({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-5 text-left text-[16px] leading-snug text-[color:var(--warm)] transition-colors hover:border-[color:var(--mist)] hover:bg-[color:var(--surface-2)] min-h-[64px]"
    >
      {children}
    </button>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-[13px] leading-relaxed text-[color:var(--muted)]">
      {children}
    </p>
  );
}