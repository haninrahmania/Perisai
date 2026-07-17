'use client';

import { useEffect, useState } from 'react';
import { caseStore, type EvidenceRecord } from '@/lib/case-store';
import { generateCertificate } from '@/lib/certificate';
import { useActiveCase } from '@/components/useActiveCase';
import { Shell, Title, Lede, Button, Notice, PageSkeleton } from '@/components/ui';

export default function CertificateScreen() {
  const { activeCase, loading: caseLoading, error: caseError } = useActiveCase();
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!activeCase) return;
    void caseStore.listEvidence(activeCase.id)
      .then(setEvidence)
      .catch(() => setError('Bukti kasus belum bisa dibaca.'))
      .finally(() => setLoading(false));
  }, [activeCase]);

  function toggle(id: string) {
    setDone(false);
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function download() {
    if (!activeCase) return;
    try {
      generateCertificate(activeCase, evidence.filter((record) => selectedIds.includes(record.id)));
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ringkasan bukti belum bisa dibuat. Coba lagi.');
    }
  }

  if (caseLoading) return <PageSkeleton cards={3} />;
  if (caseError) return <Shell><Notice>{caseError}</Notice></Shell>;
  if (!activeCase) return <Shell><Button href="/">Pilih atau buat kasus</Button></Shell>;
  if (loading) return <PageSkeleton cards={3} />;

  return (
    <Shell back={{ href: '/dashboard/', label: 'Kasus' }} step="Ringkasan bukti">
      <Title>Buat ringkasan bukti</Title>
      <Lede>Pilih bukti dari kasus {activeCase.reference}. Perisai akan membuat PDF di perangkat ini.</Lede>

      <section className="mt-8 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
        <p className="font-mono text-[11px] text-[color:var(--muted)]">REFERENSI {activeCase.reference}</p>
        <div className="mt-4 space-y-2">
          {evidence.map((record) => (
            <label key={record.id} className="flex gap-3 rounded-xl border border-[color:var(--line)] p-3 text-[12px] text-[color:var(--warm)]">
              <input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => toggle(record.id)} />
              <span><span className="block">{record.kind === 'url' ? record.sourceUrl : record.fileName}</span><span className="mt-1 block font-mono text-[10px] text-[color:var(--muted)]">{record.sha256.slice(0, 20)}…</span></span>
            </label>
          ))}
          {evidence.length === 0 && <p className="text-[13px] text-[color:var(--muted)]">Kasus ini belum memiliki bukti.</p>}
        </div>
      </section>

      <div className="mt-6"><Notice>PDF mencantumkan sidik digital SHA-256 dari bukti yang dipilih. Dokumen ini membantu merangkum bukti, tetapi bukan hasil pemeriksaan forensik, tanda tangan digital, atau nasihat hukum.</Notice></div>
      <div className="mt-8 space-y-3">
        <Button onClick={download} disabled={selectedIds.length === 0}>Unduh ringkasan PDF</Button>
        {evidence.length === 0 && <Button href="/vault/" variant="quiet">Tambah bukti</Button>}
        {done && <p className="text-center text-[12px] text-[color:var(--mist)]">PDF siap. Periksa folder Unduhan untuk memastikan file tersimpan.</p>}
        {error && <p className="text-[12px] text-[color:var(--fill)]">{error}</p>}
      </div>
    </Shell>
  );
}
