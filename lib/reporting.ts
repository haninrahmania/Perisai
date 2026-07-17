export const REPORT_TARGETS = [
  'telegram',
  'instagram',
  'x',
  'tiktok',
  'komdigi',
  'police_chronology',
] as const;

export type TakedownTarget = (typeof REPORT_TARGETS)[number];
export type ReportTarget = TakedownTarget;

export const REPORT_STATUSES = [
  'draft',
  'sent',
  'in_review',
  'taken_down',
  'rejected',
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  draft: 'Belum dikirim',
  sent: 'Sudah dilaporkan',
  in_review: 'Menunggu respons',
  taken_down: 'Konten dihapus',
  rejected: 'Ditolak',
};

export type PlatformTarget = Extract<
  TakedownTarget,
  'telegram' | 'instagram' | 'x' | 'tiktok'
>;

export type Platform = PlatformTarget | 'other';

export type OfficialDestination = {
  kind: 'mailto' | 'url';
  href: string;
  label: string;
  userControlled: true;
};

export type ReportTargetMetadata = {
  label: string;
  language: 'en' | 'id';
  requiresIdentity: boolean;
  handoff: string;
  destination: OfficialDestination | null;
};

export const REPORT_TARGET_METADATA: Readonly<
  Record<TakedownTarget, ReportTargetMetadata>
> = {
  telegram: {
    label: 'Telegram',
    language: 'en',
    requiresIdentity: false,
    handoff: 'Kirim lewat aplikasi emailmu sendiri ke tim penyalahgunaan Telegram.',
    destination: {
      kind: 'mailto',
      href: 'mailto:abuse@telegram.org',
      label: 'Email Telegram Abuse',
      userControlled: true,
    },
  },
  instagram: {
    label: 'Instagram',
    language: 'en',
    requiresIdentity: false,
    handoff: 'Salin naskah lalu ikuti formulir pelaporan resmi Instagram.',
    destination: {
      kind: 'url',
      href: 'https://www.facebook.com/help/instagram/1769410010008691/',
      label: 'Instagram Help Center',
      userControlled: true,
    },
  },
  x: {
    label: 'X',
    language: 'en',
    requiresIdentity: false,
    handoff: 'Salin naskah lalu ikuti panduan pelaporan media intim di X.',
    destination: {
      kind: 'url',
      href: 'https://help.x.com/en/rules-and-policies/intimate-media',
      label: 'X intimate media policy',
      userControlled: true,
    },
  },
  tiktok: {
    label: 'TikTok',
    language: 'en',
    requiresIdentity: false,
    handoff: 'Salin naskah lalu ikuti panduan pelaporan resmi TikTok.',
    destination: {
      kind: 'url',
      href: 'https://www.tiktok.com/safety/en/reporting',
      label: 'TikTok Safety reporting guidance',
      userControlled: true,
    },
  },
  komdigi: {
    label: 'Komdigi',
    language: 'id',
    requiresIdentity: true,
    handoff: 'Salin naskah lalu isi sendiri formulir aduan resmi AduanKonten.id.',
    destination: {
      kind: 'url',
      href: 'https://aduankonten.id',
      label: 'AduanKonten.id',
      userControlled: true,
    },
  },
  police_chronology: {
    label: 'Kronologi kepolisian',
    language: 'id',
    requiresIdentity: true,
    handoff: 'Cetak atau salin kronologi ini untuk dibawa ke SPKT kantor polisi terdekat.',
    destination: null,
  },
};

/** The case facts used by report generation; identity deliberately stays outside storage. */
export type LocalCase = {
  id: string;
  incident?: 'deepfake' | 'ncii' | 'threat' | 'other';
  firstSeen?: string;
  relationship?: string;
};

/** The persisted evidence fields that may be disclosed in a generated report. */
export type LocalEvidence = {
  id: string;
  caseId: string;
  kind: 'url' | 'file';
  platform: Platform | null;
  sourceUrl: string | null;
  description: string | null;
  sha256: string;
  foundAt: string | null;
  hashedAt: string;
};

const PLATFORM_TARGETS: readonly PlatformTarget[] = [
  'telegram',
  'instagram',
  'x',
  'tiktok',
];

const ENGLISH_PLACEHOLDERS = {
  identity: '[your full name and preferred contact details]',
  incident: '[describe the incident without adding explicit detail]',
  firstSeen: '[date and time first discovered]',
  relationship: '[relationship to the person involved, if known]',
  impact: '[describe the impact in your own words]',
  actions: '[list only actions you have already taken]',
} as const;

const INDONESIAN_PLACEHOLDERS = {
  identity: '[nama lengkap dan kontak yang ingin dicantumkan]',
  incident: '[uraikan kejadian tanpa menambahkan detail eksplisit]',
  firstSeen: '[tanggal dan waktu pertama kali diketahui]',
  relationship: '[hubungan dengan pihak terkait, jika diketahui]',
  impact: '[uraikan dampak yang benar-benar dialami]',
  actions: '[cantumkan hanya tindakan yang sudah dilakukan]',
} as const;

const INCIDENT_TEXT = {
  en: {
    deepfake: 'digitally manipulated intimate content using my likeness without my consent',
    ncii: 'intimate content distributed without my consent',
    threat: 'a threat to distribute intimate content without my consent',
    other: ENGLISH_PLACEHOLDERS.incident,
  },
  id: {
    deepfake: 'konten intim hasil manipulasi digital yang menggunakan wajah saya tanpa persetujuan',
    ncii: 'konten intim yang disebarkan tanpa persetujuan saya',
    threat: 'ancaman untuk menyebarkan konten intim tanpa persetujuan saya',
    other: INDONESIAN_PLACEHOLDERS.incident,
  },
} as const;

function present(value: string | null | undefined, placeholder: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : placeholder;
}

function presentIncident(
  incident: LocalCase['incident'],
  language: keyof typeof INCIDENT_TEXT,
): string {
  return incident ? INCIDENT_TEXT[language][incident] : INCIDENT_TEXT[language].other;
}

function isPlatformTarget(target: TakedownTarget): target is PlatformTarget {
  return (PLATFORM_TARGETS as readonly TakedownTarget[]).includes(target);
}

export function eligibleEvidenceForTarget(
  target: TakedownTarget,
  evidence: LocalEvidence,
): boolean {
  return !isPlatformTarget(target) || evidence.platform === target;
}

export function availableTargets(evidence: readonly LocalEvidence[]): TakedownTarget[] {
  return REPORT_TARGETS.filter((target) =>
    evidence.some((item) => eligibleEvidenceForTarget(target, item)),
  );
}

function englishEvidenceList(evidence: readonly LocalEvidence[]): string {
  return evidence
    .map((item, index) => {
      const lines = [
        `${index + 1}. Evidence ID: ${item.id}`,
        `   Type: ${item.kind}`,
        `   Platform: ${item.platform ?? '[platform not recorded]'}`,
        `   Source URL: ${present(item.sourceUrl, '[source URL not recorded; attach the local file separately]')}`,
        `   SHA-256: ${item.sha256}`,
        `   Found at: ${present(item.foundAt, '[discovery time not recorded]')}`,
        `   Hashed at: ${item.hashedAt}`,
      ];
      if (item.description?.trim()) lines.push(`   Description: ${item.description.trim()}`);
      return lines.join('\n');
    })
    .join('\n');
}

function indonesianEvidenceList(evidence: readonly LocalEvidence[]): string {
  return evidence
    .map((item, index) => {
      const lines = [
        `${index + 1}. ID bukti: ${item.id}`,
        `   Jenis: ${item.kind}`,
        `   Platform: ${item.platform ?? '[platform belum dicatat]'}`,
        `   Tautan sumber: ${present(item.sourceUrl, '[tautan sumber belum dicatat; lampirkan berkas lokal secara terpisah]')}`,
        `   SHA-256: ${item.sha256}`,
        `   Waktu ditemukan: ${present(item.foundAt, '[waktu ditemukan belum dicatat]')}`,
        `   Waktu hashing: ${item.hashedAt}`,
      ];
      if (item.description?.trim()) lines.push(`   Deskripsi: ${item.description.trim()}`);
      return lines.join('\n');
    })
    .join('\n');
}

function generatePlatformReport(
  localCase: LocalCase,
  target: PlatformTarget,
  evidence: readonly LocalEvidence[],
): string {
  const platform = REPORT_TARGET_METADATA[target].label;
  const telegramRecipient = target === 'telegram' ? 'To: abuse@telegram.org\n' : '';

  return `${telegramRecipient}Subject: Request for review of reported material on ${platform}

Reporter identity: ${ENGLISH_PLACEHOLDERS.identity}
Incident: ${presentIncident(localCase.incident, 'en')}
First discovered: ${present(localCase.firstSeen, ENGLISH_PLACEHOLDERS.firstSeen)}
Relationship to the person involved: ${present(localCase.relationship, ENGLISH_PLACEHOLDERS.relationship)}
Impact: ${ENGLISH_PLACEHOLDERS.impact}
Actions already taken: ${ENGLISH_PLACEHOLDERS.actions}

Evidence selected for this report:
${englishEvidenceList(evidence)}

Request:
Please review the selected material and the account or channel responsible. If your review finds a violation, please remove the material, prevent further distribution where your procedures allow, and provide a written outcome through the contact details supplied above.`;
}

function generateKomdigiReport(
  localCase: LocalCase,
  evidence: readonly LocalEvidence[],
): string {
  return `ADUAN KONTEN KEPADA KOMDIGI

Identitas pelapor: ${INDONESIAN_PLACEHOLDERS.identity}
Uraian kejadian: ${presentIncident(localCase.incident, 'id')}
Pertama kali diketahui: ${present(localCase.firstSeen, INDONESIAN_PLACEHOLDERS.firstSeen)}
Hubungan dengan pihak terkait: ${present(localCase.relationship, INDONESIAN_PLACEHOLDERS.relationship)}
Dampak: ${INDONESIAN_PLACEHOLDERS.impact}
Tindakan yang sudah dilakukan: ${INDONESIAN_PLACEHOLDERS.actions}

Bukti yang dipilih untuk aduan ini:
${indonesianEvidenceList(evidence)}

Permohonan:
Mohon lakukan pemeriksaan atas konten yang dilaporkan. Apabila hasil pemeriksaan menemukan pelanggaran, mohon tindak lanjuti sesuai kewenangan Komdigi dan sampaikan hasilnya melalui kontak pelapor di atas.`;
}

function generatePoliceChronology(
  localCase: LocalCase,
  evidence: readonly LocalEvidence[],
): string {
  return `KRONOLOGI UNTUK LAPORAN KEPOLISIAN

Identitas pelapor: ${INDONESIAN_PLACEHOLDERS.identity}

1. Waktu pertama mengetahui kejadian:
${present(localCase.firstSeen, INDONESIAN_PLACEHOLDERS.firstSeen)}

2. Uraian kejadian:
${presentIncident(localCase.incident, 'id')}

3. Hubungan dengan pihak terkait:
${present(localCase.relationship, INDONESIAN_PLACEHOLDERS.relationship)}

4. Tindakan yang sudah dilakukan:
${INDONESIAN_PLACEHOLDERS.actions}

5. Dampak yang dialami:
${INDONESIAN_PLACEHOLDERS.impact}

Daftar bukti yang dipilih:
${indonesianEvidenceList(evidence)}`;
}

export function generateReport(input: {
  case: LocalCase;
  target: TakedownTarget;
  evidence: readonly LocalEvidence[];
}): string {
  const { case: localCase, target, evidence } = input;

  if (evidence.length === 0) {
    throw new Error('Pilih setidaknya satu bukti untuk membuat laporan.');
  }

  if (evidence.some((item) => item.caseId !== localCase.id)) {
    throw new Error('Semua bukti harus berasal dari kasus yang sedang dibuka.');
  }

  if (evidence.some((item) => !eligibleEvidenceForTarget(target, item))) {
    throw new Error(`Bukti yang dipilih tidak dapat digunakan untuk tujuan ${target}.`);
  }

  if (isPlatformTarget(target)) {
    return generatePlatformReport(localCase, target, evidence);
  }

  return target === 'komdigi'
    ? generateKomdigiReport(localCase, evidence)
    : generatePoliceChronology(localCase, evidence);
}
