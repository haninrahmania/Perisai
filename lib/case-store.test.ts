import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalCaseStore } from './case-store';

let store: LocalCaseStore;
let databaseName: string;

beforeEach(() => {
  databaseName = `perisai-test-${crypto.randomUUID()}`;
  store = new LocalCaseStore(databaseName);
});

afterEach(async () => {
  await store.deleteDatabase();
});

describe('LocalCaseStore case and evidence ownership', () => {
  it('creates, reopens, switches, and persists incident scope across database instances', async () => {
    const first = await store.createCase({ title: 'Kasus pertama', incident: 'deepfake' });
    await store.updateCase(first.id, {
      platform: 'telegram',
      firstSeen: '2026-07-16',
      relationship: 'tidak dikenal',
    });
    const second = await store.createCase({ title: 'Kasus kedua', incident: 'threat' });

    await store.activateCase(first.id);
    store.close();
    store = new LocalCaseStore(databaseName);

    expect(await store.getActiveCase()).toMatchObject({
      id: first.id,
      incident: 'deepfake',
      platform: 'telegram',
      firstSeen: '2026-07-16',
      relationship: 'tidak dikenal',
    });
    expect((await store.listCases()).map((record) => record.id)).toEqual(
      expect.arrayContaining([first.id, second.id]),
    );
  });

  it('round-trips local file Blobs and hashes URL strings and raw file bytes', async () => {
    const localCase = await store.createCase();
    const url = await store.addUrlEvidence({
      caseId: localCase.id,
      sourceUrl: 'https://example.com/path',
      platform: 'other',
    });
    const file = new File(['private screenshot bytes'], 'screenshot.png', { type: 'image/png' });
    const storedFile = await store.addFileEvidence({
      caseId: localCase.id,
      file,
      platform: 'telegram',
    });

    expect(url.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(storedFile.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(storedFile.sha256).not.toBe(url.sha256);

    const reopened = await store.getEvidence(localCase.id, storedFile.id);
    expect(reopened?.fileName).toBe('screenshot.png');
    expect(await reopened?.blob?.text()).toBe('private screenshot bytes');
  });

  it('deletes derivative reports with evidence and removes every case-owned Blob and record', async () => {
    const localCase = await store.createCase();
    const evidence = await store.addUrlEvidence({
      caseId: localCase.id,
      sourceUrl: 'https://t.me/example/1',
      platform: 'telegram',
    });
    await store.createReportDraft({
      caseId: localCase.id,
      target: 'telegram',
      evidenceIds: [evidence.id],
    });

    await expect(store.deleteEvidence(localCase.id, evidence.id)).resolves.toEqual({
      deletedReports: 1,
    });
    expect(await store.listEvidence(localCase.id)).toEqual([]);
    expect(await store.listReports(localCase.id)).toEqual([]);

    const file = new File(['owned bytes'], 'owned.png', { type: 'image/png' });
    await store.addFileEvidence({ caseId: localCase.id, file });
    await store.deleteCase(localCase.id);
    expect(await store.getCase(localCase.id)).toBeUndefined();
    expect(await store.getActiveCase()).toBeNull();
  });
});

describe('LocalCaseStore report invariants', () => {
  it('rejects cross-case and target-ineligible evidence and resets changed sent drafts', async () => {
    const first = await store.createCase({ incident: 'deepfake' });
    const telegram = await store.addUrlEvidence({
      caseId: first.id,
      sourceUrl: 'https://t.me/example/1',
      platform: 'telegram',
    });
    const second = await store.createCase();
    const instagram = await store.addUrlEvidence({
      caseId: second.id,
      sourceUrl: 'https://instagram.com/p/example',
      platform: 'instagram',
    });

    await expect(
      store.createReportDraft({
        caseId: first.id,
        target: 'telegram',
        evidenceIds: [instagram.id],
      }),
    ).rejects.toThrow('Semua bukti harus berasal dari kasus yang sedang dibuka.');

    await store.createReportDraft({
      caseId: first.id,
      target: 'telegram',
      evidenceIds: [telegram.id],
    });
    await store.updateReportStatus(first.id, 'telegram', 'sent');
    const unchanged = await store.createReportDraft({
      caseId: first.id,
      target: 'telegram',
      evidenceIds: [telegram.id],
    });
    expect(unchanged.status).toBe('sent');

    const secondTelegram = await store.addUrlEvidence({
      caseId: first.id,
      sourceUrl: 'https://t.me/example/2',
      platform: 'telegram',
    });
    const changed = await store.createReportDraft({
      caseId: first.id,
      target: 'telegram',
      evidenceIds: [telegram.id, secondTelegram.id],
    });
    expect(changed.status).toBe('draft');
  });

  it('deletes derivative drafts when a report-affecting case fact changes', async () => {
    const localCase = await store.createCase({ incident: 'deepfake' });
    const evidence = await store.addUrlEvidence({
      caseId: localCase.id,
      sourceUrl: 'https://t.me/example/fact-change',
      platform: 'telegram',
    });
    await store.createReportDraft({
      caseId: localCase.id,
      target: 'telegram',
      evidenceIds: [evidence.id],
    });

    await store.updateCase(localCase.id, { relationship: 'tidak dikenal' });

    expect(await store.listReports(localCase.id)).toEqual([]);
  });
});

describe('LocalCaseStore backup, purge, and offline boundary', () => {
  it('exports and imports a validated plaintext backup including file Blobs', async () => {
    const localCase = await store.createCase({ title: 'Backup case', platform: 'telegram' });
    const file = new File(['backup bytes'], 'backup.png', { type: 'image/png' });
    const evidence = await store.addFileEvidence({
      caseId: localCase.id,
      file,
      platform: 'telegram',
    });
    await store.createReportDraft({
      caseId: localCase.id,
      target: 'telegram',
      evidenceIds: [evidence.id],
    });

    const serialized = await store.exportBackup();
    expect(serialized).toContain('perisai-local-backup');
    expect(serialized).toContain('YmFja3VwIGJ5dGVz');

    await store.purgeEverything();
    await store.importBackup(serialized);
    expect(await store.getActiveCase()).toMatchObject({ id: localCase.id, title: 'Backup case' });
    const [restored] = await store.listEvidence(localCase.id);
    expect(await restored.blob?.text()).toBe('backup bytes');
    expect(await store.listReports(localCase.id)).toHaveLength(1);
  });

  it('leaves existing data intact when an imported backup fails relationship validation', async () => {
    const localCase = await store.createCase({ title: 'Keep me' });
    const serialized = await store.exportBackup();
    const invalid = JSON.parse(serialized) as {
      settings: { activeCaseId: string | null };
    };
    invalid.settings.activeCaseId = 'missing-case';

    await expect(store.importBackup(JSON.stringify(invalid))).rejects.toThrow(
      'Kasus yang terakhir dibuka tidak ditemukan dalam cadangan.',
    );
    expect(await store.getCase(localCase.id)).toMatchObject({ title: 'Keep me' });
  });

  it('rejects tampered backup Blob data before replacing the current vault', async () => {
    const localCase = await store.createCase({ title: 'Untampered' });
    const evidence = await store.addFileEvidence({
      caseId: localCase.id,
      file: new File(['original bytes'], 'proof.bin'),
    });
    const invalid = JSON.parse(await store.exportBackup()) as {
      evidence: Array<{ blobBase64: string | null }>;
    };
    invalid.evidence[0].blobBase64 = btoa('tampered bytes');

    await expect(store.importBackup(JSON.stringify(invalid))).rejects.toThrow(
      'Salah satu file bukti berubah atau rusak dan tidak dapat dipulihkan.',
    );
    expect(await (await store.getEvidence(localCase.id, evidence.id))?.blob?.text()).toBe(
      'original bytes',
    );
  });

  it('runs core storage and generation operations without fetch', async () => {
    const originalFetch = globalThis.fetch;
    const fetchSpy = vi.fn(() => {
      throw new Error('network boundary crossed');
    });
    globalThis.fetch = fetchSpy as typeof fetch;
    try {
      const localCase = await store.createCase({ platform: 'telegram' });
      const evidence = await store.addUrlEvidence({
        caseId: localCase.id,
        sourceUrl: 'https://t.me/example/offline',
        platform: 'telegram',
      });
      await store.createReportDraft({
        caseId: localCase.id,
        target: 'telegram',
        evidenceIds: [evidence.id],
      });
      await store.exportBackup();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('purges all cases, reports, evidence, Blobs, and active settings', async () => {
    const first = await store.createCase();
    await store.addFileEvidence({
      caseId: first.id,
      file: new File(['secret'], 'secret.bin'),
    });
    await store.createCase();

    await store.purgeEverything();

    expect(await store.listCases()).toEqual([]);
    expect(await store.getActiveCase()).toBeNull();
  });
});
