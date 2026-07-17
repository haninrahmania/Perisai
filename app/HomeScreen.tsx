'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { caseStore, type CaseRecord } from '@/lib/case-store';
import { EMERGENCY } from '@/lib/crisis';
import { EmergencyContacts } from '@/components/EmergencyContacts';
import { Notice, PageSkeleton } from '@/components/ui';

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
    <main className="mx-auto min-h-dvh w-full max-w-[540px] px-5 pb-12 pt-10">
      <section className="py-10">
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
          Perisai menemani kamu mengamankan bukti, menyusun laporan, dan menemukan bantuan
          manusia—satu langkah kecil setiap kali.
        </p>

        <button
          type="button"
          onClick={createCase}
          disabled={busy}
          className="mt-10 w-full rounded-2xl bg-[color:var(--heading)] px-5 py-5 text-left text-white shadow-sm transition-transform active:scale-[0.99] disabled:opacity-50"
        >
          <span className="block text-[16px] font-medium">
            {busy ? 'Menyiapkan ruang amanmu…' : 'Aku butuh bantuan sekarang'}
          </span>
          <span className="mt-1 block text-[13px] leading-relaxed text-white/70">
            Sesuatu sudah tersebar atau sedang diancamkan
          </span>
        </button>
        <a
          href="#bantuan-fisik"
          className="mt-3 flex min-h-12 items-center justify-center rounded-2xl border border-[color:var(--line)] px-5 text-[14px] text-[color:var(--warm)]"
        >
          Aku dalam bahaya fisik
        </a>

        <p className="mt-5 text-[12px] leading-relaxed text-[color:var(--muted)]">
          Kamu tidak perlu memasukkan nama atau email. Kasus, bukti, dan laporan disimpan di
          browser pada perangkat ini dan tidak dikirim ke internet.
        </p>

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
      </section>

      <section className="border-t border-[color:var(--line)] py-10">
        <h2 className="font-display text-[24px] font-semibold text-[color:var(--heading)]">
          Kamu tetap memegang kendali
        </h2>
        <div className="mt-6 space-y-6">
          {[
            ['1', 'Amankan yang kamu punya', 'Simpan tautan, tangkapan layar, atau file tanpa membukanya kembali di internet.'],
            ['2', 'Susun laporan dengan tenang', 'Pilih tujuan laporan dan bukti yang memang ingin kamu sertakan. Tidak ada isi brankas yang dipilih otomatis.'],
            ['3', 'Tentukan langkah berikutnya', 'Salin laporan, buka kanal resmi, atau hubungi pendamping manusia. Perisai tidak mengirim laporan atas namamu.'],
          ].map(([number, title, description]) => (
            <div key={number} className="flex gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--surface-2)] font-mono text-[12px] text-[color:var(--warm)]">{number}</span>
              <div>
                <h3 className="text-[15px] font-medium text-[color:var(--warm)]">{title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--muted)]">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="bantuan-fisik" className="scroll-mt-6 border-t border-[color:var(--line)] py-10">
        <h2 className="font-display text-[24px] font-semibold text-[color:var(--heading)]">
          Jika kamu tidak aman secara fisik
        </h2>
        <p className="mb-6 mt-3 text-[14px] leading-relaxed text-[color:var(--muted)]">
          Bukti dan laporan bisa menunggu. Pergi ke tempat yang lebih aman jika memungkinkan,
          lalu hubungi orang yang kamu percaya atau salah satu layanan berikut. Membuka tautan atau
          menelepon adalah pilihanmu; Perisai tidak membagikan isi kasusmu.
        </p>
        <EmergencyContacts contacts={EMERGENCY.physical_danger} />
      </section>

      <Notice>
        Data tersimpan di browser ini dan tidak dienkripsi secara otomatis. Jika data situs
        dihapus atau perangkat hilang, Perisai hanya dapat memulihkannya dari cadangan yang sudah
        kamu unduh.
      </Notice>
    </main>
  );
}
