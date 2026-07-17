'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ensureSession } from '@/lib/supabase';
import { listEvidence } from '@/lib/evidence';
import { Shell, Title, Lede } from '@/components/ui';

export default function DashboardPage() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await ensureSession();
        setCount((await listEvidence()).length);
      } catch {
        setCount(0);
      }
    })();
  }, []);

  return (
    <Shell back={{ href: '/', label: 'Awal' }}>
      <Title>Kamu sudah melangkah.</Title>
      <Lede>
        Tidak ada target, tidak ada tenggat. Ini cuma catatan tentang apa yang sudah kamu amankan.
      </Lede>

      <div className="mt-8 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-6">
        <p className="font-display text-[40px] font-semibold leading-none text-[color:var(--warm)]">
          {count ?? '—'}
        </p>
        <p className="mt-2 text-[14px] text-[color:var(--muted)]">
          bukti tersimpan di brankas kamu
        </p>
      </div>

      <nav className="mt-6 space-y-3">
        <Row href="/vault" title="Brankas bukti" note="Tambah tautan atau tangkapan layar" />
        <Row
          href="/takedown"
          title="Susun laporan"
          note="Naskah untuk platform, Komdigi, dan polisi"
        />
        <Row
          href="/sertifikat"
          title="Sertifikat bukti"
          note="PDF berisi daftar bukti dan sidik digitalnya"
        />
      </nav>

      <div className="mt-10 rounded-2xl border border-[color:var(--line)] p-5">
        <p className="text-[14px] font-medium text-[color:var(--warm)]">Kamu tidak harus sendiri</p>
        <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted)]">
          LBH APIK, Komnas Perempuan, dan SAFEnet mendampingi kasus seperti ini tanpa biaya. Mereka
          sudah terbiasa — kamu tidak perlu menjelaskan dari nol.
        </p>
        <a
          href="https://lbhapik.or.id"
          className="mt-3 inline-block text-[13px] text-[color:var(--mist)]"
        >
          Lihat kontak pendamping →
        </a>
      </div>
    </Shell>
  );
}

function Row({ href, title, note }: { href: string; title: string; note: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--line)] px-5 py-5 transition-colors hover:bg-[color:var(--surface)]"
    >
      <span>
        <span className="block text-[15px] text-[color:var(--warm)]">{title}</span>
        <span className="mt-1 block text-[13px] text-[color:var(--muted)]">{note}</span>
      </span>
      <span className="text-[color:var(--muted)]">→</span>
    </Link>
  );
}