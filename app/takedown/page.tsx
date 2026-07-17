'use client';

import { useEffect, useState } from 'react';
import { listEvidence } from '@/lib/evidence';
import { availableTargets } from '@/lib/targets';
import { TARGET_LABEL, type TakedownTarget } from '@/lib/takedown-prompts';
import { LetterView } from '@/components/LetterView';
import { Shell, Title, Lede, Button, Notice } from '@/components/ui';
import { useSession } from '@/components/SessionProvider';

type Row = Awaited<ReturnType<typeof listEvidence>>[number];

const DESTINATION: Partial<Record<TakedownTarget, { where: string; how: string }>> = {
  telegram: { where: 'abuse@telegram.org', how: 'Kirim lewat email dari alamat kamu sendiri.' },
  instagram: {
    where: 'Formulir laporan Instagram',
    how: 'Tempel isinya di formulir laporan dalam aplikasi.',
  },
  x: { where: 'Formulir laporan X', how: 'Tempel isinya di formulir laporan X.' },
  tiktok: { where: 'Formulir laporan TikTok', how: 'Tempel isinya di formulir laporan TikTok.' },
  komdigi: { where: 'aduankonten.id', how: 'Tempel isinya di formulir aduan resmi Komdigi.' },
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

const NEEDS_IDENTITY: TakedownTarget[] = ['komdigi', 'police_chronology'];

export default function TakedownPage() {
  const { triage } = useSession();
  const [evidence, setEvidence] = useState<Row[]>([]);
  const [targets, setTargets] = useState<TakedownTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState<Partial<Record<TakedownTarget, string>>>({});
  const [busy, setBusy] = useState<TakedownTarget | null>(null);
  const [errors, setErrors] = useState<Partial<Record<TakedownTarget, string>>>({});
  const [open, setOpen] = useState<TakedownTarget | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [relationship, setRelationship] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const rows = await listEvidence();
        setEvidence(rows);
        setTargets(availableTargets(rows));
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

  if (loading) {
    return (
      <Shell back={{ href: '/vault', label: 'Brankas' }} step="Laporan">
        <p className="text-[14px] text-[color:var(--muted)]">Menyiapkan…</p>
      </Shell>
    );
  }

  if (evidence.length === 0) {
    return (
      <Shell back={{ href: '/vault', label: 'Brankas' }} step="Laporan">
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
  const madeCount = targets.filter((t) => letters[t]).length;

  return (
    <Shell back={{ href: '/vault', label: 'Brankas' }} step="Laporan">
      <Title>Susun laporan</Title>
      <Lede>
        Kami siapkan naskahnya dari bukti yang sudah kamu simpan. Kamu yang membaca, kamu yang
        mengirim — Perisai tidak pernah mengirim apa pun sendiri.
      </Lede>

      {hasIdentityTarget && (
        <div className="mt-6 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
          <p className="text-[14px] font-medium text-[color:var(--warm)]">
            Kenapa laporan resmi butuh NIK kamu
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted)]">
            Komdigi dan kepolisian tidak memproses laporan tanpa identitas pelapor, itu aturan
            mereka, bukan aturan kami. Perisai sendiri tidak pernah meminta identitas kamu, dan
            tidak menyimpannya. Kamu mengisinya langsung ke surat, lalu kamu yang mengirim.
          </p>
          {hasPlatformTarget && (
            <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--muted)]">
              Kalau kamu belum siap membuka identitas resmi, laporan ke platform{' '}
              <span className="text-[color:var(--warm)]">cukup nama, tanpa NIK</span> — dan itu tetap
              bisa menurunkan kontennya. Kamu bisa mulai dari situ dulu.
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
          className="mt-3 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--night)] px-4 py-3.5 text-[14px] text-[color:var(--warm)] placeholder:text-[#5b7183] focus:border-[color:var(--mist)] focus:outline-none"
        />
      </div>

      <div className="mt-8 space-y-4">
        {targets.map((target) => {
          const dest = DESTINATION[target];
          const letter = letters[target];
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
                    {needsIdentity ? 'Butuh NIK' : 'Cukup nama, tanpa NIK'}
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
                    className="w-full rounded-xl bg-[color:var(--surface-2)] px-4 py-3.5 text-[14px] text-[color:var(--warm)] transition-colors hover:bg-[#2c4c68] disabled:opacity-50"
                  >
                    {busy === target ? 'Menyusun laporan…' : 'Susun naskahnya'}
                  </button>
                ) : (
                  <button
                    onClick={() => setOpen(isOpen ? null : target)}
                    className="w-full rounded-xl border border-[color:var(--line)] px-4 py-3.5 text-[14px] text-[color:var(--warm)]"
                  >
                    {isOpen ? 'Tutup naskah' : 'Buka naskah'}
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

              {letter && isOpen && (
                <div className="mt-4">
                  <LetterView
                    text={letter}
                    values={fieldValues}
                    onChange={(key, value) => setFieldValues((v) => ({ ...v, [key]: value }))}
                    needsIdentity={needsIdentity}
                  />
                </div>
              )}
            </section>
          );
        })}
      </div>

      {madeCount > 0 && (
        <div className="mt-10 rounded-2xl border border-[color:var(--line)] p-5">
          <p className="text-[14px] font-medium text-[color:var(--warm)]">
            Sebelum kamu pergi dari halaman ini
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted)]">
            Naskah dan data yang kamu ketik hanya ada di layar ini — tidak kami simpan, dan akan
            hilang begitu kamu berpindah. Bukti di brankas tetap aman. Kalau ada surat yang sudah
            siap, salin dan kirim dulu sekarang.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <Button href="/dashboard">Selesai untuk sekarang</Button>
        <Button href="/vault" variant="quiet">
          Tambah bukti lagi
        </Button>
      </div>
    </Shell>
  );
}