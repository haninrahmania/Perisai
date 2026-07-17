'use client';

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
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[540px] flex-col px-5 pb-16 pt-6">
      {(back || step) && (
        <div className="mb-8 flex items-center justify-between text-sm">
          {back === 'auto' ? (
            <button
              onClick={() => window.history.back()}
              className="-ml-2 rounded px-2 py-2 text-[color:var(--muted)] transition-colors hover:text-[color:var(--warm)]"
            >
              ← Kembali
            </button>
          ) : back ? (
            <a
              href={back.href}
              className="-ml-2 rounded px-2 py-2 text-[color:var(--muted)] transition-colors hover:text-[color:var(--warm)]"
            >
              ← {back.label}
            </a>
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

export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <Shell>
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Menyiapkan halaman</span>
        <div aria-hidden="true">
          <div className="skeleton-block h-3 w-24 rounded-full" />
          <div className="skeleton-block mt-4 h-9 w-3/4 rounded-xl" />
          <div className="skeleton-block mt-3 h-4 w-full rounded-full" />
          <div className="skeleton-block mt-2 h-4 w-4/5 rounded-full" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: cards }, (_, index) => (
              <div
                key={index}
                className="skeleton-block h-[76px] rounded-2xl border border-[color:var(--line)]"
              />
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-[color:var(--heading)]">
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
    'flex min-h-[56px] w-full items-center justify-center rounded-2xl px-5 py-4 text-center text-[15px] font-medium transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.98]';
  const styles =
    variant === 'primary'
      ? 'bg-[color:var(--mist)] text-white hover:bg-[#8f6cd9] disabled:bg-[#adb5e5] disabled:text-[color:var(--muted)]'
      : 'border border-[color:var(--line)] bg-transparent text-[color:var(--warm)] hover:bg-[color:var(--surface)]';

  if (href && !disabled) {
    return (
      <a href={href} className={`${base} ${styles}`}>
        {children}
      </a>
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
      className="min-h-[64px] w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-5 text-left text-[16px] leading-snug text-[color:var(--warm)] transition-[background-color,border-color,transform] duration-150 hover:border-[color:var(--mist)] hover:bg-[color:var(--surface-2)] active:scale-[0.99]"
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
