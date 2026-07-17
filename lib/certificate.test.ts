import { describe, expect, it } from 'vitest';

import {
  buildCertificateModel,
  buildCertificateText,
} from './certificate';
import type { CaseRecord, EvidenceRecord } from './case-store';

const activeCase: CaseRecord = {
  id: 'case-1',
  reference: 'PRS-2026-001',
  title: 'Kasus uji',
  createdAt: '2026-07-17T03:04:05.000Z',
  updatedAt: '2026-07-17T03:04:05.000Z',
};

const selectedEvidence: EvidenceRecord[] = [
  {
    id: 'evidence-url',
    caseId: 'case-1',
    kind: 'url',
    blob: null,
    sha256: 'a'.repeat(64),
    sourceUrl: 'https://example.test/post/123',
    fileName: null,
    mediaType: null,
    size: null,
    platform: 'instagram',
    description: 'Tautan unggahan',
    foundAt: '2026-07-16T12:00:00.000Z',
    hashedAt: '2026-07-16T12:05:00.000Z',
    createdAt: '2026-07-16T12:05:00.000Z',
  },
  {
    id: 'evidence-file',
    caseId: 'case-1',
    kind: 'file',
    blob: new Blob(['raw evidence']),
    sha256: 'b'.repeat(64),
    sourceUrl: null,
    fileName: 'capture.png',
    mediaType: 'image/png',
    size: 12,
    platform: null,
    description: null,
    foundAt: null,
    hashedAt: '2026-07-16T12:06:00.000Z',
    createdAt: '2026-07-16T12:06:00.000Z',
  },
];

describe('buildCertificateModel', () => {
  it('builds a deterministic manifest from the passed case timestamp and selected evidence', () => {
    const first = buildCertificateModel(activeCase, selectedEvidence);
    const second = buildCertificateModel(activeCase, selectedEvidence);

    expect(second).toEqual(first);
    expect(first).toMatchObject({
      caseReference: 'PRS-2026-001',
      caseCreatedAt: '2026-07-17T03:04:05.000Z',
      evidenceCount: 2,
      entries: [
        {
          evidenceId: 'evidence-url',
          hashScope: 'normalized-url-string',
          source: 'https://example.test/post/123',
          hashedAt: '2026-07-16T12:05:00.000Z',
        },
        {
          evidenceId: 'evidence-file',
          hashScope: 'raw-file-bytes',
          source: 'capture.png',
          hashedAt: '2026-07-16T12:06:00.000Z',
        },
      ],
    });
  });

  it('rejects an empty evidence selection', () => {
    expect(() => buildCertificateModel(activeCase, [])).toThrow(
      'Pilih setidaknya satu bukti untuk membuat PDF.',
    );
  });

  it('rejects evidence from another case', () => {
    const crossCase = [{ ...selectedEvidence[0], caseId: 'case-2' }];

    expect(() => buildCertificateModel(activeCase, crossCase)).toThrow(
      'Semua bukti harus berasal dari kasus yang sedang dibuka.',
    );
  });

  it('does not copy identity fields into the manifest', () => {
    const caseWithIdentity = {
      ...activeCase,
      victimName: 'RAHASIA PEMILIK KASUS',
      email: 'rahasia@example.test',
    };
    const evidenceWithIdentity = [
      {
        ...selectedEvidence[0],
        reporterName: 'RAHASIA PELAPOR',
      },
    ];

    const text = buildCertificateText(
      buildCertificateModel(caseWithIdentity, evidenceWithIdentity),
    );

    expect(text).not.toContain('RAHASIA');
    expect(text).not.toContain('rahasia@example.test');
  });
});

describe('buildCertificateText', () => {
  it('states the exact hash scopes and honest local-storage limits', () => {
    const text = buildCertificateText(
      buildCertificateModel(activeCase, selectedEvidence),
    );

    expect(text).toContain('URL yang dinormalisasi');
    expect(text).toContain('byte mentah berkas');
    expect(text).toContain('IndexedDB lokal di perangkat ini tidak terenkripsi secara bawaan');
    expect(text).toContain('bukan sertifikasi forensik yang ditandatangani');
    expect(text).toContain('bukan nasihat hukum');
  });
});
