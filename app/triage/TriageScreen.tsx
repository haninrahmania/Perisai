'use client';

import { useState } from 'react';
import { caseStore, type IncidentKind, type Platform } from '@/lib/case-store';
import { useActiveCase } from '@/components/useActiveCase';
import { Shell, Title, Lede, Choice, Button, Notice, PageSkeleton } from '@/components/ui';

const INCIDENTS: { value: IncidentKind; label: string }[] = [
  { value: 'deepfake', label: 'Wajahku dipakai di konten seksual buatan AI' },
  { value: 'ncii', label: 'Foto atau video pribadiku disebar tanpa izin' },
  { value: 'threat', label: 'Seseorang mengancam akan menyebarkannya' },
  { value: 'other', label: 'Sesuatu yang lain' },
];

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'telegram', label: 'Telegram' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'other', label: 'Tempat lain / aku belum tahu' },
];

function EmergencyScreen({ onSafe }: { onSafe: () => void }) {
  return (
    <Shell>
      <div className="py-8">
        <Title>Keselamatan kamu dulu.</Title>
        <Lede>Kalau ada bahaya langsung, hubungi bantuan manusia sekarang. Kasusmu tetap tersimpan.</Lede>
        <div className="mt-8 space-y-3">
          <a href="tel:110" className="block rounded-2xl border border-[color:var(--line)] p-5">
            <p className="text-[16px] text-[color:var(--warm)]">Polisi / darurat</p>
            <p className="mt-1 font-mono text-[color:var(--mist)]">110</p>
          </a>
          <a href="tel:129" className="block rounded-2xl border border-[color:var(--line)] p-5">
            <p className="text-[16px] text-[color:var(--warm)]">SAPA Kementerian PPPA</p>
            <p className="mt-1 font-mono text-[color:var(--mist)]">129</p>
          </a>
        </div>
        <div className="mt-10">
          <Button onClick={onSafe} variant="quiet">Aku sudah aman dan ingin melanjutkan</Button>
        </div>
      </div>
    </Shell>
  );
}

export default function TriageScreen() {
  const { activeCase, loading, error } = useActiveCase();
  const [step, setStep] = useState(0);
  const [emergency, setEmergency] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function saveFact(patch: { incident?: IncidentKind; platform?: Platform }) {
    if (!activeCase) return;
    setSaving(true);
    setSaveError(null);
    try {
      await caseStore.updateCase(activeCase.id, patch);
      setStep((current) => current + 1);
    } catch {
      setSaveError('Fakta kasus belum bisa disimpan di perangkat ini.');
    } finally {
      setSaving(false);
    }
  }

  if (emergency) return <EmergencyScreen onSafe={() => setEmergency(false)} />;
  if (loading) return <PageSkeleton cards={3} />;
  if (error) return <Shell><Notice>{error}</Notice></Shell>;
  if (!activeCase) {
    return (
      <Shell back={{ href: '/', label: 'Awal' }}>
        <Title>Belum ada kasus aktif</Title>
        <Lede>Mulai kasus baru dari halaman awal agar setiap bukti punya pemilik yang jelas.</Lede>
        <div className="mt-8"><Button href="/">Ke halaman awal</Button></div>
      </Shell>
    );
  }

  return (
    <Shell back={step === 0 ? { href: '/', label: 'Kasus' } : undefined} step={`${step + 1} dari 3`}>
      {step > 0 && (
        <button type="button" onClick={() => setStep((current) => current - 1)} className="mb-6 text-left text-[13px] text-[color:var(--muted)]">
          ← Pertanyaan sebelumnya
        </button>
      )}
      {step === 0 && (
        <>
          <Title>Apa yang terjadi?</Title>
          <Lede>Pilih yang paling mendekati. Jawaban ini hanya ditambahkan ke kasus yang sedang kamu buka.</Lede>
          <div className="mt-8 space-y-3">
            {INCIDENTS.map((incident) => (
              <Choice key={incident.value} onClick={() => void saveFact({ incident: incident.value })}>
                {incident.label}
              </Choice>
            ))}
          </div>
        </>
      )}
      {step === 1 && (
        <>
          <Title>Di mana kamu melihatnya?</Title>
          <Lede>Ini menjadi lingkup platform kasus dan membantu menyaring bukti yang sesuai.</Lede>
          <div className="mt-8 space-y-3">
            {PLATFORMS.map((platform) => (
              <Choice key={platform.value} onClick={() => void saveFact({ platform: platform.value })}>
                {platform.label}
              </Choice>
            ))}
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <Title>Apakah kamu sedang dalam bahaya fisik?</Title>
          <Lede>Kalau iya, keselamatanmu lebih penting daripada bukti atau laporan.</Lede>
          <div className="mt-8 space-y-3">
            <Choice onClick={() => setEmergency(true)}>Iya, aku tidak merasa aman sekarang</Choice>
            <Choice onClick={() => window.location.assign('/vault/')}>Tidak, aku aman secara fisik</Choice>
          </div>
        </>
      )}
      {saving && <p className="mt-4 text-[12px] text-[color:var(--muted)]" role="status">Menyimpan pilihan…</p>}
      {saveError && <p className="mt-4 text-[12px] text-[color:var(--fill)]">{saveError}</p>}
    </Shell>
  );
}
