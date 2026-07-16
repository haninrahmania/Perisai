import { jsPDF } from 'jspdf';

type EvidenceRow = {
  id: string;
  kind: 'url' | 'screenshot';
  source_url: string | null;
  storage_path: string | null;
  sha256: string;
  platform: string | null;
  description: string | null;
  found_at: string | null;
  hashed_at: string;
};

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('id-ID', {
        dateStyle: 'long',
        timeStyle: 'medium',
        timeZone: 'Asia/Jakarta',
      }) + ' WIB'
    : '—';

export function generateCertificate(rows: EvidenceRow[], caseRef: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const M = 18;              // margin
  const W = 210 - M * 2;     // usable width
  let y = M;

  const line = (text: string, size = 10, style: 'normal' | 'bold' = 'normal', gap = 5) => {
    doc.setFont('helvetica', style).setFontSize(size);
    for (const l of doc.splitTextToSize(text, W)) {
      if (y > 275) { doc.addPage(); y = M; }
      doc.text(l, M, y);
      y += gap;
    }
  };

  // Header
  line('SERTIFIKAT BUKTI DIGITAL', 16, 'bold', 7);
  line('Perisai — Perlindungan Digital dari Kekerasan Berbasis AI', 10, 'normal', 6);
  doc.setDrawColor(200).line(M, y, M + W, y);
  y += 8;

  line(`Nomor referensi kasus : ${caseRef}`, 10);
  line(`Dokumen dibuat        : ${fmt(new Date().toISOString())}`, 10);
  line(`Jumlah bukti          : ${rows.length}`, 10, 'normal', 9);

  // Evidence entries
  rows.forEach((r, i) => {
    if (y > 240) { doc.addPage(); y = M; }
    line(`BUKTI #${i + 1}`, 11, 'bold', 6);
    line(`Jenis          : ${r.kind === 'url' ? 'Tautan (URL)' : 'Tangkapan layar'}`);
    line(`Platform       : ${r.platform ?? '—'}`);
    if (r.source_url) line(`Sumber         : ${r.source_url}`);
    line(`Deskripsi      : ${r.description ?? '—'}`);
    line(`Ditemukan pada : ${fmt(r.found_at)}`);
    line(`Diamankan pada : ${fmt(r.hashed_at)}`);

    doc.setFont('courier', 'normal').setFontSize(8);
    const label = 'SHA-256       : ';
    const half = r.sha256.slice(0, 32);
    doc.text(label + half, M, y); y += 4;
    doc.text(' '.repeat(label.length) + r.sha256.slice(32), M, y); y += 8;
  });

  // Integrity statement — this is the talking point, in the artifact
  if (y > 225) { doc.addPage(); y = M; }
  doc.setDrawColor(200).line(M, y, M + W, y);
  y += 8;
  line('PERNYATAAN INTEGRITAS', 11, 'bold', 6);
  line(
    'Nilai hash SHA-256 di atas dihitung sepenuhnya di perangkat pelapor (client-side) ' +
    'sebelum data dikirim ke server mana pun. Setiap perubahan sekecil apa pun pada berkas ' +
    'atau tautan asli akan menghasilkan nilai hash yang berbeda, sehingga daftar ini dapat ' +
    'digunakan untuk memverifikasi bahwa bukti tidak berubah sejak waktu pengamanan di atas.',
    9, 'normal', 4.5,
  );
  y += 3;
  line(
    'Dokumen ini disusun untuk memperkuat integritas dan kronologi bukti, dan bukan merupakan ' +
    'hasil pemeriksaan forensik digital resmi maupun nasihat hukum. Perisai tidak menyimpan ' +
    'konten eksplisit dalam bentuk yang dapat diputar; hanya metadata, nilai hash, dan berkas ' +
    'terenkripsi milik pelapor pada penyimpanan privat.',
    9, 'normal', 4.5,
  );

  doc.save(`Sertifikat-Bukti-Perisai-${caseRef}.pdf`);
}