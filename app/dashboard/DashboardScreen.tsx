'use client';

import { useEffect, useState } from 'react';
import { caseStore } from '@/lib/case-store';
import { useActiveCase } from '@/components/useActiveCase';
import { Shell, Title, Lede, Button, Notice, PageSkeleton } from '@/components/ui';

export default function DashboardScreen() {
  const { activeCase, loading, error } = useActiveCase();
  const [stats, setStats] = useState<{ evidence: number; reports: number; submitted: number } | null>(null);

  useEffect(() => {
    if (!activeCase) return;
    void caseStore.getCaseStats(activeCase.id).then(setStats);
  }, [activeCase]);

  if (loading) return <PageSkeleton cards={5} />;
  if (error) return <Shell><Notice>{error}</Notice></Shell>;
  if (!activeCase) return <Shell><Button href="/">Pilih atau buat kasus</Button></Shell>;

  return (
    <Shell back={{ href: '/', label: 'Ganti kasus' }}>
      <p className="font-mono text-[11px] text-[color:var(--muted)]">{activeCase.reference}</p>
      <Title>{activeCase.title}</Title>
      <Lede>Semua yang terlihat di sini hanya berasal dari kasus yang sedang kamu buka.</Lede>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat value={stats?.evidence ?? '—'} label="bukti" />
        <Stat value={stats?.reports ?? '—'} label="laporan" />
        <Stat value={stats?.submitted ?? '—'} label="ditandai terkirim" />
      </div>

      <nav className="mt-6 space-y-3">
        <Row href="/vault/" title="Brankas bukti" note="Tambah tautan, screenshot, atau file" />
        <Row href="/takedown/" title="Susun laporan" note="Pilih satu target dan bukti yang sesuai" />
        {(stats?.submitted ?? 0) > 0 && (
          <Row href="/pendamping/" title="Tanya Pendamping Perisai" note="Minta panduan setelah laporan dikirim" />
        )}
        <Row href="/sertifikat/" title="Ringkasan bukti" note="Buat PDF dari bukti yang kamu pilih" />
        <Row href="/pengaturan/" title="Cadangan dan data" note="Ekspor, impor, hapus kasus, atau bersihkan semua" />
      </nav>

      <div className="mt-8">
        <Notice>Data kasus tetap di perangkat ini. Perisai hanya membuka situs resmi setelah kamu memilihnya.</Notice>
      </div>
    </Shell>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
      <p className="font-display text-[28px] font-semibold leading-none text-[color:var(--heading)]">{value}</p>
      <p className="mt-2 text-[12px] leading-snug text-[color:var(--muted)]">{label}</p>
    </div>
  );
}

function Row({ href, title, note }: { href: string; title: string; note: string }) {
  return (
    <a href={href} className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-5 hover:bg-[color:var(--surface-2)]">
      <span><span className="block text-[15px] text-[color:var(--warm)]">{title}</span><span className="mt-1 block text-[13px] text-[color:var(--muted)]">{note}</span></span>
      <span aria-hidden="true" className="text-[color:var(--muted)]">→</span>
    </a>
  );
}
