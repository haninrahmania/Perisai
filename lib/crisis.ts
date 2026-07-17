export type CrisisKind = 'physical_danger' | 'self_harm' | null;

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

export const EMERGENCY = {
  physical_danger: [
    { name: 'Polisi / Darurat', contact: '110', note: 'Jika kamu dalam bahaya sekarang.' },
    { name: 'SAPA 129 (Kemen PPPA)', contact: '129', note: 'Layanan pengaduan kekerasan perempuan & anak.' },
  ],
  self_harm: [
    {
      name: 'Healing119 Kementerian Kesehatan',
      contact: '119 ekstensi 8 / healing119.id',
      note: 'Pertolongan pertama psikologis untuk krisis dan pikiran bunuh diri.',
    },
    {
      name: 'Fasilitas kesehatan terdekat',
      contact: 'Puskesmas / IGD rumah sakit',
      note: 'Cari pertolongan langsung jika tidak dapat terhubung atau dalam bahaya segera.',
    },
  ],
};
