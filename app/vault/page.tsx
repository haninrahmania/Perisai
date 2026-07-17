'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ensureSession } from '@/lib/supabase';
import { addEvidence, listEvidence } from '@/lib/evidence';
import EvidenceCard from '@/components/EvidenceCard';
import { Shell, Title, Lede, Button, Notice } from '@/components/ui';
import { useSession } from '@/components/SessionProvider';

type Row = Awaited<ReturnType<typeof listEvidence>>[number];

const PLATFORMS = [
  { value: 'telegram', label: 'Telegram' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'other', label: 'Lainnya' },
];

export default function VaultPage() {
  const { triage } = useSession();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSecured, setJustSecured] = useState(false);

  const [mode, setMode] = useState<'url' | 'screenshot'>('url');
  const [sourceUrl, setSourceUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [platform, setPlatform] = useState<string>(triage.platform ?? '');
  const [description, setDescription] = useState('');
  const [foundAt, setFoundAt] = useState('');

  useEffect(() => {
    (async () => {
      try {
        await ensureSession();
        setRows(await listEvidence());
      } catch {
        setError('Belum bisa membuka brankas kamu. Coba lagi sebentar lagi.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleAdd() {
    setError(null);
    setAdding(true);
    const wasEmpty = rows.length === 0;
    try {
      if (mode === 'url') {
        await addEvidence({
          kind: 'url',
          sourceUrl: sourceUrl.trim(),
          platform: platform || undefined,
          description: description.trim() || undefined,
          foundAt: foundAt || undefined,
        });
      } else {
        for (const file of files) {
          await addEvidence({
            kind: 'screenshot',
            file,
            platform: platform || undefined,
            description: description.trim() || undefined,
            foundAt: foundAt || undefined,
          });
        }
      }
      setRows(await listEvidence());
      setSourceUrl('');
      setFiles([]);
      setDescription('');
      if (wasEmpty) setJustSecured(true);
    } catch {
      setError('Bukti kamu belum tersimpan. Tidak ada yang hilang — coba tekan simpan lagi.');
    } finally {
      setAdding(false);
    }
  }

  const canSubmit = mode === 'url' ? sourceUrl.trim().length > 0 : files.length > 0;

  if (justSecured) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col justify-center py-16">
          <div className="mb-8 h-px w-12 bg-[color:var(--mist)]" />
          <Title>Bukti kamu aman.</Title>
          <Lede>
            Kamu tidak perlu membukanya lagi. Sidik digitalnya sudah dihitung di HP kamu, sebelum
            apa pun sampai ke server kami.
          </Lede>
          <div className="mt-10 space-y-3">
            <Button onClick={() => setJustSecured(false)}>Lihat brankas</Button>
            <Button href="/takedown" variant="quiet">
              Lanjut susun laporan
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell back={{ href: '/dashboard', label: 'Beranda' }} step="Brankas bukti">
      <Title>Brankas bukti</Title>
      <Lede>
        Simpan jejaknya sekarang, selagi masih ada. Konten seperti ini sering dihapus atau
        dipindahkan — dan bukti yang hilang tidak bisa dikembalikan.
      </Lede>

      <section className="mt-8 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-[color:var(--night)] p-1">
          {(['url', 'screenshot'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-3 text-[14px] transition-colors ${
                mode === m
                  ? 'bg-[color:var(--surface-2)] text-[color:var(--warm)]'
                  : 'text-[color:var(--muted)]'
              }`}
            >
              {m === 'url' ? 'Tempel tautan' : 'Unggah tangkapan layar'}
            </button>
          ))}
        </div>

        {mode === 'url' ? (
          <div key="mode-url">
            <label htmlFor="url" className="block text-[13px] text-[color:var(--muted)]">
              Tautan tempat kamu melihatnya
            </label>
            <input
              id="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              inputMode="url"
              placeholder="https://…"
              className="mt-2 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--night)] px-4 py-4 font-mono text-[13px] text-[color:var(--warm)] placeholder:text-[#5b7183] focus:border-[color:var(--mist)] focus:outline-none"
            />
            <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--muted)]">
              Kami tidak membuka tautannya. Yang tersimpan hanya alamatnya.
            </p>
          </div>
        ) : (
          <div key="mode-screenshot">
            <label
              htmlFor="files"
              className="flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--line)] bg-[color:var(--night)] px-4 py-6 text-center"
            >
              <span className="text-[14px] text-[color:var(--warm)]">
                {files.length > 0
                  ? `${files.length} tangkapan layar dipilih`
                  : 'Pilih tangkapan layar'}
              </span>
              <span className="mt-1.5 text-[12px] text-[color:var(--muted)]">
                Bisa lebih dari satu. Pratinjaunya akan tertutup.
              </span>
            </label>
            <input
              id="files"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </div>
        )}

        <details className="mt-5">
          <summary className="cursor-pointer list-none text-[13px] text-[color:var(--mist)]">
            Tambah keterangan (boleh dilewati) →
          </summary>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-[13px] text-[color:var(--muted)]">Platform</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(platform === p.value ? '' : p.value)}
                    className={`rounded-lg border px-3 py-2.5 text-[13px] transition-colors ${
                      platform === p.value
                        ? 'border-[color:var(--mist)] bg-[color:var(--surface-2)] text-[color:var(--warm)]'
                        : 'border-[color:var(--line)] text-[color:var(--muted)]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="desc" className="block text-[13px] text-[color:var(--muted)]">
                Catatan singkat untuk kamu sendiri
              </label>
              <input
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="mis. dikirim teman lewat DM"
                className="mt-2 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--night)] px-4 py-3.5 text-[14px] text-[color:var(--warm)] placeholder:text-[#5b7183] focus:border-[color:var(--mist)] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="found" className="block text-[13px] text-[color:var(--muted)]">
                Kapan kamu menemukannya
              </label>
              <input
                id="found"
                type="date"
                value={foundAt}
                onChange={(e) => setFoundAt(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--night)] px-4 py-3.5 text-[14px] text-[color:var(--warm)] focus:border-[color:var(--mist)] focus:outline-none"
              />
            </div>
          </div>
        </details>

        <div className="mt-6">
          <Button onClick={handleAdd} disabled={!canSubmit || adding}>
            {adding ? 'Mengamankan…' : 'Amankan bukti ini'}
          </Button>
        </div>

        {error && (
          <p className="mt-4 text-[13px] leading-relaxed text-[color:var(--fill)]">{error}</p>
        )}
      </section>

      <div className="mt-6">
        <Notice>
          Sidik digital dihitung di HP kamu sebelum apa pun terkirim. Ini memperkuat integritas
          bukti — bukan pemeriksaan forensik resmi.
        </Notice>
      </div>

      <section className="mt-10">
        {loading ? (
          <p className="text-[14px] text-[color:var(--muted)]">Membuka brankas…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-[color:var(--line)] px-6 py-12 text-center">
            <p className="font-display text-[19px] leading-snug text-[color:var(--warm)]">
              Brankas kamu masih kosong.
            </p>
            <p className="mx-auto mt-3 max-w-[300px] text-[14px] leading-relaxed text-[color:var(--muted)]">
              Satu tautan atau satu tangkapan layar sudah cukup untuk memulai. Kamu bisa berhenti
              kapan pun.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)]">
                {rows.length} bukti tersimpan
              </h2>
              <Link href="/sertifikat" className="text-[13px] text-[color:var(--mist)]">
                Buat sertifikat →
              </Link>
            </div>
            <div className="space-y-4">
              {rows.map((row) => (
                <EvidenceCard key={row.id} evidence={row} />
              ))}
            </div>
          </>
        )}
      </section>
    </Shell>
  );
}