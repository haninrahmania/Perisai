'use client';

import { useEffect, useState } from 'react';
import { caseStore, type EvidenceRecord, type Platform } from '@/lib/case-store';
import { useActiveCase } from '@/components/useActiveCase';
import EvidenceCard from '@/components/EvidenceCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Toast } from '@/components/Toast';
import { Shell, Title, Lede, Button, Notice, PageSkeleton } from '@/components/ui';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'telegram', label: 'Telegram' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'other', label: 'Lainnya' },
];

export default function VaultScreen() {
  const { activeCase, loading: caseLoading, error: caseError } = useActiveCase();
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mode, setMode] = useState<'url' | 'file'>('url');
  const [sourceUrl, setSourceUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState<Platform | ''>('');
  const [description, setDescription] = useState('');
  const [foundAt, setFoundAt] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!activeCase) return;
    void caseStore.listEvidence(activeCase.id)
      .then((records) => {
        setEvidence(records);
        setPlatform(activeCase.platform ?? '');
      })
      .catch(() => setError('Bukti tersimpan belum bisa dibuka. Muat ulang halaman untuk mencoba lagi.'))
      .finally(() => setLoading(false));
  }, [activeCase]);

  async function refresh() {
    if (activeCase) setEvidence(await caseStore.listEvidence(activeCase.id));
  }

  async function addEvidence() {
    if (!activeCase) return;
    setSaving(true);
    setError(null);
    try {
      if (mode === 'url') {
        await caseStore.addUrlEvidence({
          caseId: activeCase.id,
          sourceUrl,
          platform: platform || undefined,
          description,
          foundAt: foundAt || undefined,
        });
      } else if (file) {
        await caseStore.addFileEvidence({
          caseId: activeCase.id,
          file,
          platform: platform || undefined,
          description,
          foundAt: foundAt || undefined,
        });
      }
      await refresh();
      setSourceUrl('');
      setFile(null);
      setDescription('');
      setFoundAt('');
      setToast('Bukti tersimpan di perangkat ini');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Bukti belum bisa disimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!activeCase || !pendingDelete) return;
    setDeleting(true);
    try {
      const result = await caseStore.deleteEvidence(activeCase.id, pendingDelete);
      await refresh();
      setToast(result.deletedReports > 0 ? `Bukti dan ${result.deletedReports} laporan yang memakainya dihapus` : 'Bukti dihapus');
      setPendingDelete(null);
    } catch {
      setError('Bukti belum bisa dihapus.');
    } finally {
      setDeleting(false);
    }
  }

  if (caseLoading) return <PageSkeleton cards={3} />;
  if (caseError) return <Shell><Notice>{caseError}</Notice></Shell>;
  if (!activeCase) return <Shell><Button href="/">Pilih atau buat kasus</Button></Shell>;
  if (loading) return <PageSkeleton cards={3} />;

  const canSave = mode === 'url' ? sourceUrl.trim().length > 0 : file !== null;

  return (
    <Shell back={{ href: '/dashboard/', label: 'Kasus' }} step="Brankas bukti">
      <Title>Brankas bukti</Title>
      <Lede>Setiap bukti di halaman ini memiliki caseId kasus aktif {activeCase.reference}.</Lede>

      <section className="mt-8 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-[color:var(--night)] p-1">
          {(['url', 'file'] as const).map((value) => (
            <button key={value} type="button" onClick={() => setMode(value)} className={`rounded-lg px-3 py-3 text-[14px] ${mode === value ? 'bg-[color:var(--surface-2)] text-[color:var(--warm)]' : 'text-[color:var(--muted)]'}`}>
              {value === 'url' ? 'Simpan URL' : 'Simpan screenshot/file'}
            </button>
          ))}
        </div>

        {mode === 'url' ? (
          <div>
            <label htmlFor="url" className="text-[13px] text-[color:var(--muted)]">URL sumber</label>
            <input id="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} inputMode="url" placeholder="https://…" className="mt-2 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--night)] px-4 py-4 font-mono text-[13px] text-[color:var(--warm)]" />
            <p className="mt-2 text-[12px] text-[color:var(--muted)]">Perisai menyimpan alamat ini dan membuat sidik digital tanpa membuka tautannya.</p>
          </div>
        ) : (
          <div>
            <label htmlFor="file" className="flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--line)] bg-[color:var(--night)] px-4 py-6 text-center">
              <span className="text-[14px] text-[color:var(--warm)]">{file?.name ?? 'Pilih screenshot atau file bukti'}</span>
              <span className="mt-1 text-[12px] text-[color:var(--muted)]">File tetap di browser ini. Perisai juga membuat sidik digital untuk membantu memeriksa keutuhannya.</span>
            </label>
            <input id="file" type="file" accept="image/*,application/pdf,text/plain" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </div>
        )}

        <div className="mt-5">
          <label className="text-[13px] text-[color:var(--muted)]">Platform</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {PLATFORMS.map((item) => (
              <button key={item.value} type="button" onClick={() => setPlatform(platform === item.value ? '' : item.value)} className={`rounded-lg border px-3 py-2 text-[12px] ${platform === item.value ? 'border-[color:var(--mist)] text-[color:var(--warm)]' : 'border-[color:var(--line)] text-[color:var(--muted)]'}`}>{item.label}</button>
            ))}
          </div>
        </div>
        <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Catatan faktual (opsional)" className="mt-4 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--night)] px-4 py-3 text-[14px] text-[color:var(--warm)]" />
        <input type="date" value={foundAt} onChange={(event) => setFoundAt(event.target.value)} className="mt-3 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--night)] px-4 py-3 text-[14px] text-[color:var(--warm)]" />
        <div className="mt-5"><Button onClick={addEvidence} disabled={!canSave || saving}>{saving ? 'Menyimpan bukti…' : 'Simpan bukti'}</Button></div>
        {error && <p className="mt-4 text-[13px] text-[color:var(--fill)]">{error}</p>}
      </section>

      <div className="mt-6"><Notice>Bukti tersimpan di browser ini, bukan di akun online. Penyimpanan ini tidak dienkripsi secara otomatis dan dapat hilang jika data situs dihapus atau perangkat hilang. Buat cadangan jika perlu.</Notice></div>

      <section className="mt-12 border-t border-[color:var(--line)] pt-8">
        <h2 className="font-display text-[22px] text-[color:var(--warm)]">Bukti kasus ini</h2>
        {evidence.length === 0 ? <p className="mt-4 text-[14px] text-[color:var(--muted)]">Belum ada bukti.</p> : <div className="mt-5 space-y-4">{evidence.map((record) => <EvidenceCard key={record.id} evidence={record} onDelete={setPendingDelete} />)}</div>}
      </section>

      {evidence.length > 0 && <div className="mt-8 space-y-3"><Button href="/takedown/">Pilih bukti untuk laporan</Button><Button href="/sertifikat/" variant="quiet">Buat ringkasan bukti</Button></div>}

      <ConfirmDialog open={pendingDelete !== null} title="Hapus bukti ini?" confirmLabel="Hapus bukti" busyLabel="Menghapus bukti…" busy={deleting} destructive onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)}>
        <p>File, catatan bukti, dan laporan yang memakai bukti ini akan dihapus dari kasus ini. Tindakan ini tidak dapat dibatalkan.</p>
      </ConfirmDialog>
      <Toast message={toast} onDone={() => setToast(null)} />
    </Shell>
  );
}
