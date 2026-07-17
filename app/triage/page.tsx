'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell, Title, Lede, Choice, Button } from '@/components/ui';
import { useSession, type TriageAnswers } from '@/components/SessionProvider';

const INCIDENTS: { value: NonNullable<TriageAnswers['incident']>; label: string }[] = [
  { value: 'deepfake', label: 'Wajahku dipakai di konten seksual buatan AI' },
  { value: 'ncii', label: 'Foto atau video pribadiku disebar tanpa izin' },
  { value: 'ancaman', label: 'Seseorang mengancam akan menyebarkannya' },
  { value: 'lainnya', label: 'Sesuatu yang lain' },
];

const PLATFORMS: { value: NonNullable<TriageAnswers['platform']>; label: string }[] = [
  { value: 'telegram', label: 'Telegram' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'other', label: 'Tempat lain / aku belum tahu' },
];

function EmergencyContact({
  name,
  detail,
  href,
  note,
}: {
  name: string;
  detail: string;
  href: string;
  note: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-5 transition-colors hover:border-[color:var(--mist)]"
    >
      <p className="text-[16px] font-medium text-[color:var(--warm)]">{name}</p>
      <p className="mt-1 font-mono text-[15px] text-[color:var(--mist)]">{detail}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted)]">{note}</p>
    </a>
  );
}

function EmergencyScreen({ onSafe }: { onSafe: () => void }) {
  return (
    <Shell>
      <div className="py-8">
        <div className="mb-8 h-px w-12 bg-[color:var(--mist)]" />
        <Title>Keselamatan kamu dulu.</Title>
        <Lede>
          Bukti dan laporan bisa menunggu — semuanya masih akan ada di sini nanti. Sekarang, kalau
          bisa, hubungi salah satu dari ini.
        </Lede>

        <div className="mt-8 space-y-3">
          <EmergencyContact
            name="Polisi"
            detail="110"
            href="tel:110"
            note="Kalau ada ancaman langsung terhadap keselamatanmu"
          />
          <EmergencyContact
            name="SAPA Kementerian PPPA"
            detail="129"
            href="tel:129"
            note="Layanan pengaduan kekerasan terhadap perempuan, 24 jam"
          />
          <EmergencyContact
            name="Komnas Perempuan"
            detail="komnasperempuan.go.id"
            href="https://komnasperempuan.go.id"
            note="Pengaduan dan rujukan pendampingan"
          />
          <EmergencyContact
            name="LBH APIK Jakarta"
            detail="lbhapik.or.id"
            href="https://lbhapik.or.id"
            note="Bantuan hukum untuk perempuan"
          />
        </div>

        <div className="mt-10 space-y-3">
          <Button onClick={onSafe} variant="quiet">
            Aku sudah aman dan siap untuk membuat laporan
          </Button>
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
          Kamu tidak perlu buru-buru. Kalau kamu mau berhenti di sini hari ini, itu tidak apa-apa —
          brankas ini akan tetap ada besok, atau minggu depan.
        </Lede>
        <p className="mt-4 text-[15px] leading-relaxed text-[color:var(--muted)]">
          Kalau kamu siap melangkah, langkah berikutnya kecil saja: menyimpan satu jejak, selagi
          masih ada.
        </p>

        <div className="mt-10 space-y-3">
          <Button href="/vault">Aku siap, amankan bukti</Button>
          <Button href="/" variant="quiet">
            Kembali ke awal
          </Button>
          <button
            onClick={onBack}
            className="w-full py-3 text-[13px] text-[color:var(--muted)] transition-colors hover:text-[color:var(--warm)]"
          >
            ← Kembali ke kontak darurat
          </button>
        </div>
      </div>
    </Shell>
  );
}

export default function TriagePage() {
  const router = useRouter();
  const { setTriage } = useSession();
  const [step, setStep] = useState(0);
  const [screen, setScreen] = useState<'triage' | 'emergency' | 'safe'>('triage');

  if (screen === 'emergency') return <EmergencyScreen onSafe={() => setScreen('safe')} />;
  if (screen === 'safe') return <SafeNowScreen onBack={() => setScreen('emergency')} />;

  return (
    <Shell
      back={step === 0 ? { href: '/', label: 'Kembali' } : undefined}
      step={`${step + 1} dari 3`}
    >
      {step > 0 && (
        <button
          onClick={() => setStep((s) => s - 1)}
          className="-mt-4 mb-6 self-start text-[13px] text-[color:var(--muted)]"
        >
          ← Pertanyaan sebelumnya
        </button>
      )}

      {step === 0 && (
        <>
          <Title>Apa yang terjadi?</Title>
          <Lede>Pilih yang paling mendekati. Kamu tidak perlu menjelaskan detailnya.</Lede>
          <div className="mt-8 space-y-3">
            {INCIDENTS.map((i) => (
              <Choice
                key={i.value}
                onClick={() => {
                  setTriage({ incident: i.value });
                  setStep(1);
                }}
              >
                {i.label}
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
            {PLATFORMS.map((p) => (
              <Choice
                key={p.value}
                onClick={() => {
                  setTriage({ platform: p.value });
                  setStep(2);
                }}
              >
                {p.label}
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
            <Choice onClick={() => setScreen('emergency')}>
              Iya, aku tidak merasa aman sekarang
            </Choice>
            <Choice onClick={() => router.push('/vault')}>Tidak, aku aman secara fisik</Choice>
          </div>
        </>
      )}
    </Shell>
  );
}