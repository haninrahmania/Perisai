# Perisai — Panduan untuk Claude

Platform pertahanan digital untuk korban KBGO (kekerasan berbasis gender online) di Indonesia,
khususnya deepfake porn dan NCII. GarudaHacks 7.0, Safety track.

**Bahasa percakapan: Indonesia.** Kode dan komentar: Inggris.

---

## Persona

**Maya, 21, mahasiswi.** Wajahnya dipakai di video deepfake yang beredar di Telegram. Panik.
Mungkin memakai HP yang bisa diambil pelakunya. Setiap keputusan UI diuji terhadap dia — bukan
terhadap juri, bukan terhadap kerapian arsitektur.

---

## Prinsip non-negotiable

Ini bukan preferensi. Melanggarnya membatalkan produknya.

1. **Blur-first.** Konten selalu tertutup secara default. Korban tidak perlu melihatnya lagi.
2. **Korban tidak perlu menyimpan konten** di galeri atau device-nya.
3. **Anonymous-first.** Tanpa nama, tanpa email, tanpa akun. Sesi anonim Supabase.
4. **Copy trauma-informed, Bahasa Indonesia.** Tidak melabeli ("Victim"), tidak menyalahkan,
   tidak mendramatisir.
5. **Tidak ada klaim hukum palsu.** Pakai "memperkuat integritas bukti" — BUKAN "sah secara
   hukum" atau "bukti forensik resmi".
6. **Tenang, bukan alarm.** Hindari merah panik. Hindari styling pink "for women".
7. **Perisai tidak pernah mengirim apa pun.** Kami menyusun naskah; Maya yang menekan kirim.

### Keputusan yang mengikuti dari prinsip di atas

- **Data identitas TIDAK disimpan.** NIK/nama/alamat diisi di browser, masuk ke teks surat saja.
  Tidak ke `ctx`, tidak ke `/api/takedown`, tidak ke Supabase. Hilang saat pindah halaman.
- **`saveReport` menyimpan surat MENTAH** (placeholder `[Nama Lengkap Pelapor]` utuh), bukan
  versi terisi. Setelah refresh, surat kembali tapi field NIK kosong. Ini disengaja.
- **Otomatisasi form (Playwright/Puppeteer) DITOLAK.** Melanggar prinsip 7, memaksa NIK ke
  server, dan laporan adalah pernyataan hukum atas nama Maya. Ganti dengan "salin lalu buka".
- **`mailto:`, bukan Gmail hardcoded.** Buka app email default; jangan asumsikan akun mana yang
  login.

---

## Temuan lapangan (terverifikasi)

- **aduankonten.id TIDAK meminta NIK, nama, atau identitas apa pun.** Alurnya: URL di halaman
  depan → form dengan Kandungan Konten (dropdown), Alasan (min. 20 huruf), Unggah Tangkapan
  Layar (wajib, maks 5MB). Kategori yang relevan: **Pornografi**.
- **Hanya laporan polisi yang butuh identitas.** `NEEDS_IDENTITY = ['police_chronology']`.
- **Telegram**: email ke `abuse@telegram.org`.
- **Polisi**: naskah dicetak dan dibawa ke SPKT. Tidak dikirim online.

⚠️ **Nomor darurat di `/triage` (110, SAPA 129, dll) BELUM diverifikasi.** Nomor salah = harm
nyata. Jangan tambah nomor baru tanpa verifikasi.

---

## Stack

- Next.js 16.2.10, App Router, Turbopack, **tanpa `src/`**
- TypeScript, alias `@/*` dari root
- **Tailwind v4** — `globals.css` HARUS `@import "tailwindcss";`, bukan tiga baris `@tailwind`
- Supabase (anon session), Vercel
- Mobile-first, 375px

## Design tokens (`app/globals.css`)

Plus `.shield-veil` (blur 22px, reveal via `data-revealed`), `.shield-grid`, `.font-display`
(Georgia serif).

**Jangan pakai Fraunces** — `axes: ['SOFT']` + `weight` bentrok di `next/font`.

---

## Batas kepemilikan

**JANGAN SENTUH** — milik Hanin (backend):


Kalau ada masalah di sana, **laporkan ke user — jangan perbaiki sendiri.**

**Lane frontend (boleh diubah):**

---

## Konvensi

- **Conventional commits**: `feat(scope):`, `fix(scope):`, `chore(scope):`
- **Navigasi back**: `<Shell back="auto">` (pakai `router.back()`) karena alur bercabang.
  Dashboard tanpa back — dia hub. Triage hardcode ke `/`.
- **Konfirmasi destruktif**: `ConfirmDialog`, bukan browser `confirm()`.
- **Tombol hapus**: warna `--muted`, hover `--fill`. Tidak merah.
- **Toast**: konfirmasi kecil, hilang sendiri, tanpa undo (undo tidak ada).
- **Layar penuh "Bukti kamu aman"** hanya untuk bukti PERTAMA. Berikutnya pakai Toast — momen
  reassurance tidak boleh diulang sampai kehilangan makna.

---

## Jebakan yang sudah pernah kena

- **File kosong.** Error "The default export is not a React Component" hampir selalu berarti
  paste tidak tersimpan. Verifikasi: `grep -c "export default function X" path`.
- **Tag JSX kepotong saat paste.** Tulis `<a href="..." className="...">` dalam SATU baris —
  `<a` yang berdiri sendiri di baris terpisah sering hilang.
- **Controlled/uncontrolled input** saat ganti mode: tambahkan `key="mode-url"` /
  `key="mode-screenshot"`.
- **Hydration mismatch `cz-shortcut-listen`**: itu ekstensi ColorZilla, bukan bug.
  `suppressHydrationWarning` di `<body>` sudah terpasang.
- **Duplikat key dari URL**: `addEvidence` bisa menyimpan URL identik. Dedupe dengan `Set`
  sebelum di-render.

---

## Cara kerja yang diharapkan

- **Angkat konflik sebelum membangun.** Kalau permintaan user bertabrakan dengan prinsip di
  atas, katakan dulu, jelaskan kenapa, tawarkan alternatif. Jangan diam-diam kompromi.
- **File utuh, bukan diff**, kecuali diminta. User meng-copy-paste ke VS Code.
- **Sebutkan directory** setiap kali membuat atau menimpa file.
- **Jangan tambah dependency** tanpa alasan kuat. Jam 24 = feature freeze.

