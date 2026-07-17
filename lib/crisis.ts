export type CrisisKind = 'physical_danger' | 'self_harm' | null;

export type EmergencyContact = {
  name: string;
  contact: string;
  note: string;
  href?: string;
  actionLabel?: string;
};

const SELF_HARM_RE = [
  /bunuh diri/, /ingin mati/, /pengen mati/, /pgn mati/, /mau mati aja/,
  /mengakhiri hidup/, /(gak|nggak|ga|tidak|engga|enggak) (sanggup|kuat|mau) hidup/,
  /(menyakiti|nyakitin|lukai) diri/, /lebih baik (aku )?mati/,
  /(gak|nggak|ga|tidak) ada gunanya hidup/, /capek hidup/, /pengen ngilang/,
];

const DANGER_RE = [
  /bunuh/, /dibunuh/, /bacok/, /tikam/,
  /ancam/, /mengancam/, /diancam/, /ngancem/,
  /(bawa|pegang) (pisau|senjata|golok)/,
  /(mau|akan|bakal) (nyakitin|nyerang|mukul|datang ke rumah)/,
  /(dia|pelaku) (di depan|di rumah|datang|nungguin)/,
  /(dipukul|dianiaya|dikurung|ditahan|dikejar)/,
];

const norm = (s: string) =>
  s.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

export function detectCrisis(text: string): CrisisKind {
  const t = norm(text);
  if (SELF_HARM_RE.some((r) => r.test(t))) return 'self_harm';   // MUST stay first
  if (DANGER_RE.some((r) => r.test(t))) return 'physical_danger';
  return null;
}

export const EMERGENCY: Record<Exclude<CrisisKind, null>, readonly EmergencyContact[]> = {
  physical_danger: [
    {
      name: 'Polisi 110',
      contact: '110',
      href: 'tel:110',
      actionLabel: 'Telepon 110',
      note: 'Untuk ancaman atau kekerasan yang sedang terjadi dan membutuhkan bantuan polisi segera. Panggilan ini gratis.',
    },
    {
      name: 'SAPA 129 Kementerian PPPA',
      contact: '129 · WhatsApp 08111-129-129',
      href: 'https://laporsapa129.kemenpppa.go.id/',
      actionLabel: 'Buka pilihan SAPA 129',
      note: 'Untuk melaporkan kekerasan terhadap perempuan atau anak dan mendapat arahan perlindungan serta pendampingan.',
    },
    {
      name: 'Komnas Perempuan',
      contact: 'Pengaduan dan rujukan layanan',
      href: 'https://komnasperempuan.go.id/',
      actionLabel: 'Buka situs Komnas Perempuan',
      note: 'Untuk mencatat pengaduan kekerasan terhadap perempuan dan meminta rujukan. Bukan layanan darurat atau pendampingan langsung.',
    },
    {
      name: 'LBH APIK Jakarta',
      contact: 'Pengaduan bantuan hukum',
      href: 'https://www.lbhapik.org/pengaduan',
      actionLabel: 'Buka pengaduan LBH APIK',
      note: 'Bantuan hukum gratis bagi perempuan pencari keadilan di DKI Jakarta dan sekitarnya. Bukan layanan darurat.',
    },
  ],
  self_harm: [
    {
      name: 'Healing119 Kementerian Kesehatan',
      contact: '119 ekstensi 8 / healing119.id',
      href: 'tel:119',
      actionLabel: 'Telepon 119',
      note: 'Pertolongan pertama psikologis untuk krisis dan pikiran bunuh diri.',
    },
    {
      name: 'Fasilitas kesehatan terdekat',
      contact: 'Puskesmas / IGD rumah sakit',
      note: 'Cari pertolongan langsung jika tidak dapat terhubung atau dalam bahaya segera.',
    },
  ],
};
