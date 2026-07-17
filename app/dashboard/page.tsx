'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ensureSession } from '@/lib/supabase';
import { listEvidence } from '@/lib/evidence';
import { listReports } from '@/lib/reports';
import { Shell, Title, Lede } from '@/components/ui';

export default function DashboardPage() {
  const [stats, setStats] = useState<{ bukti: number; laporan: number; terkirim: number } | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      try {
        await ensureSession();
        const [evidence, reports] = await Promise.all([listEvidence(), listReports()]);
        setStats({
          bukti: evidence.length,
          laporan: reports.length,
          terkirim: reports.filter((r) => r.status !== 'draft').length,
        });
      } catch {
        setStats({ bukti: 0, laporan: 0, terkirim: 0 });
      }
    })();
  }, []);

  return (
    <Shell back={{ href: '/', label: 'Awal' }}>
      <Title>Kamu sudah melangkah.</Title>
      <Lede>
        Tidak ada target, tidak ada tenggat. Ini cuma catatan tentang apa yang sudah kamu amankan.
      </Lede>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat value={stats?.bukti ?? '—'} label="bukti aman" />
        <Stat value={stats?.laporan ?? '—'} label="naskah siap" />
        <Stat value={stats?.terkirim ?? '—'} label="sudah kamu kirim" />
      </div>

      <nav className="mt-6 space-y-3">
        <Row href="/vault" title="Brankas bukti" note="Tambah tautan atau tangkapan layar" />
        <Row
          href="/takedown"
          title="Susun laporan"
          note="Naskah untuk platform, Komdigi, dan polisi"
        />
        <Row
          href="/pendamping"
          title="Tanya Pendamping Perisai"
          note="Chat soal laporan, bukti, atau langkah berikutnya"
        />
        <Row
          href="/sertifikat"
          title="Sertifikat bukti"
          note="PDF berisi daftar bukti dan sidik digitalnya"
        />
        <Row href="/pengaturan" title="Data kamu" note="Hapus bukti atau seluruh data" />
      </nav>

      <div className="mt-10 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
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

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
      <p className="font-display text-[28px] font-semibold leading-none text-[color:var(--heading)]">
        {value}
      </p>
      <p className="mt-2 text-[12px] leading-snug text-[color:var(--muted)]">{label}</p>
    </div>
  );
}

function Row({ href, title, note }: { href: string; title: string; note: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-5 transition-colors hover:bg-[color:var(--surface-2)]"
    >
      <span>
        <span className="block text-[15px] text-[color:var(--warm)]">{title}</span>
        <span className="mt-1 block text-[13px] text-[color:var(--muted)]">{note}</span>
      </span>
      <span className="text-[color:var(--muted)]">→</span>
    </Link>
  );
}