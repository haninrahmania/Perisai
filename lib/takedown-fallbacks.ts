import type { TakedownTarget } from './takedown-prompts';

export const FALLBACKS: Partial<Record<TakedownTarget, string>> = {
  telegram: `Subject: Urgent Report: Non-Consensual Intimate Imagery and Digital Manipulation

To the Telegram Abuse Team,

I am writing to formally report the presence of non-consensual intimate content and digitally manipulated imagery (deepfake) being distributed on your platform. This content features my likeness, which has been fabricated using digital manipulation without my consent.

The distribution of this material constitutes a severe violation of Telegram’s Terms of Service regarding the prohibition of illegal content and the non-consensual sharing of intimate media.

Details of the reported content:
- Location/Channel URL: https://t.me/c/1885043762/412
- Date first discovered: July 14, 2026

I request the immediate removal of the aforementioned content and the permanent suspension of the channel(s) involved in its dissemination. The content in question is a digital fabrication created without my permission, and its continued presence causes ongoing harm.

Evidence provided:
1. Screenshot of the group member list: SHA-256: f16544bb5f3f12ce1d8333869a7f63f8ccd6b6408268a65812a4b72d5335fc2a (Secured: 2026-07-16T12:50:12.243468+00:00)
2. Screenshot of notification from a friend regarding the content: SHA-256: a1a2662d2825ab1ea766d01b9c22455b125f19551d8118d0891b06818050d864 (Secured: 2026-07-16T12:50:11.666337+00:00)
3. Video link (https://t.me/c/1885043762/412): Video manipulation distributed in a Telegram group: SHA-256: ca6884c2ab55004f7d39849294e1acbc453346fd32b48a8893b392a3cb67af5e (Secured: 2026-07-16T12:50:10.304965+00:00)

Please confirm in writing once the content has been removed and the necessary actions have been taken against the responsible parties.

Thank you for your immediate attention to this urgent matter.

Sincerely,

[Your Name]`,

  komdigi: `Identitas Pelapor:
Nama Lengkap: [Nama Lengkap Pelapor]
NIK: [Nomor Induk Kependudukan]
Alamat: [Alamat Lengkap]
Nomor Telepon: [Nomor Telepon]
Email: [Alamat Email]

Uraian Aduan:
Saya melaporkan adanya penyebaran konten manipulasi digital (deepfake) yang menggunakan wajah saya tanpa persetujuan. Konten tersebut pertama kali diketahui keberadaannya pada tanggal 14 Juli 2026 di platform Telegram. Konten ini merupakan fabrikasi yang menggunakan wajah saya melalui manipulasi digital dan bukan merupakan rekaman asli diri saya. Penyebaran konten ini dilakukan tanpa izin dan sangat merugikan martabat serta keamanan saya.

Dasar Aduan:
Konten yang dilaporkan melanggar kesusilaan dan merupakan bentuk Kekerasan Seksual Berbasis Elektronik (KSBE) sebagaimana diatur dalam Undang-Undang Nomor 12 Tahun 2022 tentang Tindak Pidana Kekerasan Seksual (UU TPKS). Selain itu, penyebaran konten ini melanggar ketentuan dalam Undang-Undang Nomor 1 Tahun 2024 tentang Perubahan Kedua atas Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (UU ITE).

Daftar Tautan dan Bukti:
1. Tautan: https://t.me/c/1885043762/412
   Deskripsi: Video manipulasi disebar di grup Telegram, dikirim teman via DM
   SHA-256: ca6884c2ab55004f7d39849294e1acbc453346fd32b48a8893b392a3cb67af5e
   Waktu Diamankan: 2026-07-16T12:50:10.304965+00:00

2. Bukti: Tangkapan layar daftar anggota grup penyebar
   SHA-256: f16544bb5f3f12ce1d8333869a7f63f8ccd6b6408268a65812a4b72d5335fc2a
   Waktu Diamankan: 2026-07-16T12:50:12.243468+00:00

3. Bukti: Tangkapan layar pesan dari teman yang memberi tahu keberadaan konten
   SHA-256: a1a2662d2825ab1ea766d01b9c22455b125f19551d8118d0891b06818050d864
   Waktu Diamankan: 2026-07-16T12:50:11.666337+00:00

Permintaan Pemutusan Akses:
Berdasarkan fakta di atas, saya memohon kepada Kementerian Komunikasi dan Digital untuk segera melakukan pemutusan akses (take down) terhadap tautan tersebut dan memblokir grup Telegram yang menjadi sarana penyebaran konten manipulasi digital yang merugikan saya.`,

  police_chronology: `KRONOLOGI KEJADIAN

Pada tanggal 14 Juli 2026, saya menerima informasi dari seorang teman melalui pesan langsung di platform Telegram mengenai keberadaan konten manipulasi (deepfake) yang menggunakan wajah saya tanpa persetujuan. Konten tersebut disebarkan di sebuah grup Telegram dengan tautan https://t.me/c/1885043762/412.

Terduga pelaku dalam kasus ini adalah mantan pasangan saya.

Langkah-langkah yang telah saya lakukan sebagai upaya pengamanan bukti dan penanganan kejadian adalah sebagai berikut:
1. Melakukan pendokumentasian bukti berupa tangkapan layar pesan dari teman yang memberi tahu keberadaan konten, tangkapan layar daftar anggota grup penyebar, serta tautan video manipulasi tersebut.
2. Melakukan verifikasi integritas bukti dengan nilai hash SHA-256 untuk memastikan keaslian data yang diamankan.
3. [Laporan ke platform: sudah/belum dilakukan pada tanggal ...].

Akibat dari kejadian ini, saya mengalami kerugian berupa [isi deskripsi kerugian yang dialami, misal: tekanan psikologis, gangguan aktivitas sehari-hari, atau kerugian lainnya].

Daftar bukti yang disebutkan di atas telah terlampir secara rinci dalam Sertifikat Bukti Digital.`,
};
