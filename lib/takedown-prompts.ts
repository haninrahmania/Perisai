export type TakedownTarget = 'telegram' | 'instagram' | 'x' | 'tiktok' | 'komdigi' | 'police_chronology';

export const TARGET_LABEL: Record<TakedownTarget, string> = {
  telegram: 'Laporan ke Telegram',
  instagram: 'Laporan ke Instagram',
  x: 'Laporan ke X (Twitter)',
  tiktok: 'Laporan ke TikTok',
  komdigi: 'Aduan ke Komdigi (aduankonten.id)',
  police_chronology: 'Kronologi untuk Laporan Polisi',
};

const BASE = `Kamu membantu korban Kekerasan Berbasis Gender Online (KBGO) di Indonesia menyusun dokumen pelaporan.

ATURAN MUTLAK:
- Tulis dalam Bahasa Indonesia yang jelas dan formal, tapi tidak berbelit.
- JANGAN pernah mendeskripsikan isi konten eksplisit secara detail. Cukup rujuk sebagai "konten intim non-konsensual" atau "konten manipulasi (deepfake)".
- JANGAN menyalahkan atau mempertanyakan korban.
- JANGAN mengarang fakta. Jika informasi tidak tersedia, gunakan placeholder dalam kurung siku, mis. [tanggal kejadian].
- JANGAN menyatakan konten tersebut "milik" atau "berasal dari" pelapor. Untuk kasus
manipulasi (deepfake), konten tersebut adalah fabrikasi yang menggunakan wajah pelapor —
nyatakan secara eksplisit bahwa konten dibuat menggunakan manipulasi digital tanpa
persetujuan, bukan rekaman asli pelapor.
- Gunakan deskripsi bukti PERSIS seperti yang diberikan. JANGAN mengarang atau menebak isi
sebuah bukti. Jika deskripsi tidak tersedia, tulis "tangkapan layar (deskripsi belum diisi)".
- Keluarkan HANYA isi dokumen. Tanpa preamble, tanpa penjelasan, tanpa markdown fence.`;

const TARGET_INSTRUCTIONS: Record<TakedownTarget, string> = {
  telegram: `Tulis dalam BAHASA INGGRIS — tim penyalahgunaan Telegram memproses laporan dalam bahasa Inggris.
  Susun laporan penyalahgunaan untuk dikirim ke abuse@telegram.org / @notoscam.
Sertakan: identifikasi channel/pesan, sifat pelanggaran (NCII/deepfake tanpa persetujuan), rujukan ke Terms of Service Telegram tentang konten ilegal, permintaan takedown dan pemblokiran, daftar bukti (hash SHA-256), dan permintaan konfirmasi tertulis.`,
  instagram: `Susun laporan untuk kanal Instagram/Meta.
Rujuk kebijakan Community Standards tentang Adult Sexual Exploitation dan konten manipulasi. Nyatakan bahwa pelapor adalah orang yang wajahnya digunakan tanpa persetujuan.`,
  x: `Susun laporan untuk X.
Rujuk kebijakan Non-Consensual Nudity dan Synthetic and Manipulated Media. Nyatakan status pelapor sebagai korban yang teridentifikasi dalam konten.`,
  tiktok: `Susun laporan untuk TikTok.
Rujuk Community Guidelines tentang Sexual Exploitation dan Synthetic Media. Minta penghapusan dan tindakan terhadap akun pengunggah.`,
  komdigi: `Susun aduan konten untuk kanal resmi Komdigi (aduankonten.id).
Format: identitas pelapor (placeholder), uraian aduan, dasar aduan (konten melanggar kesusilaan dan merupakan kekerasan seksual berbasis elektronik), daftar tautan dan bukti, permintaan pemutusan akses.
JANGAN mengutip UU No. 44 Tahun 2008 tentang Pornografi. Instrumen ini secara historis digunakan untuk mengkriminalisasi korban NCII. Rujuk HANYA pada UU TPKS (kekerasan seksual berbasis elektronik) dan UU ITE.
JANGAN menyatakan konten tersebut "milik" atau "berasal dari" pelapor. Untuk kasus
manipulasi (deepfake), konten tersebut adalah fabrikasi yang menggunakan wajah pelapor —
nyatakan secara eksplisit bahwa konten dibuat menggunakan manipulasi digital tanpa
persetujuan, bukan rekaman asli pelapor.`,
  police_chronology: `Susun KRONOLOGI KEJADIAN untuk dilampirkan pada laporan kepolisian.
Format naratif berurutan waktu, faktual, tanpa opini. Cantumkan: kapan korban mengetahui, dari siapa, di platform mana, langkah yang sudah diambil (pengamanan bukti dengan hash SHA-256, laporan ke platform), dan kerugian yang dialami secara umum.
Akhiri dengan catatan bahwa daftar bukti terlampir dalam Sertifikat Bukti Digital.
JANGAN menuliskan pasal atau kualifikasi hukum — itu wewenang penyidik.
JANGAN menyatakan suatu tindakan telah dilakukan kecuali tercantum eksplisit dalam konteks. Untuk langkah yang belum dikonfirmasi, gunakan placeholder, mis. [laporan ke platform: sudah/belum dilakukan pada tanggal ...]. Untuk dampak yang dialami korban, gunakan placeholder agar korban mengisinya sendiri — jangan mengarang deskripsi kerugian psikologis.`,
};

export function buildPrompt(target: TakedownTarget, ctx: {
  platform?: string;
  firstSeen?: string;
  relationship?: string;      // 'mantan pasangan' | 'tidak dikenal' | ...
  evidence: { sha256: string; source_url: string | null; hashed_at: string; kind: string; description: string | null }[];
}) {
  const evidenceList = ctx.evidence
    .map((e, i) =>
      `${i + 1}. [${e.kind}] ${e.source_url ?? '(tangkapan layar)'}` +
      ` — deskripsi: ${e.description ?? '(tidak ada deskripsi)'}` +
      ` — SHA-256: ${e.sha256} — diamankan: ${e.hashed_at}`)
    .join('\n');

  return {
    system: `${BASE}\n\nTUGAS SPESIFIK:\n${TARGET_INSTRUCTIONS[target]}`,
    user: `Konteks kasus:
- Platform tempat konten ditemukan: ${ctx.platform ?? '[belum diisi]'}
- Pertama kali diketahui: ${ctx.firstSeen ?? '[belum diisi]'}
- Hubungan dengan terduga pelaku: ${ctx.relationship ?? 'tidak diketahui'}

Daftar bukti yang sudah diamankan:
${evidenceList || '(belum ada bukti tercatat)'}

Susun dokumennya sekarang.`,
  };
}