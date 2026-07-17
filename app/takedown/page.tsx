'use client';

import { useEffect, useState } from 'react';
import { listEvidence } from '@/lib/evidence';
import { availableTargets } from '@/lib/targets';
import { TARGET_LABEL, type TakedownTarget } from '@/lib/takedown-prompts';
import { saveReport, listReports, updateReportStatus, deleteReport } from '@/lib/reports';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Toast } from '@/components/Toast';
import { LetterView } from '@/components/LetterView';
import { Shell, Title, Lede, Button, Notice } from '@/components/ui';
import { useSession } from '@/components/SessionProvider';
import { KomdigiHelper } from '@/components/KomdigiHelper';

type Row = Awaited<ReturnType<typeof listEvidence>>[number];
type Report = Awaited<ReturnType<typeof listReports>>[number];
type ReportStatus = Report['status'];

const STATUS_LABEL: Record<ReportStatus, string> = {
  draft: 'Belum dikirim',
  sent: 'Sudah dilaporkan',
  in_review: 'Menunggu respons',
  taken_down: 'Konten dihapus',
  rejected: 'Ditolak platform',
};

const STATUS_ORDER: ReportStatus[] = ['draft', 'sent', 'in_review', 'taken_down', 'rejected'];

const DESTINATION: Partial<Record<TakedownTarget, { where: string; how: string }>> = {
  telegram: { where: 'abuse@telegram.org', how: 'Kirim lewat email dari alamat kamu sendiri.' },
  instagram: {
    where: 'Formulir laporan Instagram',
    how: 'Tempel isinya di formulir laporan dalam aplikasi.',
  },
  x: { where: 'Formulir laporan X', how: 'Tempel isinya di formulir laporan X.' },
  tiktok: { where: 'Formulir laporan TikTok', how: 'Tempel isinya di formulir laporan TikTok.' },
  komdigi: {
    where: 'aduankonten.id',
    how: 'Isi formulir aduan resmi Komdigi. Tanpa nama, tanpa NIK.',
  },
  police_chronology: {
    where: 'SPKT kantor polisi terdekat',
    how: 'Cetak naskah ini dan bawa saat membuat laporan. Tidak dikirim online.',
  },
};

const LANGUAGE_NOTE: Partial<Record<TakedownTarget, string>> = {
  telegram: 'Surat ini dalam bahasa Inggris — itu bahasa yang diproses tim Telegram.',
  instagram: 'Surat ini dalam bahasa Inggris — itu bahasa yang diproses tim Instagram.',
  x: 'Surat ini dalam bahasa Inggris — itu bahasa yang diproses tim X.',
  tiktok: 'Surat ini dalam bahasa Inggris — itu bahasa yang diproses tim TikTok.',
};

const NEEDS_IDENTITY: TakedownTarget[] = ['police_chronology'];

const EMAIL_TARGET: Partial<Record<TakedownTarget, string>> = {
  telegram: 'abuse@telegram.org',
};

const FORM_TARGET: Partial<Record<TakedownTarget, { url: string; label: string }>> = {};

export default function TakedownPage() {
  const { triage } = useSession();
  const [evidence, setEvidence] = useState<Row[]>([]);
  const [targets, setTargets] = useState<TakedownTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState<Partial<Record<TakedownTarget, string>>>({});
  const [reports, setReports] = useState<Partial<Record<TakedownTarget, Report>>>({});
  const [busy, setBusy] = useState<TakedownTarget | null>(null);
  const [errors, setErrors] = useState<Partial<Record<TakedownTarget, string>>>({});
  const [open, setOpen] = useState<TakedownTarget | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [relationship, setRelationship] = useState('');
  const [pendingDelete, setPendingDelete] = useState<TakedownTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [rows, saved] = await Promise.all([listEvidence(), listReports()]);
        setEvidence(rows);
        setTargets(availableTargets(rows));

        const letterMap: Partial<Record<TakedownTarget, string>> = {};
        const reportMap: Partial<Record<TakedownTarget, Report>> = {};
        for (const r of saved) {
          if (!reportMap[r.target]) {
            reportMap[r.target] = r;
            if (r.content) letterMap[r.target] = r.content;
          }
        }
        setLetters(letterMap);
        setReports(reportMap);
      } catch {
        setErrors({ komdigi: 'Belum bisa membaca brankas kamu.' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function generate(target: TakedownTarget) {
    setBusy(target);
    setErrors((e) => ({ ...e, [target]: undefined }));
    try {
      const firstSeenRow = evidence.find((e) => e.found_at);
      const res = await fetch('/api/takedown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          ctx: {
            platform: triage.platform,
            firstSeen: firstSeenRow?.found_at
              ? new Date(firstSeenRow.found_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : undefined,
            relationship: relationship.trim() || undefined,
            evidence,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? 'failed');

      setLetters((l) => ({ ...l, [target]: json.text as string }));
      setOpen(target);
      setToast('Naskah tersimpan');

      // Persist the RAW letter — placeholders intact, never her filled-in identity.
      try {
        const row = await saveReport(
          target,
          json.text as string,
          evidence.map((e) => e.id),
        );
        setReports((r) => ({ ...r, [target]: row }));
      } catch (err) {
        console.warn('[reports] save failed, letter still on screen', err);
      }

      if (process.env.NODE_ENV === 'development' && json.source === 'cached') {
        console.info('[dev] takedown served from cache');
      }
    } catch {
      setErrors((e) => ({
        ...e,
        [target]: 'Suratnya belum berhasil disusun. Tidak ada yang hilang, coba lagi.',
      }));
    } finally {
      setBusy(null);
    }
  }

  async function changeStatus(target: TakedownTarget, status: ReportStatus) {
    const report = reports[target];
    if (!report) return;
    const previous = report;
    setReports((r) => ({ ...r, [target]: { ...report, status } }));
    try {
      const updated = await updateReportStatus(report.id, status);
      setReports((r) => ({ ...r, [target]: updated }));
    } catch {
      setReports((r) => ({ ...r, [target]: previous }));
    }
  }

  async function confirmDeleteReport() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    const report = reports[target];
    if (!report) return;
    setDeleting(true);
    try {
      await deleteReport(report.id);
      setReports((r) => ({ ...r, [target]: undefined }));
      setLetters((l) => ({ ...l, [target]: undefined }));
      if (open === target) setOpen(null);
      setPendingDelete(null);
      setToast('Naskah dihapus');
    } catch {
      setErrors((e) => ({ ...e, [target]: 'Naskah itu belum bisa dihapus. Coba lagi.' }));
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <Shell back="auto" step="Laporan">
        <p className="text-[14px] text-[color:var(--muted)]">Menyiapkan…</p>
      </Shell>
    );
  }

  if (evidence.length === 0) {
    return (
      <Shell back="auto" step="Laporan">
        <Title>Simpan bukti dulu</Title>
        <Lede>
          Laporan disusun dari bukti yang ada di brankas kamu. Satu tautan atau tangkapan layar
          sudah cukup untuk memulai.
        </Lede>
        <div className="mt-8">
          <Button href="/vault">Ke brankas bukti</Button>
        </div>
      </Shell>
    );
  }

  const hasIdentityTarget = targets.some((t) => NEEDS_IDENTITY.includes(t));
  const hasPlatformTarget = targets.some((t) => !NEEDS_IDENTITY.includes(t));

  return (
    <Shell back="auto" step="Laporan">
      <Title>Susun laporan</Title>
      <Lede>
        Kami siapkan naskahnya dari bukti yang sudah kamu simpan. Kamu yang membaca, kamu yang
        mengirim — Perisai tidak pernah mengirim apa pun sendiri.
      </Lede>

      {hasIdentityTarget && (
        <div className="mt-6 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
          <p className="text-[14px] font-medium text-[color:var(--warm)]">
            Laporan polisi butuh identitas kamu
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted)]">
            Kepolisian tidak memproses laporan tanpa identitas pelapor — itu aturan mereka, bukan
            aturan kami. Perisai sendiri tidak pernah meminta identitas kamu, dan tidak
            menyimpannya. Kamu mengisinya langsung ke naskah, lalu kamu yang membawanya.
          </p>
          {hasPlatformTarget && (
            <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--muted)]">
              Laporan ke platform dan ke Komdigi{' '}
              <span className="text-[color:var(--warm)]">tidak butuh identitas kamu sama sekali</span>{' '}
              — dan itu tetap bisa menurunkan kontennya. Kamu bisa mulai dari situ dulu.
            </p>
          )}
        </div>
      )}

      <div className="mt-6">
        <Notice>
          Satu keterangan opsional bisa membuat suratnya lebih tepat: hubunganmu dengan orang yang
          menyebarkannya, kalau kamu tahu.
        </Notice>
        <input
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder="mis. mantan pasangan — boleh dikosongkan"
          className="mt-3 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--night)] px-4 py-3.5 text-[14px] text-[color:var(--warm)] placeholder:text-[#a394c4] focus:border-[color:var(--mist)] focus:outline-none"
        />
      </div>

      <div className="mt-8 space-y-4">
        {targets.map((target) => {
          const dest = DESTINATION[target];
          const letter = letters[target];
          const report = reports[target];
          const isOpen = open === target;
          const needsIdentity = NEEDS_IDENTITY.includes(target);
          return (
            <section
              key={target}
              className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[16px] font-medium text-[color:var(--warm)]">
                    {TARGET_LABEL[target]}
                  </h2>
                  <span
                    className={`rounded-md border px-2 py-1 text-[11px] ${
                      needsIdentity
                        ? 'border-[color:var(--fill)] text-[color:var(--fill)]'
                        : 'border-[color:var(--line)] text-[color:var(--muted)]'
                    }`}
                  >
                    {needsIdentity ? 'Butuh NIK & KTP' : 'Tanpa identitas'}
                  </span>
                </div>
                {dest && (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--muted)]">
                    {dest.how} Tujuan:{' '}
                    <span className="font-mono text-[color:var(--mist)]">{dest.where}</span>
                  </p>
                )}
              </div>

              {LANGUAGE_NOTE[target] && (
                <p className="mt-3 text-[12px] leading-relaxed text-[color:var(--muted)]">
                  {LANGUAGE_NOTE[target]}
                </p>
              )}

              <div className="mt-4">
                {!letter ? (
                  <button
                    onClick={() => generate(target)}
                    disabled={busy !== null}
                    className="w-full rounded-xl bg-[color:var(--surface-2)] px-4 py-3.5 text-[14px] text-[color:var(--warm)] transition-colors hover:bg-[#9a9aef] disabled:opacity-50"
                  >
                    {busy === target
                      ? 'Menyusun laporan…'
                      : target === 'komdigi'
                        ? 'Buat aduan ke Komdigi'
                        : 'Susun naskahnya'}
                  </button>
                ) : (
                  <button
                    onClick={() => setOpen(isOpen ? null : target)}
                    className="w-full rounded-xl border border-[color:var(--line)] px-4 py-3.5 text-[14px] text-[color:var(--warm)]"
                  >
                    {isOpen
                      ? 'Tutup naskah'
                      : target === 'komdigi'
                        ? 'Buat aduan ke Komdigi'
                        : 'Buka naskah'}
                  </button>
                )}
              </div>

              {busy === target && (
                <p className="mt-3 text-[12px] leading-relaxed text-[color:var(--muted)]">
                  Ini butuh sekitar sepuluh detik. Tidak perlu ditunggui.
                </p>
              )}

              {errors[target] && (
                <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--fill)]">
                  {errors[target]}
                </p>
              )}

              {letter && isOpen && target === 'komdigi' && (
                <div className="mt-4">
                  <KomdigiHelper defaultReason={letter} />
                </div>
              )}

              {letter && isOpen && target !== 'komdigi' && (
                <div className="mt-4">
                  <LetterView
                    text={letter}
                    values={fieldValues}
                    onChange={(key, value) => setFieldValues((v) => ({ ...v, [key]: value }))}
                    needsIdentity={needsIdentity}
                    mailto={EMAIL_TARGET[target]}
                    formUrl={FORM_TARGET[target]?.url}
                    formLabel={FORM_TARGET[target]?.label}
                  />
                </div>
              )}

              {report && (
                <div className="mt-4 border-t border-[color:var(--line)] pt-4">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-[color:var(--muted)]">
                    Sejauh mana
                  </p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--muted)]">
                    Kamu yang menandai ini. Perisai tidak bisa tahu jawaban platform.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {STATUS_ORDER.map((s) => (
                      <button
                        key={s}
                        onClick={() => changeStatus(target, s)}
                        className={`rounded-lg border px-3 py-2 text-[12px] transition-colors ${
                          report.status === s
                            ? 'border-[color:var(--mist)] bg-[color:var(--surface-2)] text-[color:var(--warm)]'
                            : 'border-[color:var(--line)] text-[color:var(--muted)]'
                        }`}
                      >
                        {STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setPendingDelete(target)}
                    className="mt-3 rounded-md px-2.5 py-2 text-[12px] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fill)]"
                  >
                    Hapus naskah ini
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
        <p className="text-[14px] font-medium text-[color:var(--warm)]">Yang tersimpan, yang tidak</p>
        <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted)]">
          Naskah suratnya tersimpan, jadi kamu tidak perlu menyusunnya ulang. Tapi data yang kamu
          ketik sendiri — nama, NIK, alamat — tidak ikut tersimpan. Itu hanya ada di layar ini, dan
          hilang saat kamu berpindah.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <Button href="/dashboard">Selesai untuk sekarang</Button>
        <Button href="/vault" variant="quiet">
          Tambah bukti lagi
        </Button>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus naskah ini?"
        confirmLabel="Ya, hapus"
        busy={deleting}
        onConfirm={confirmDeleteReport}
        onCancel={() => setPendingDelete(null)}
      >
        <p>Tindakan ini tidak bisa dibatalkan. Bukti di brankas kamu tidak ikut terhapus.</p>
        <p>Kamu bisa menyusun naskah baru kapan pun.</p>
      </ConfirmDialog>

      <Toast message={toast} onDone={() => setToast(null)} />
    </Shell>
  );
}