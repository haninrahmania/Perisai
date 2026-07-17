'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { purgeEverything } from '@/lib/purge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Shell, Title, Lede } from '@/components/ui';

export default function PengaturanPage() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [purging, setPurging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function purge() {
    setPurging(true);
    setError(null);
    try {
      await purgeEverything();
      router.replace('/');
    } catch {
      setPurging(false);
      setConfirming(false);
      setError('Data kamu belum terhapus. Coba sekali lagi.');
    }
  }

  return (
    <Shell back={{ href: '/dashboard', label: 'Beranda' }} step="Pengaturan">
      <Title>Data kamu</Title>
      <Lede>
        Semua yang ada di sini milik kamu. Kamu bisa menghapusnya kapan pun, tanpa alasan, tanpa
        bertanya ke siapa pun.
      </Lede>

      <div className="mt-8 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
        <p className="text-[14px] font-medium text-[color:var(--warm)]">Hapus semua data saya</p>
        <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted)]">
          Menghapus seluruh bukti, naskah laporan, dan file yang tersimpan di Perisai. Sertifikat
          yang sudah kamu unduh tidak ikut terhapus.
        </p>
        <button
          onClick={() => setConfirming(true)}
          className="mt-4 w-full rounded-xl border border-[color:var(--line)] px-5 py-4 text-[15px] text-[color:var(--warm)] transition-colors hover:bg-[color:var(--surface-2)]"
        >
          Hapus semua data saya
        </button>
        {error && <p className="mt-3 text-[13px] text-[color:var(--fill)]">{error}</p>}
      </div>

      <div className="mt-6 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
        <p className="text-[14px] font-medium text-[color:var(--warm)]">
          Kalau device kamu bisa dibuka orang lain
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted)]">
          Perisai tidak meminta kata sandi. Siapa pun yang memegang device kamu dalam keadaan terbuka
          bisa membuka brankas ini. Menghapus semua data adalah cara tercepat yang tersedia
          sekarang. Kami sedang menyiapkan mode penyamaran untuk melengkapinya.
        </p>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Hapus semua data kamu?"
        confirmLabel="Ya, hapus semuanya"
        busy={purging}
        onConfirm={purge}
        onCancel={() => setConfirming(false)}
      >
        <p>
          Semua bukti, laporan, dan file kamu akan dihapus permanen dari Perisai. Ini tidak bisa
          dibatalkan, dan kami tidak bisa memulihkannya untuk kamu.
        </p>
      </ConfirmDialog>
    </Shell>
  );
}