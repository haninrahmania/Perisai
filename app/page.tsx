'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ensureSession } from '@/lib/supabase';

export default function Home() {
  useEffect(() => {
    void ensureSession().catch(() => {});
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[540px] flex-col px-5 py-10">
      <div className="flex items-center gap-3">
        <svg width="20" height="23" viewBox="0 0 26 30" fill="none" aria-hidden="true">
          <path
            d="M13 1.5 24 5.2v9.1c0 6.6-4.5 12.4-11 14.2C6.5 26.7 2 20.9 2 14.3V5.2L13 1.5Z"
            stroke="var(--mist)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-display text-[17px] tracking-tight text-[color:var(--warm)]">
          Perisai
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center py-14">
        <h1 className="font-display text-[32px] font-semibold leading-[1.15] tracking-tight text-[color:var(--warm)]">
          Apa pun yang terjadi,
          <br />
          kamu tidak salah.
        </h1>
        <p className="mt-4 max-w-[360px] text-[15px] leading-relaxed text-[color:var(--muted)]">
          Perisai menemani kamu mengamankan bukti, menyusun laporan, dan menemukan pendamping —
          satu langkah kecil setiap kali.
        </p>

        <div className="mt-12 space-y-3">
          <Link
            href="/triage"
            className="block rounded-2xl bg-[color:var(--mist)] px-6 py-7 text-[#0F1D2B] transition-colors hover:bg-[#96bccb]"
          >
            <span className="block text-[18px] font-semibold leading-snug">
              Aku butuh bantuan sekarang
            </span>
            <span className="mt-1.5 block text-[13px] opacity-75">
              Sesuatu sudah tersebar, atau sedang diancamkan
            </span>
          </Link>

          <Link
            href="/lindungi"
            className="block rounded-2xl border border-[color:var(--line)] px-6 py-7 text-[color:var(--warm)] transition-colors hover:bg-[color:var(--surface)]"
          >
            <span className="block text-[18px] font-semibold leading-snug">
              Aku mau melindungi diri
            </span>
            <span className="mt-1.5 block text-[13px] text-[color:var(--muted)]">
              Belum terjadi apa-apa, tapi aku ingin siap
            </span>
          </Link>
        </div>
      </div>

      <p className="text-[12px] leading-relaxed text-[color:var(--muted)]">
        Tanpa nama, tanpa email. Yang kamu simpan di sini milik kamu, dan bisa kamu hapus kapan
        pun.
      </p>
    </main>
  );
}