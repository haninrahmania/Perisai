import type { TakedownTarget } from './takedown-prompts';

export const FALLBACKS: Partial<Record<TakedownTarget, string>> = {
  telegram: `Subject: Urgent Report: Non-Consensual Intimate Imagery and Digital Manipulation

To the Telegram Abuse Team,

I am writing to formally report the presence of non-consensual intimate content and digital manipulation (deepfake) involving my likeness, which is being distributed on your platform without my consent. This content is a fabrication created using digital manipulation and does not represent real footage of me.

The content was first identified on July 14, 2026. The distribution of this material constitutes a severe violation of Telegram’s Terms of Service regarding the prohibition of illegal content and the non-consensual sharing of intimate imagery.

I request the immediate removal of the following content and the permanent suspension of the associated channel/group involved in this malicious activity:

URL: https://t.me/c/1885043762/412

Below is the list of evidence I have secured regarding this incident:

1. Evidence Type: Screenshot
Description: Tangkapan layar daftar anggota grup penyebar
SHA-256: 5df62f031e06f4e3ff775eb576d5b423fdff3e9740bd216c10366b118d61f44f

2. Evidence Type: Screenshot
Description: Tangkapan layar pesan dari teman yang memberi tahu keberadaan konten
SHA-256: a1a2662d2825ab1ea766d01b9c22455b125f19551d8118d0891b06818050d864

3. Evidence Type: URL
Description: Video manipulasi disebar di grup Telegram, dikirim teman via DM
SHA-256: ca6884c2ab55004f7d39849294e1acbc453346fd32b48a8893b392a3cb67af5e

I urge you to take swift action to prevent further harm and protect my safety. Please confirm in writing once the content has been removed and the necessary enforcement actions have been taken against the responsible parties.

Thank you for your immediate attention to this urgent matter.`,

  komdigi: `Identitas Pelapor:
Nama Lengkap: [Nama Lengkap Pelapor]
NIK: [Nomor Induk Kependudukan]
Alamat: [Alamat Domisili]
Nomor Telepon: [Nomor Telepon]
Email: [Alamat Email]

Uraian Aduan:
Pada tanggal 14 Juli 2026, saya mengetahui adanya penyebaran konten intim non-konsensual dalam bentuk konten manipulasi (deepfake) yang menggunakan wajah saya tanpa persetujuan saya. Konten tersebut merupakan hasil fabrikasi menggunakan manipulasi digital dan bukan merupakan rekaman asli diri saya. Konten ini disebarluaskan melalui platform Telegram oleh pihak yang saya duga merupakan mantan pasangan saya. Tindakan ini telah menyebabkan kerugian psikis yang mendalam serta pelanggaran berat terhadap privasi dan keamanan diri saya.

Dasar Aduan:
Tindakan penyebaran konten ini merupakan pelanggaran terhadap:
1. Pasal 14 ayat (1) huruf a UU No. 12 Tahun 2022 tentang Tindak Pidana Kekerasan Seksual (UU TPKS), yang mengatur mengenai kekerasan seksual berbasis elektronik.
2. Pasal 27A jo. Pasal 45 ayat (4) UU No. 1 Tahun 2024 tentang Perubahan Kedua atas UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (UU ITE), mengenai penyebaran konten yang melanggar kesusilaan.

Daftar Tautan dan Bukti:
1. URL: https://t.me/c/1885043762/412
   Deskripsi: Video manipulasi disebar di grup Telegram, dikirim teman via DM
   SHA-256: ca6884c2ab55004f7d39849294e1acbc453346fd32b48a8893b392a3cb67af5e
   Waktu Diamankan: 2026-07-16T18:54:22.74747+00:00

2. Bukti: Tangkapan layar daftar anggota grup penyebar
   SHA-256: 5df62f031e06f4e3ff775eb576d5b423fdff3e9740bd216c10366b118d61f44f
   Waktu Diamankan: 2026-07-16T18:54:26.051694+00:00

3. Bukti: Tangkapan layar pesan dari teman yang memberi tahu keberadaan konten
   SHA-256: a1a2662d2825ab1ea766d01b9c22455b125f19551d8118d0891b06818050d864
   Waktu Diamankan: 2026-07-16T18:54:25.606824+00:00

Permintaan Pemutusan Akses:
Berdasarkan uraian di atas, saya memohon kepada pihak Komdigi untuk segera melakukan pemutusan akses (takedown) terhadap tautan konten tersebut di atas dan melakukan penelusuran lebih lanjut terhadap akun-akun yang terlibat dalam penyebaran konten manipulasi tersebut demi mencegah kerugian yang lebih luas.`,

  police_chronology: `KRONOLOGI KEJADIAN

Pada tanggal 14 Juli 2026, saya menerima informasi dari seorang teman mengenai keberadaan konten manipulasi (deepfake) yang menggunakan wajah saya tanpa persetujuan di platform Telegram. Konten tersebut merupakan fabrikasi yang dibuat menggunakan manipulasi digital.

Kejadian ini bermula ketika teman saya mengirimkan pesan melalui fitur pesan langsung (DM) di Telegram yang berisi tautan menuju sebuah grup di platform tersebut. Di dalam grup tersebut, ditemukan konten manipulasi digital yang disebarkan tanpa seizin saya. Terduga pelaku dalam kasus ini adalah mantan pasangan saya.

Terkait langkah yang telah diambil untuk pengamanan bukti, saya telah melakukan pendokumentasian dan verifikasi bukti digital sebagai berikut:

1. Tangkapan layar pesan dari teman yang memberi tahu keberadaan konten (SHA-256: a1a2662d2825ab1ea766d01b9c22455b125f19551d8118d0891b06818050d864, diamankan pada 16 Juli 2026 pukul 18:54:25).
2. Video manipulasi yang disebar di grup Telegram (SHA-256: ca6884c2ab55004f7d39849294e1acbc453346fd32b48a8893b392a3cb67af5e, diamankan pada 16 Juli 2026 pukul 18:54:22).
3. Tangkapan layar daftar anggota grup penyebar (SHA-256: 5df62f031e06f4e3ff775eb576d5b423fdff3e9740bd216c10366b118d61f44f, diamankan pada 16 Juli 2026 pukul 18:54:26).

Terkait laporan ke platform, [laporan ke platform: sudah/belum dilakukan pada tanggal ...].

Akibat dari penyebaran konten manipulasi ini, saya mengalami dampak sebagai berikut: [isi kerugian yang dialami].

Daftar bukti selengkapnya terlampir dalam Sertifikat Bukti Digital.`,
};
