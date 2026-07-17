import { jsPDF } from 'jspdf';
import type { CaseRecord, EvidenceRecord } from './case-store';

export type CertificateEntry = {
  number: number;
  evidenceId: string;
  kind: 'url' | 'file';
  source: string;
  platform: string | null;
  description: string | null;
  foundAt: string | null;
  hashedAt: string;
  sha256: string;
  hashScope: 'normalized-url-string' | 'raw-file-bytes';
};

export type CertificateModel = {
  title: string;
  caseReference: string;
  caseCreatedAt: string;
  evidenceCount: number;
  entries: CertificateEntry[];
  integrityStatements: string[];
  privacyStatements: string[];
  disclaimer: string;
};

const URL_HASH_STATEMENT =
  'Untuk bukti URL, SHA-256 mencakup string URL yang dinormalisasi ' +
  '(teks URL, bukan konten pada alamat tujuan).';
const FILE_HASH_STATEMENT =
  'Untuk bukti berkas, SHA-256 mencakup byte mentah berkas.';
const LOCAL_STORAGE_STATEMENT =
  'IndexedDB lokal di perangkat ini tidak terenkripsi secara bawaan. Siapa pun yang ' +
  'memiliki akses ke profil peramban atau perangkat yang ' +
  'terbuka mungkin dapat membacanya.';
const RECOVERY_STATEMENT =
  'Menghapus data situs, kehilangan perangkat, atau kehilangan profil peramban dapat ' +
  'menghilangkan data tanpa cadangan yang diekspor.';
const DISCLAIMER =
  'Dokumen ini adalah manifest bukti lokal, bukan sertifikasi forensik yang ditandatangani, ' +
  'bukan penetapan keaslian atau kepemilikan, dan bukan nasihat hukum.';

/**
 * Builds the complete certificate domain value without reading the clock, browser state,
 * persistence, or network. Only explicitly listed manifest fields are copied.
 */
export function buildCertificateModel(
  activeCase: CaseRecord,
  selectedEvidence: readonly EvidenceRecord[],
): CertificateModel {
  if (selectedEvidence.length === 0) {
    throw new Error('Pilih setidaknya satu bukti untuk membuat PDF.');
  }

  if (selectedEvidence.some((evidence) => evidence.caseId !== activeCase.id)) {
    throw new Error('Semua bukti harus berasal dari kasus yang sedang dibuka.');
  }

  const entries = selectedEvidence.map<CertificateEntry>((evidence, index) => {
    const isUrl = evidence.kind === 'url';

    return {
      number: index + 1,
      evidenceId: evidence.id,
      kind: isUrl ? 'url' : 'file',
      source: isUrl
        ? (evidence.sourceUrl ?? 'URL tidak dicatat')
        : (evidence.fileName ?? 'Berkas lokal'),
      platform: evidence.platform ?? null,
      description: evidence.description ?? null,
      foundAt: evidence.foundAt,
      hashedAt: evidence.hashedAt,
      sha256: evidence.sha256,
      hashScope: isUrl ? 'normalized-url-string' : 'raw-file-bytes',
    };
  });

  return {
    title: 'MANIFEST BUKTI DIGITAL',
    caseReference: activeCase.reference,
    caseCreatedAt: activeCase.createdAt,
    evidenceCount: entries.length,
    entries,
    integrityStatements: [URL_HASH_STATEMENT, FILE_HASH_STATEMENT],
    privacyStatements: [LOCAL_STORAGE_STATEMENT, RECOVERY_STATEMENT],
    disclaimer: DISCLAIMER,
  };
}

/** Produces the canonical, deterministic plain-text representation of a certificate model. */
export function buildCertificateText(model: CertificateModel): string {
  const lines = [
    model.title,
    'Perisai — manifest lokal bukti digital',
    '',
    `Nomor referensi kasus: ${model.caseReference}`,
    `Kasus dibuat: ${model.caseCreatedAt}`,
    `Jumlah bukti: ${model.evidenceCount}`,
  ];

  for (const entry of model.entries) {
    lines.push(
      '',
      `BUKTI #${entry.number}`,
      `ID bukti: ${entry.evidenceId}`,
      `Jenis: ${entry.kind === 'url' ? 'URL' : 'Berkas'}`,
      `Sumber: ${entry.source}`,
      `Platform: ${entry.platform ?? '—'}`,
      `Deskripsi: ${entry.description ?? '—'}`,
      `Ditemukan pada: ${entry.foundAt ?? '—'}`,
      `Hash dihitung pada: ${entry.hashedAt}`,
      `Cakupan hash: ${
        entry.hashScope === 'normalized-url-string'
          ? 'string URL yang dinormalisasi'
          : 'byte mentah berkas'
      }`,
      `SHA-256: ${entry.sha256}`,
    );
  }

  lines.push(
    '',
    'BATAS INTEGRITAS',
    ...model.integrityStatements,
    '',
    'PRIVASI DAN PEMULIHAN',
    ...model.privacyStatements,
    '',
    'BATAS DOKUMEN',
    model.disclaimer,
  );

  return lines.join('\n');
}

function safeFileName(reference: string): string {
  const safeReference = reference.replace(/[^a-zA-Z0-9_-]+/g, '-');
  return `Manifest-Bukti-Perisai-${safeReference || 'kasus'}.pdf`;
}

/** Browser-only rendering and download boundary. */
export function downloadCertificate(model: CertificateModel): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 18;
  const width = 210 - margin * 2;
  let y = margin;

  for (const textLine of buildCertificateText(model).split('\n')) {
    const isHeading =
      textLine === model.title ||
      textLine.startsWith('BUKTI #') ||
      textLine === 'BATAS INTEGRITAS' ||
      textLine === 'PRIVASI DAN PEMULIHAN' ||
      textLine === 'BATAS DOKUMEN';
    const fontSize = textLine === model.title ? 16 : isHeading ? 11 : 9;
    const gap = textLine === '' ? 3 : fontSize >= 11 ? 6 : 4.5;

    doc.setFont('helvetica', isHeading ? 'bold' : 'normal').setFontSize(fontSize);
    const wrappedLines = textLine === '' ? [''] : doc.splitTextToSize(textLine, width);

    for (const wrappedLine of wrappedLines) {
      if (y > 277) {
        doc.addPage();
        y = margin;
      }
      if (wrappedLine) doc.text(wrappedLine, margin, y);
      y += gap;
    }
  }

  doc.save(safeFileName(model.caseReference));
}

/** Convenience browser boundary for callers that already hold the scoped domain records. */
export function generateCertificate(
  activeCase: CaseRecord,
  selectedEvidence: readonly EvidenceRecord[],
): void {
  downloadCertificate(buildCertificateModel(activeCase, selectedEvidence));
}
