import { describe, expect, it } from 'vitest';
import {
  REPORT_TARGET_METADATA,
  availableTargets,
  eligibleEvidenceForTarget,
  generateReport,
  type LocalCase,
  type LocalEvidence,
} from './reporting';

const localCase: LocalCase = {
  id: 'case-current',
  incident: 'deepfake',
  firstSeen: '2026-07-16T09:00:00+07:00',
};

const telegramEvidence: LocalEvidence = {
  id: 'evidence-telegram',
  caseId: localCase.id,
  kind: 'url',
  platform: 'telegram',
  sourceUrl: 'https://t.me/example/1',
  description: 'Public message link recorded by the reporter.',
  sha256: 'aaa111',
  foundAt: '2026-07-16T09:00:00+07:00',
  hashedAt: '2026-07-16T09:05:00+07:00',
};

const instagramEvidence: LocalEvidence = {
  id: 'evidence-instagram',
  caseId: localCase.id,
  kind: 'file',
  platform: 'instagram',
  sourceUrl: null,
  description: null,
  sha256: 'bbb222',
  foundAt: null,
  hashedAt: '2026-07-16T09:10:00+07:00',
};

describe('report target scope', () => {
  it('restricts platform targets while allowing explicit evidence for cross-platform reports', () => {
    expect(eligibleEvidenceForTarget('telegram', telegramEvidence)).toBe(true);
    expect(eligibleEvidenceForTarget('telegram', instagramEvidence)).toBe(false);
    expect(eligibleEvidenceForTarget('komdigi', instagramEvidence)).toBe(true);
    expect(eligibleEvidenceForTarget('police_chronology', telegramEvidence)).toBe(true);

    expect(availableTargets([instagramEvidence, telegramEvidence])).toEqual([
      'telegram',
      'instagram',
      'komdigi',
      'police_chronology',
    ]);
  });

  it('exposes only official user-controlled destinations', () => {
    expect(REPORT_TARGET_METADATA.telegram.destination?.href).toBe(
      'mailto:abuse@telegram.org',
    );
    expect(REPORT_TARGET_METADATA.instagram.destination?.href).toBe(
      'https://www.facebook.com/help/instagram/1769410010008691/',
    );
    expect(REPORT_TARGET_METADATA.x.destination?.href).toBe(
      'https://help.x.com/en/rules-and-policies/intimate-media',
    );
    expect(REPORT_TARGET_METADATA.tiktok.destination?.href).toBe(
      'https://www.tiktok.com/safety/en/reporting',
    );
    expect(REPORT_TARGET_METADATA.komdigi.destination?.href).toBe(
      'https://aduankonten.id',
    );
    expect(REPORT_TARGET_METADATA.police_chronology.destination).toBeNull();
  });
});

describe('generateReport', () => {
  it('is deterministic and includes only supplied case and evidence facts', () => {
    const input = {
      case: localCase,
      target: 'telegram' as const,
      evidence: [telegramEvidence],
    };

    const first = generateReport(input);
    const second = generateReport(input);

    expect(first).toBe(second);
    expect(first).toContain('digitally manipulated intimate content');
    expect(first).toContain(telegramEvidence.sourceUrl);
    expect(first).toContain(telegramEvidence.sha256);
  });

  it('rejects empty, cross-case, and target-ineligible evidence selections', () => {
    expect(() =>
      generateReport({ case: localCase, target: 'telegram', evidence: [] }),
    ).toThrow('Pilih setidaknya satu bukti untuk membuat laporan.');

    expect(() =>
      generateReport({
        case: localCase,
        target: 'komdigi',
        evidence: [{ ...telegramEvidence, caseId: 'case-other' }],
      }),
    ).toThrow('Semua bukti harus berasal dari kasus yang sedang dibuka.');

    expect(() =>
      generateReport({
        case: localCase,
        target: 'instagram',
        evidence: [telegramEvidence],
      }),
    ).toThrow('Bukti yang dipilih tidak dapat digunakan untuk tujuan instagram.');
  });

  it('uses placeholders for missing identity, impact, actions, and other absent facts', () => {
    const report = generateReport({
      case: { id: localCase.id },
      target: 'police_chronology',
      evidence: [instagramEvidence],
    });

    expect(report).toContain('[nama lengkap dan kontak yang ingin dicantumkan]');
    expect(report).toContain('[uraikan dampak yang benar-benar dialami]');
    expect(report).toContain('[cantumkan hanya tindakan yang sudah dilakukan]');
    expect(report).toContain('[tanggal dan waktu pertama kali diketahui]');
    expect(report).toContain('[uraikan kejadian tanpa menambahkan detail eksplisit]');
  });

  it('contains no seeded Maya facts when they were not supplied', () => {
    const report = generateReport({
      case: { id: localCase.id },
      target: 'komdigi',
      evidence: [instagramEvidence],
    });

    expect(report).not.toMatch(/Maya|Putri|viralindo|mantan bernama Raka/i);
    expect(report).not.toContain('t.me/viralindo/12345');
  });
});
