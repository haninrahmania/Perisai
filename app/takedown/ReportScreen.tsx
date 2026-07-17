'use client';

import { useEffect, useMemo, useState } from 'react';
import { caseStore, type CaseRecord, type EvidenceRecord, type ReportRecord } from '@/lib/case-store';
import {
  REPORT_STATUSES,
  REPORT_STATUS_LABEL,
  REPORT_TARGET_METADATA,
  availableTargets,
  eligibleEvidenceForTarget,
  type ReportStatus,
  type TakedownTarget,
} from '@/lib/reporting';
import { useActiveCase } from '@/components/useActiveCase';
import { LetterView } from '@/components/LetterView';
import { PostReportAssistant } from '@/components/PostReportAssistant';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Toast } from '@/components/Toast';
import { Shell, Title, Lede, Button, Notice, PageSkeleton } from '@/components/ui';

export default function ReportScreen() {
  const { activeCase, loading: caseLoading, error: caseError } = useActiveCase();
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [reports, setReports] = useState<Partial<Record<TakedownTarget, ReportRecord>>>({});
  const [selected, setSelected] = useState<Partial<Record<TakedownTarget, string[]>>>({});
  const [target, setTarget] = useState<TakedownTarget | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [relationship, setRelationship] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  useEffect(() => {
    if (!activeCase) return;
    void Promise.all([caseStore.listEvidence(activeCase.id), caseStore.listReports(activeCase.id)])
      .then(([rows, saved]) => {
        setCaseRecord(activeCase);
        setRelationship(activeCase.relationship ?? '');
        setEvidence(rows);
        const reportMap: Partial<Record<TakedownTarget, ReportRecord>> = {};
        const selectionMap: Partial<Record<TakedownTarget, string[]>> = {};
        for (const report of saved) {
          reportMap[report.target] = report;
          selectionMap[report.target] = report.evidenceIds;
        }
        setReports(reportMap);
        setSelected(selectionMap);
        setTarget(availableTargets(rows)[0] ?? null);
      })
      .catch(() => setError('Kasus ini belum bisa dibuka. Muat ulang halaman untuk mencoba lagi.'))
      .finally(() => setLoading(false));
  }, [activeCase]);

  const targets = useMemo(() => availableTargets(evidence), [evidence]);
  const eligible = useMemo(
    () => (target ? evidence.filter((record) => eligibleEvidenceForTarget(target, record)) : []),
    [evidence, target],
  );
  const selectedIds = target ? selected[target] ?? [] : [];
  const currentReport = target ? reports[target] : undefined;
  const reportMatchesSelection = Boolean(
    currentReport &&
      currentReport.evidenceIds.length === selectedIds.length &&
      currentReport.evidenceIds.every((id, index) => id === selectedIds[index]),
  );

  function toggleEvidence(id: string) {
    if (!target) return;
    setSelected((current) => {
      const ids = current[target] ?? [];
      return {
        ...current,
        [target]: ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id],
      };
    });
  }

  async function persistRelationship() {
    if (!caseRecord || relationship === (caseRecord.relationship ?? '')) return;
    const updated = await caseStore.updateCase(caseRecord.id, { relationship });
    setCaseRecord(updated);
    setReports({});
      setToast('Informasi kasus diperbarui. Laporan lama yang memakainya sudah dihapus.');
  }

  async function createDraft() {
    if (!caseRecord || !target) return;
    setBusy(true);
    setError(null);
    try {
      await persistRelationship();
      const latestCase = (await caseStore.getCase(caseRecord.id)) ?? caseRecord;
      const chosen = eligible.filter((record) => selectedIds.includes(record.id));
      const saved = await caseStore.createReportDraft({
        caseId: latestCase.id,
        target,
        evidenceIds: chosen.map((record) => record.id),
      });
      setCaseRecord(latestCase);
      setReports((current) => ({ ...current, [target]: saved }));
      setToast(saved.status === 'draft' ? 'Draf laporan tersimpan di perangkat ini' : 'Laporan tidak berubah');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Laporan belum bisa dibuat. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: ReportStatus) {
    if (!caseRecord || !target) return;
    try {
      const updated = await caseStore.updateReportStatus(caseRecord.id, target, status);
      setReports((current) => ({ ...current, [target]: updated }));
    } catch {
      setError('Status belum bisa disimpan.');
    }
  }

  async function deleteReport() {
    if (!caseRecord || !target) return;
    setBusy(true);
    try {
      await caseStore.deleteReport(caseRecord.id, target);
      setReports((current) => ({ ...current, [target]: undefined }));
      setPendingDelete(false);
      setToast('Laporan dihapus');
    } finally {
      setBusy(false);
    }
  }

  if (caseLoading) return <PageSkeleton cards={4} />;
  if (caseError) return <Shell><Notice>{caseError}</Notice></Shell>;
  if (!activeCase) return <Shell><Button href="/">Pilih atau buat kasus</Button></Shell>;
  if (error && !caseRecord) return <Shell><Notice>{error}</Notice></Shell>;
  if (loading || !caseRecord) return <PageSkeleton cards={4} />;
  if (evidence.length === 0) return <Shell back={{ href: '/dashboard/', label: 'Kasus' }}><Title>Belum ada bukti</Title><Lede>Tambahkan satu URL atau file sebelum menyusun laporan.</Lede><div className="mt-8"><Button href="/vault/">Ke brankas</Button></div></Shell>;

  const destination = target ? REPORT_TARGET_METADATA[target].destination : null;
  const submittedReports = Object.values(reports).filter((report): report is ReportRecord => Boolean(report));

  return (
    <Shell back={{ href: '/dashboard/', label: 'Kasus' }} step="Laporan">
      <Title>Susun laporan</Title>
      <Lede>Pilih satu target, lalu pilih bukti yang memang ingin kamu sertakan. Tidak ada pilihan seluruh brankas.</Lede>

      <div className="mt-6 flex flex-wrap gap-2">
        {targets.map((item) => (
          <button key={item} type="button" onClick={() => { setTarget(item); setFieldValues({}); }} className={`rounded-xl border px-3 py-2.5 text-[12px] ${target === item ? 'border-[color:var(--mist)] bg-[color:var(--surface-2)] text-[color:var(--warm)]' : 'border-[color:var(--line)] text-[color:var(--muted)]'}`}>
            {REPORT_TARGET_METADATA[item].label}
          </button>
        ))}
      </div>

      {target && (
        <>
          <section className="mt-6 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
            <h2 className="text-[15px] font-medium text-[color:var(--warm)]">Bukti untuk {REPORT_TARGET_METADATA[target].label}</h2>
            <p className="mt-2 text-[12px] text-[color:var(--muted)]">Untuk laporan ke platform, hanya bukti dari platform yang sama yang dapat dipilih. Laporan ke Komdigi dan kronologi dapat memakai bukti lain dari kasus ini.</p>
            <div className="mt-4 space-y-2">
              {eligible.map((record) => (
                <label key={record.id} className="flex gap-3 rounded-xl border border-[color:var(--line)] p-3 text-[12px] text-[color:var(--warm)]">
                  <input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => toggleEvidence(record.id)} />
                  <span><span className="block">{record.kind === 'url' ? record.sourceUrl : record.fileName}</span><span className="mt-1 block font-mono text-[10px] text-[color:var(--muted)]">{record.sha256.slice(0, 16)}…</span></span>
                </label>
              ))}
            </div>
            <label className="mt-5 block text-[12px] text-[color:var(--muted)]">Hubungan dengan pihak terkait (opsional)</label>
            <input value={relationship} onChange={(event) => setRelationship(event.target.value)} onBlur={() => void persistRelationship().catch(() => setError('Hubungan belum bisa disimpan. Coba lagi.'))} placeholder="Contoh: tidak dikenal" className="mt-2 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--night)] px-4 py-3 text-[13px] text-[color:var(--warm)]" />
            <div className="mt-5"><Button onClick={createDraft} disabled={selectedIds.length === 0 || busy}>{busy ? 'Menyusun laporan…' : currentReport ? 'Susun ulang dari pilihan ini' : 'Susun laporan'}</Button></div>
            {error && <p className="mt-3 text-[12px] text-[color:var(--fill)]">{error}</p>}
          </section>

          {currentReport && !reportMatchesSelection && (
            <div className="mt-6">
              <Notice>Pilihan bukti berubah. Susun ulang laporan agar salinan dan tautan tujuan memakai pilihan terbaru.</Notice>
            </div>
          )}

          {currentReport && reportMatchesSelection && (
            <section className="mt-6 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
              <LetterView
                text={currentReport.content}
                values={fieldValues}
                onChange={(key, value) => setFieldValues((current) => ({ ...current, [key]: value }))}
                needsIdentity
                mailto={destination?.kind === 'mailto' ? destination.href.replace(/^mailto:/, '') : undefined}
                formUrl={destination?.kind === 'url' ? destination.href : undefined}
                formLabel={destination?.label}
              />
              <div className="mt-5 border-t border-[color:var(--line)] pt-4">
                <p className="text-[12px] text-[color:var(--muted)]">Kamu memperbarui status ini sendiri. Perisai tidak dapat melihat apakah platform menerima atau menjawab laporan.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {REPORT_STATUSES.map((status) => <button key={status} type="button" onClick={() => void changeStatus(status)} className={`rounded-lg border px-3 py-2 text-[11px] ${currentReport.status === status ? 'border-[color:var(--mist)] text-[color:var(--warm)]' : 'border-[color:var(--line)] text-[color:var(--muted)]'}`}>{REPORT_STATUS_LABEL[status]}</button>)}
                </div>
                <button type="button" onClick={() => setPendingDelete(true)} className="mt-3 px-2 py-2 text-[12px] text-[color:var(--muted)] hover:text-[color:var(--fill)]">Hapus laporan</button>
              </div>
            </section>
          )}
        </>
      )}

      <div className="mt-6"><Notice>Nama, NIK, alamat, dan kontak yang kamu isi hanya dipakai pada salinan yang sedang terbuka. Perisai tidak menyimpannya. Isian akan kosong saat kamu meninggalkan halaman.</Notice></div>
      <PostReportAssistant reports={submittedReports} />
      <ConfirmDialog open={pendingDelete} title="Hapus laporan ini?" confirmLabel="Hapus laporan" busyLabel="Menghapus laporan…" busy={busy} destructive onConfirm={deleteReport} onCancel={() => setPendingDelete(false)}><p>Laporan akan dihapus dari kasus ini. Bukti yang dipilih tetap tersimpan.</p></ConfirmDialog>
      <Toast message={toast} onDone={() => setToast(null)} />
    </Shell>
  );
}
