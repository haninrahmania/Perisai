'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { caseStore, type CaseRecord } from '@/lib/case-store';
import { Button, Notice, PageSkeleton } from '@/components/ui';

export default function HomeScreen() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([caseStore.listCases(), caseStore.getActiveCase()])
      .then(([records, active]) => {
        setCases(records);
        setActiveId(active?.id ?? null);
      })
      .catch(() => setError('Kasus tersimpan belum bisa dibuka. Muat ulang halaman untuk mencoba lagi.'))
      .finally(() => setLoading(false));
  }, []);

  async function createCase() {
    setBusy(true);
    setError(null);
    try {
      await caseStore.createCase({ title: `Kasus ${cases.length + 1}` });
      window.location.assign('/triage/');
    } catch {
      setError('Kasus baru belum bisa dibuat di perangkat ini.');
      setBusy(false);
    }
  }

  async function openCase(record: CaseRecord) {
    setBusy(true);
    try {
      await caseStore.activateCase(record.id);
      window.location.assign(record.incident && record.platform ? '/dashboard/' : '/triage/');
    } catch {
      setError('Kasus itu belum bisa dibuka.');
      setBusy(false);
    }
  }

  if (loading) return <PageSkeleton cards={2} />;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[540px] flex-col px-5 py-10">
      <div className="flex flex-1 flex-col justify-center py-14">
        <div className="mb-8 flex items-center gap-4">
          <Image src="/perisai_final.png" alt="" width={140} height={147} priority />
          <span className="font-display text-[44px] font-semibold leading-none tracking-tight text-[#1a2140]">perisai</span>
        </div>
        <h1 className="font-display text-[32px] font-semibold leading-[1.15] tracking-tight text-[#1a2140]">
          Apa pun yang terjadi,
          <br />
          kamu tidak salah.
        </h1>
        <p className="mt-4 max-w-[390px] text-[15px] leading-relaxed text-[#3d4570]">
          Kasus, bukti, dan laporan tetap di browser pada perangkat ini. Perisai tidak
          mengirimnya ke internet.
        </p>

        <div className="mt-10">
          <Button onClick={createCase} disabled={busy}>
            {busy ? 'Menyiapkan…' : 'Mulai kasus baru'}
          </Button>
        </div>

        {cases.length > 0 && (
          <section className="mt-10 border-t border-[color:var(--line)] pt-8">
            <h2 className="text-[15px] font-medium text-[color:var(--warm)]">Buka kasus tersimpan</h2>
            <div className="mt-3 space-y-3">
              {cases.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  disabled={busy}
                  onClick={() => openCase(record)}
                  className="flex w-full items-center justify-between rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-4 text-left disabled:opacity-50"
                >
                  <span>
                    <span className="block text-[14px] text-[color:var(--warm)]">{record.title}</span>
                    <span className="mt-1 block font-mono text-[11px] text-[color:var(--muted)]">
                      {record.reference}{record.id === activeId ? ' · aktif' : ''}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-[color:var(--muted)]">→</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {error && <p className="mt-5 text-[13px] text-[color:var(--fill)]">{error}</p>}
      </div>

      <Notice>
        Data tersimpan di browser ini dan tidak dienkripsi secara otomatis. Jika data situs
        dihapus atau perangkat hilang, Perisai hanya dapat memulihkannya dari cadangan yang sudah
        kamu unduh.
      </Notice>
    </main>
  );
}
