'use client';

import { useState } from 'react';
import { caseStore } from '@/lib/case-store';
import { useActiveCase } from '@/components/useActiveCase';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Shell, Title, Lede, Button, Notice, PageSkeleton } from '@/components/ui';

type PendingAction = 'delete-case' | 'purge' | 'import' | null;

export default function SettingsScreen() {
  const { activeCase, loading, error: caseError } = useActiveCase();
  const [pending, setPending] = useState<PendingAction>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exported, setExported] = useState(false);

  async function exportBackup() {
    setBusy(true);
    setError(null);
    try {
      const serialized = await caseStore.exportBackup();
      const url = URL.createObjectURL(new Blob([serialized], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `perisai-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setExported(true);
    } catch {
      setError('Cadangan belum bisa dibuat. Coba lagi tanpa menutup halaman ini.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmAction() {
    setBusy(true);
    setError(null);
    try {
      if (pending === 'delete-case' && activeCase) {
        await caseStore.deleteCase(activeCase.id);
      } else if (pending === 'purge') {
        await caseStore.purgeEverything();
      } else if (pending === 'import' && importFile) {
        await caseStore.importBackup(await importFile.text());
      }
      setPending(null);
      setImportFile(null);
      window.location.replace('/');
    } catch (cause) {
      setPending(null);
      setError(cause instanceof Error ? cause.message : 'Perubahan belum berhasil. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageSkeleton cards={4} />;
  if (caseError) return <Shell><Notice>{caseError}</Notice></Shell>;

  return (
    <Shell back={{ href: activeCase ? '/dashboard/' : '/', label: activeCase ? 'Kasus' : 'Awal' }} step="Data dan cadangan">
      <Title>Cadangan dan data</Title>
      <Lede>Perisai tidak menyimpan salinan online. Kamu memilih kapan membuat cadangan atau menghapus data.</Lede>

      <section className="mt-8 rounded-2xl border border-[color:var(--fill)] bg-[rgba(196,132,106,0.08)] p-5">
        <h2 className="text-[14px] font-medium text-[color:var(--warm)]">Cadangan dapat dibaca tanpa kata sandi</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted)]">File cadangan memuat seluruh kasus, laporan, tautan, dan bukti. Siapa pun yang memperoleh file dapat membacanya. Simpan hanya di tempat yang kamu percaya.</p>
        <div className="mt-4"><Button onClick={exportBackup} disabled={busy}>{busy ? 'Membuat cadangan…' : 'Unduh cadangan'}</Button></div>
        {exported && <p className="mt-3 text-[12px] text-[color:var(--mist)]">Cadangan siap diunduh. Periksa folder Unduhan, lalu pindahkan ke tempat yang aman.</p>}
      </section>

      <section className="mt-6 rounded-2xl border border-[color:var(--line)] p-5">
        <h2 className="text-[14px] font-medium text-[color:var(--warm)]">Impor cadangan</h2>
        <p className="mt-2 text-[13px] text-[color:var(--muted)]">Memulihkan cadangan akan mengganti semua data Perisai yang ada di browser ini. File diperiksa terlebih dahulu.</p>
        <label className="mt-4 block cursor-pointer rounded-xl border border-[color:var(--line)] px-4 py-3 text-center text-[13px] text-[color:var(--warm)]">
          Pilih file cadangan
          <input type="file" accept="application/json,.json" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; setImportFile(file); if (file) setPending('import'); }} />
        </label>
      </section>

      <div className="mt-6"><Notice>Data tersimpan di browser ini dan tidak dienkripsi secara otomatis. Jika data situs dihapus, browser direset, atau perangkat hilang, Perisai tidak dapat memulihkannya tanpa file cadangan.</Notice></div>

      {activeCase && (
        <section className="mt-6 rounded-2xl border border-[color:var(--line)] p-5">
          <h2 className="text-[14px] font-medium text-[color:var(--warm)]">Hapus kasus aktif</h2>
          <p className="mt-2 text-[13px] text-[color:var(--muted)]">Kasus {activeCase.reference}, semua bukti, file, dan laporannya akan dihapus. Kasus lain tetap tersimpan.</p>
          <button type="button" onClick={() => setPending('delete-case')} className="mt-4 w-full rounded-xl border border-[color:var(--line)] px-4 py-3 text-[13px] text-[color:var(--warm)]">Hapus kasus aktif</button>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-[color:var(--line)] p-5">
        <h2 className="text-[14px] font-medium text-[color:var(--warm)]">Hapus semua data Perisai</h2>
        <p className="mt-2 text-[13px] text-[color:var(--muted)]">Semua kasus, bukti, file, laporan, status, dan pengaturan akan dihapus dari browser ini. Cadangan dan PDF yang sudah diunduh tidak ikut terhapus.</p>
        <button type="button" onClick={() => setPending('purge')} className="mt-4 w-full rounded-xl border border-[color:var(--line)] px-4 py-3 text-[13px] text-[color:var(--warm)]">Hapus semua data</button>
      </section>

      {error && <p className="mt-5 text-[13px] text-[color:var(--fill)]">{error}</p>}

      <ConfirmDialog
        open={pending !== null}
        title={pending === 'import' ? 'Ganti data dengan cadangan ini?' : pending === 'delete-case' ? 'Hapus kasus ini?' : 'Hapus semua data Perisai?'}
        confirmLabel={pending === 'import' ? 'Pulihkan cadangan' : pending === 'delete-case' ? 'Hapus kasus' : 'Hapus semua data'}
        busyLabel={pending === 'import' ? 'Memeriksa cadangan…' : 'Menghapus data…'}
        busy={busy}
        destructive={pending !== 'import'}
        onConfirm={confirmAction}
        onCancel={() => { setPending(null); setImportFile(null); }}
      >
        <p>{pending === 'import' ? 'Data yang ada di browser ini akan diganti, bukan digabungkan. Perisai memeriksa file sebelum melakukan perubahan.' : 'Data yang dihapus tidak dapat dipulihkan oleh Perisai. Pastikan kamu sudah membuat cadangan jika masih membutuhkannya.'}</p>
      </ConfirmDialog>
    </Shell>
  );
}
