'use client';

import { useEffect, useState } from 'react';
import { listEvidence } from '@/lib/evidence';
import { generateCertificate } from '@/lib/certificate';
import { Shell, Title, Lede, Button } from '@/components/ui';

type Row = Awaited<ReturnType<typeof listEvidence>>[number];

export default function SertifikatPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseRef] = useState(() => `PRS-${Date.now().toString(36).toUpperCase()}`);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setRows(await listEvidence());
      } catch {
        setError('Belum bisa membaca brankas kamu. Coba muat ulang halaman ini.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleDownload() {
    try {
      generateCertificate(rows, caseRef);
      setDone(true);
    } catch {
      setError('Sertifikatnya belum berhasil dibuat. Bukti kamu tetap aman — coba sekali lagi.');
    }
  }

  return (
    <Shell back={{ href: '/vault', label: 'Brankas' }} step="Sertifikat bukti">
      <Title>Sertifikat bukti</Title>
      <Lede>
        Satu berkas PDF berisi daftar bukti kamu, sidik digital masing-masing, dan waktu
        pengamanannya. Bisa kamu lampirkan saat melapor.
      </Lede>

      <div className="mt-8 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)]">
          Nomor berkas
        </p>
        <p className="mt-1.5 font-mono text-[15px] text-[color:var(--warm)]">{caseRef}</p>

        <div className="mt-5 border-t border-[color:var(--line)] pt-5">
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)]">
            Isinya
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--warm)]">
            {loading
              ? 'Menghitung…'
              : `${rows.length} bukti, lengkap dengan sidik digital dan waktu.`}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-[color:var(--line)] p-5">
        <div>
          <p className="text-[14px] font-medium text-[color:var(--warm)]">Yang membuatnya kuat</p>
          <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted)]">
            Sidik digital setiap bukti dihitung{' '}
            <span className="text-[color:var(--warm)]">
              di HP kamu, sebelum apa pun sampai ke server kami
            </span>
            . Kalau nanti ada yang mempertanyakan apakah bukti kamu berubah sejak disimpan, angka
            inilah jawabannya. Ini memperkuat integritas bukti.
          </p>
        </div>
        <div className="border-t border-[color:var(--line)] pt-4">
          <p className="text-[14px] font-medium text-[color:var(--warm)]">Yang perlu kamu tahu</p>
          <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted)]">
            Sertifikat ini bukan hasil pemeriksaan forensik resmi, dan bukan nasihat hukum. Untuk
            langkah hukum, pendamping seperti LBH APIK bisa membantu kamu membacanya.
          </p>
        </div>
      </div>

      {error && <p className="mt-5 text-[13px] text-[color:var(--fill)]">{error}</p>}

      <div className="mt-8 space-y-3">
        <Button onClick={handleDownload} disabled={loading || rows.length === 0}>
          {loading ? 'Menyiapkan…' : 'Unduh sertifikat (PDF)'}
        </Button>
        {!loading && rows.length === 0 && (
          <>
            <p className="text-center text-[13px] leading-relaxed text-[color:var(--muted)]">
              Brankas kamu masih kosong. Simpan satu bukti dulu, lalu sertifikatnya bisa dibuat.
            </p>
            <Button href="/vault" variant="quiet">
              Ke brankas bukti
            </Button>
          </>
        )}
        {done && (
          <p className="text-center text-[13px] leading-relaxed text-[color:var(--mist)]">
            Sertifikat sudah terunduh ke perangkat kamu.
          </p>
        )}
      </div>
    </Shell>
  );
}