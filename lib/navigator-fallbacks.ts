/**
 * Hand-written fallbacks for when the model is unavailable.
 * These are served ONLY from the catch path in /api/navigator — never in place of a live answer.
 * Every entry must obey NAVIGATOR_SYSTEM: no UU 44/2008, no verdict prediction,
 * deepfake = fabrication, no blame, offer options.
 */

export const NAVIGATOR_FALLBACKS = {
  generic: `Maaf, aku lagi tidak bisa menjawab dengan baik sekarang — ada gangguan teknis di sisiku.

Perisai adalah pendamping untuk korban Kekerasan Berbasis Gender Online. Kalau kamu korban: bukti kamu tetap aman tersimpan, dan surat laporan kamu masih bisa dibuka dan disalin dari halaman Laporan.

Kalau kamu butuh orang sungguhan untuk menemani, ini beberapa yang menangani kasus seperti ini setiap hari:
- LBH APIK Jakarta — bantuan hukum untuk perempuan korban kekerasan
- SAFEnet — pendampingan kasus kekerasan berbasis gender online
- Komnas Perempuan — pengaduan dan rujukan

Sebelum menghubungi, siapkan kronologi singkat dan daftar bukti kamu.`,

  hukuman: `Iya, penyebaran konten seperti ini bisa diproses secara hukum di Indonesia — kamu tidak sedang mengada-ada.

Yang paling relevan untuk kasus kamu adalah UU TPKS (UU No. 12 Tahun 2022), khususnya Pasal 14 tentang kekerasan seksual berbasis elektronik. Intinya: menyebarkan konten bermuatan seksual tanpa persetujuan orang di dalamnya itu tindak pidana. Kalau kontennya hasil manipulasi, itu tetap masuk — yang disebar tetap tanpa persetujuan kamu.

Tapi aku tidak bisa memprediksi bagaimana kasusnya akan berjalan atau hukuman apa yang keluar — itu bukan wewenangku, dan siapa pun yang menjanjikan itu sedang menebak.

Kalau kamu mau, langkah paling berguna sekarang adalah bicara dengan LBH APIK. Mereka mendampingi kasus seperti ini secara gratis, dan mereka bisa menilai kasusmu secara spesifik. Bawa kronologi dan daftar bukti dari Perisai — itu sudah lebih siap daripada kebanyakan orang yang datang ke sana.

Aku pendamping informasi, bukan pengacara — jadi keputusan hukumnya tetap sebaiknya lewat mereka.`,

  takut_dipidana: `Ketakutan itu masuk akal, dan kamu tidak berlebihan. Banyak korban punya kekhawatiran yang sama.

Yang penting kamu tahu: UU TPKS dibuat justru untuk melindungi korban dalam situasi seperti ini. Pasal 14 menempatkan penyebar konten tanpa persetujuan sebagai pelaku — bukan orang yang ada di dalam kontennya. Dan kalau kontennya hasil manipulasi, konten itu fabrikasi yang memakai wajah kamu — bukan rekaman kamu.

Karena kekhawatiran ini nyata dan pernah terjadi pada orang lain, cara paling aman adalah tidak menghadapi pelaporan sendirian. LBH APIK dan SAFEnet mendampingi korban justru supaya proses ini tidak berbalik arah.

Kalau kamu mau, kamu bisa hubungi mereka dulu sebelum memutuskan lapor atau tidak. Kamu tidak harus memutuskan sekarang.`,

  keaslian_konten: `Aku tidak bisa menilai apakah sebuah konten asli atau hasil manipulasi — dan aku tidak mau menebak, karena tebakanku bisa merugikan kamu.

Yang bisa aku bilang: dari sisi hukum, pertanyaan itu bukan yang paling menentukan. Yang jadi persoalan adalah kontennya disebarkan tanpa persetujuan kamu. Itu berlaku baik untuk konten asli maupun hasil manipulasi.

Kalau soal keaslian jadi penting di kasus kamu, itu wilayah pemeriksaan forensik digital — dan itu ranah penyidik, bukan aku. Pendamping seperti LBH APIK bisa bantu kamu memahami kapan hal itu perlu.`,

  pendamping: `Ini beberapa lembaga yang benar-benar menangani kasus seperti ini:

- **LBH APIK Jakarta** — bantuan hukum gratis untuk perempuan korban kekerasan. Ini biasanya titik awal terbaik kalau kamu mempertimbangkan jalur hukum.
- **SAFEnet** — fokus pada kasus digital dan kekerasan berbasis gender online. Kuat untuk urusan takedown dan platform.
- **Komnas Perempuan** — pengaduan dan rujukan ke layanan lain.
- Kalau kamu mahasiswa, kampus kamu kemungkinan punya layanan psikologi gratis — itu terpisah dari jalur hukum, dan kamu boleh pakai keduanya.

Yang perlu disiapkan sebelum menghubungi: kronologi kejadian dan daftar bukti. Dua-duanya sudah ada di Perisai — kamu tinggal bawa.

Aku tidak menyimpan nomor mereka di sini karena aku tidak mau salah kasih kontak. Cari lewat situs resmi mereka, atau minta pendampingan lewat kanal Komnas Perempuan.`,
};

type FallbackKey = keyof typeof NAVIGATOR_FALLBACKS;

const MATCHERS: [FallbackKey, string[]][] = [
  ['takut_dipidana', ['takut dipidana', 'malah aku yang', 'balik nyalahin', 'aku yang kena', 'takut dilaporin balik', 'dituntut balik']],
  ['keaslian_konten', ['asli apa engga', 'asli atau palsu', 'beneran apa engga', 'itu asli', 'cara deteksi']],
  ['hukuman', ['dihukum', 'dipenjara', 'pasal', 'bisa dituntut', 'jerat hukum', 'lapor polisi bisa']],
  ['pendamping', ['pendamping', 'lbh', 'komnas', 'safenet', 'siapa yang bisa bantu', 'minta bantuan siapa']],
];

const norm = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');

/** Best-effort match for the catch path only. Falls back to generic. */
export function matchFallback(text: string): string {
  const t = norm(text);
  for (const [key, phrases] of MATCHERS) {
    if (phrases.some((p) => t.includes(p))) return NAVIGATOR_FALLBACKS[key];
  }
  return NAVIGATOR_FALLBACKS.generic;
}