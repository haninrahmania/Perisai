'use client';

import { useState } from 'react';
import { caseStore, type IncidentKind, type Platform } from '@/lib/case-store';
import { EMERGENCY } from '@/lib/crisis';
import { EmergencyContacts } from '@/components/EmergencyContacts';
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
        <div className="mb-8 h-px w-12 bg-[color:var(--mist)]" />
        <Title>Keselamatan kamu dulu.</Title>
        <Lede>
          Bukti dan laporan bisa menunggu—semuanya masih akan ada di sini nanti. Sekarang, kalau
          bisa, pergi ke tempat yang lebih aman, hubungi orang yang kamu percaya, atau pilih salah
          satu bantuan berikut.
        </Lede>
        <div className="mt-8">
          <EmergencyContacts contacts={EMERGENCY.physical_danger} />
        </div>
        <div className="mt-10">
          <Button onClick={onSafe} variant="quiet">Aku sudah aman dan siap untuk membuat laporan</Button>
        </div>
      </div>
    </Shell>
  );
}

function SafeNowScreen({ onBack }: { onBack: () => void }) {
  return (
    <Shell>
      <div className="flex flex-1 flex-col justify-center py-16">
        <div className="mb-8 h-px w-12 bg-[color:var(--mist)]" />
        <Title>Lega mendengarnya.</Title>
        <Lede>
          Kamu tidak perlu buru-buru. Kalau kamu mau berhenti di sini hari ini, itu tidak apa-apa—
          brankas ini akan tetap ada besok, atau minggu depan.
        </Lede>
        <p className="mt-4 text-[15px] leading-relaxed text-[color:var(--muted)]">
          Kalau kamu siap melangkah, langkah berikutnya kecil saja: menyimpan satu jejak, selagi
          masih ada.
        </p>
        <div className="mt-10 space-y-3">
          <Button href="/vault/">Aku siap, amankan bukti</Button>
          <Button href="/" variant="quiet">Kembali ke awal</Button>
          <button type="button" onClick={onBack} className="w-full py-3 text-[13px] text-[color:var(--muted)] transition-colors hover:text-[color:var(--warm)]">
            ← Kembali ke kontak darurat
          </button>
        </div>
      </div>
    </Shell>
  );
}

export default function TriageScreen() {
  const { activeCase, loading, error } = useActiveCase();
  const [step, setStep] = useState(0);
  const [safetyScreen, setSafetyScreen] = useState<'triage' | 'emergency' | 'safe'>('triage');
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

  if (safetyScreen === 'emergency') return <EmergencyScreen onSafe={() => setSafetyScreen('safe')} />;
  if (safetyScreen === 'safe') return <SafeNowScreen onBack={() => setSafetyScreen('emergency')} />;
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
          <Lede>Pilih yang paling mendekati. Kamu tidak perlu menjelaskan detailnya.</Lede>
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
          <Lede>Ini membantu kami menyiapkan laporan ke tempat yang tepat.</Lede>
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
          <Title>Saat ini, apakah kamu sedang dalam bahaya fisik?</Title>
          <Lede>
            Misalnya seseorang ada di dekatmu dan bisa menyakitimu. Kalau iya, itu yang kami urus
            duluan.
          </Lede>
          <div className="mt-8 space-y-3">
            <Choice onClick={() => setSafetyScreen('emergency')}>Iya, aku tidak merasa aman sekarang</Choice>
            <Choice onClick={() => window.location.assign('/vault/')}>Tidak, aku aman secara fisik</Choice>
          </div>
        </>
      )}
      {saving && <p className="mt-4 text-[12px] text-[color:var(--muted)]" role="status">Menyimpan pilihan…</p>}
      {saveError && <p className="mt-4 text-[12px] text-[color:var(--fill)]">{saveError}</p>}
    </Shell>
  );
}
