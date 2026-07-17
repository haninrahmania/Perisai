'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { ensureSession } from '@/lib/supabase';

export default function Home() {
  useEffect(() => {
    void ensureSession().catch(() => {});
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[540px] flex-col bg-[#adb5e5] px-5 py-10">
      <div className="flex flex-1 flex-col justify-center py-14">
        <div className="mb-8 flex items-center gap-4">
          <Image src="/perisai_final.png" alt="" width={140} height={147} priority />
          <span className="font-display text-[44px] font-semibold leading-none tracking-tight text-[#1a2140]">
            perisai
          </span>
        </div>

        <h1 className="font-display text-[32px] font-semibold leading-[1.15] tracking-tight text-[#1a2140]">
          Apa pun yang terjadi,
          <br />
          kamu tidak salah.
        </h1>
        <p className="mt-4 max-w-[360px] text-[15px] leading-relaxed text-[#3d4570]">
          Perisai menemani kamu mengamankan bukti, menyusun laporan, dan menemukan pendamping dalam
          satu langkah kecil setiap kali.
        </p>

        <div className="mt-12 space-y-3">
          <Link
            href="/triage"
            className="block rounded-2xl bg-[#2d3561] px-6 py-7 text-white transition-colors hover:bg-[#3d4570]"
          >
            <span className="block text-[18px] font-semibold leading-snug">
              Aku butuh bantuan sekarang
            </span>
            <span className="mt-1.5 block text-[13px] opacity-75">
              Sesuatu sudah tersebar, atau sedang diancamkan
            </span>
          </Link>

          <Link
            href="/pendamping"
            className="flex min-h-[56px] w-full items-center justify-center rounded-2xl border border-[#2d3561]/25 px-5 py-4 text-center text-[15px] font-medium text-[#1a2140] transition-colors hover:bg-white/25"
          >
            Tanya dulu, aku belum tahu harus mulai dari mana
          </Link>
        </div>
      </div>

      <p className="text-[12px] leading-relaxed text-[#3d4570]">
        Tanpa nama, tanpa email. Yang kamu simpan di sini milik kamu, dan bisa kamu hapus kapan pun.
      </p>
    </main>
  );
}