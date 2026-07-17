import Dexie, { type Table } from 'dexie';
import { hashFile, hashText } from './hash';
import {
  eligibleEvidenceForTarget,
  generateReport,
  type ReportStatus,
  type TakedownTarget,
} from './reporting';

export type IncidentKind = 'deepfake' | 'ncii' | 'threat' | 'other';
export type Platform = 'telegram' | 'instagram' | 'x' | 'tiktok' | 'other';

export type CaseRecord = {
  id: string;
  reference: string;
  title: string;
  incident?: IncidentKind;
  platform?: Platform;
  firstSeen?: string;
  relationship?: string;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceRecord = {
  id: string;
  caseId: string;
  kind: 'url' | 'file';
  sourceUrl: string | null;
  blob: Blob | null;
  fileName: string | null;
  mediaType: string | null;
  size: number | null;
  sha256: string;
  platform: Platform | null;
  description: string | null;
  foundAt: string | null;
  hashedAt: string;
  createdAt: string;
};

export type ReportRecord = {
  id: string;
  caseId: string;
  target: TakedownTarget;
  status: ReportStatus;
  content: string;
  evidenceIds: string[];
  createdAt: string;
  updatedAt: string;
};

type SettingsRecord = {
  id: 'settings';
  activeCaseId: string | null;
};

type BackupEvidence = Omit<EvidenceRecord, 'blob'> & { blobBase64: string | null };

export type PerisaiBackup = {
  format: 'perisai-local-backup';
  version: 1;
  exportedAt: string;
  cases: CaseRecord[];
  evidence: BackupEvidence[];
  reports: ReportRecord[];
  settings: SettingsRecord;
};

class PerisaiDatabase extends Dexie {
  cases!: Table<CaseRecord, string>;
  evidence!: Table<EvidenceRecord, string>;
  reports!: Table<ReportRecord, string>;
  settings!: Table<SettingsRecord, 'settings'>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      cases: 'id, updatedAt',
      evidence: 'id, caseId, [caseId+platform], createdAt',
      reports: 'id, caseId, [caseId+target], updatedAt',
      settings: 'id',
    });
  }
}

const DATABASE_NAME = 'perisai-local-vault';

const nowIso = () => new Date().toISOString();

function nullableText(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeUrl(raw: string): string {
  const url = new URL(raw.trim());
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Gunakan tautan yang dimulai dengan http:// atau https://.');
  }
  return url.toString();
}

function reportId(caseId: string, target: TakedownTarget) {
  return `${caseId}:${target}`;
}

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export class LocalCaseStore {
  private readonly database: PerisaiDatabase;

  constructor(databaseName = DATABASE_NAME) {
    this.database = new PerisaiDatabase(databaseName);
  }

  async createCase(input: {
    title?: string;
    incident?: IncidentKind;
    platform?: Platform;
  } = {}): Promise<CaseRecord> {
    const timestamp = nowIso();
    const id = crypto.randomUUID();
    const record: CaseRecord = {
      id,
      reference: `PRS-${id.slice(0, 8).toUpperCase()}`,
      title: input.title?.trim() || 'Kasus tanpa judul',
      incident: input.incident,
      platform: input.platform,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.database.transaction('rw', this.database.cases, this.database.settings, async () => {
      await this.database.cases.add(record);
      await this.database.settings.put({ id: 'settings', activeCaseId: id });
    });
    return record;
  }

  async listCases(): Promise<CaseRecord[]> {
    return this.database.cases.orderBy('updatedAt').reverse().toArray();
  }

  async getCase(caseId: string): Promise<CaseRecord | undefined> {
    return this.database.cases.get(caseId);
  }

  async activateCase(caseId: string): Promise<CaseRecord> {
    const record = await this.requireCase(caseId);
    await this.database.settings.put({ id: 'settings', activeCaseId: caseId });
    return record;
  }

  async getActiveCase(): Promise<CaseRecord | null> {
    const settings = await this.database.settings.get('settings');
    if (!settings?.activeCaseId) return null;
    const record = await this.database.cases.get(settings.activeCaseId);
    if (record) return record;
    await this.database.settings.put({ id: 'settings', activeCaseId: null });
    return null;
  }

  async updateCase(
    caseId: string,
    patch: Partial<Pick<CaseRecord, 'title' | 'incident' | 'platform' | 'firstSeen' | 'relationship'>>,
  ): Promise<CaseRecord> {
    const current = await this.requireCase(caseId);
    const relationship =
      patch.relationship === undefined ? current.relationship : patch.relationship.trim() || undefined;
    const updated: CaseRecord = {
      ...current,
      ...patch,
      title: patch.title?.trim() || current.title,
      relationship,
      updatedAt: nowIso(),
    };
    const reportFactsChanged =
      (patch.incident !== undefined && patch.incident !== current.incident) ||
      (patch.firstSeen !== undefined && patch.firstSeen !== current.firstSeen) ||
      (patch.relationship !== undefined && relationship !== current.relationship);
    await this.database.transaction('rw', [this.database.cases, this.database.reports], async () => {
      await this.database.cases.put(updated);
      if (reportFactsChanged) {
        await this.database.reports.where('caseId').equals(caseId).delete();
      }
    });
    return updated;
  }

  async deleteCase(caseId: string): Promise<void> {
    await this.database.transaction(
      'rw',
      [this.database.cases, this.database.evidence, this.database.reports, this.database.settings],
      async () => {
        await this.requireCase(caseId);
        await this.database.evidence.where('caseId').equals(caseId).delete();
        await this.database.reports.where('caseId').equals(caseId).delete();
        await this.database.cases.delete(caseId);
        const settings = await this.database.settings.get('settings');
        if (settings?.activeCaseId === caseId) {
          await this.database.settings.put({ id: 'settings', activeCaseId: null });
        }
      },
    );
  }

  async addUrlEvidence(input: {
    caseId: string;
    sourceUrl: string;
    platform?: Platform;
    description?: string;
    foundAt?: string;
  }): Promise<EvidenceRecord> {
    await this.requireCase(input.caseId);
    const sourceUrl = normalizeUrl(input.sourceUrl);
    const timestamp = nowIso();
    const record: EvidenceRecord = {
      id: crypto.randomUUID(),
      caseId: input.caseId,
      kind: 'url',
      sourceUrl,
      blob: null,
      fileName: null,
      mediaType: null,
      size: null,
      sha256: await hashText(sourceUrl),
      platform: input.platform ?? null,
      description: nullableText(input.description),
      foundAt: input.foundAt || null,
      hashedAt: timestamp,
      createdAt: timestamp,
    };
    await this.database.transaction('rw', [this.database.cases, this.database.evidence], async () => {
      await this.database.evidence.add(record);
      await this.touchCase(input.caseId, timestamp);
    });
    return record;
  }

  async addFileEvidence(input: {
    caseId: string;
    file: File;
    platform?: Platform;
    description?: string;
    foundAt?: string;
  }): Promise<EvidenceRecord> {
    await this.requireCase(input.caseId);
    if (input.file.size === 0) throw new Error('File yang dipilih kosong. Pilih file lain.');
    const timestamp = nowIso();
    const record: EvidenceRecord = {
      id: crypto.randomUUID(),
      caseId: input.caseId,
      kind: 'file',
      sourceUrl: null,
      blob: input.file,
      fileName: input.file.name,
      mediaType: input.file.type || 'application/octet-stream',
      size: input.file.size,
      sha256: await hashFile(input.file),
      platform: input.platform ?? null,
      description: nullableText(input.description),
      foundAt: input.foundAt || null,
      hashedAt: timestamp,
      createdAt: timestamp,
    };
    await this.database.transaction('rw', [this.database.cases, this.database.evidence], async () => {
      await this.database.evidence.add(record);
      await this.touchCase(input.caseId, timestamp);
    });
    return record;
  }

  async listEvidence(caseId: string): Promise<EvidenceRecord[]> {
    await this.requireCase(caseId);
    const records = await this.database.evidence.where('caseId').equals(caseId).toArray();
    return records.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async getEvidence(caseId: string, evidenceId: string): Promise<EvidenceRecord | undefined> {
    const record = await this.database.evidence.get(evidenceId);
    return record?.caseId === caseId ? record : undefined;
  }

  async deleteEvidence(caseId: string, evidenceId: string): Promise<{ deletedReports: number }> {
    return this.database.transaction(
      'rw',
      [this.database.evidence, this.database.reports],
      async () => {
        const record = await this.database.evidence.get(evidenceId);
        if (!record || record.caseId !== caseId) throw new Error('Bukti tidak ditemukan dalam kasus ini.');
        const reports = await this.database.reports.where('caseId').equals(caseId).toArray();
        const affected = reports.filter((report) => report.evidenceIds.includes(evidenceId));
        await this.database.reports.bulkDelete(affected.map((report) => report.id));
        await this.database.evidence.delete(evidenceId);
        return { deletedReports: affected.length };
      },
    );
  }

  async listReports(caseId: string): Promise<ReportRecord[]> {
    await this.requireCase(caseId);
    return this.database.reports.where('caseId').equals(caseId).toArray();
  }

  async createReportDraft(input: {
    caseId: string;
    target: TakedownTarget;
    evidenceIds: string[];
  }): Promise<ReportRecord> {
    return this.database.transaction(
      'rw',
      [this.database.cases, this.database.evidence, this.database.reports],
      async () => {
        const caseRecord = await this.requireCase(input.caseId);
        const evidence = await this.database.evidence.bulkGet(input.evidenceIds);
        if (
          input.evidenceIds.length === 0 ||
          new Set(input.evidenceIds).size !== input.evidenceIds.length ||
          evidence.some((record) => !record)
        ) {
          throw new Error('Pilih setidaknya satu bukti untuk membuat laporan.');
        }
        const selected = evidence as EvidenceRecord[];
        if (selected.some((record) => record.caseId !== caseRecord.id)) {
          throw new Error('Semua bukti harus berasal dari kasus yang sedang dibuka.');
        }
        if (selected.some((record) => !eligibleEvidenceForTarget(input.target, record))) {
          throw new Error('Salah satu bukti tidak dapat digunakan untuk tujuan laporan ini.');
        }

        const id = reportId(input.caseId, input.target);
        const existing = await this.database.reports.get(id);
        const timestamp = nowIso();
        const content = generateReport({
          case: caseRecord,
          target: input.target,
          evidence: selected,
        });
        const unchanged =
          existing?.content === content && sameIds(existing.evidenceIds, input.evidenceIds);
        const record: ReportRecord = {
          id,
          caseId: input.caseId,
          target: input.target,
          content,
          evidenceIds: [...input.evidenceIds],
          status: unchanged ? existing.status : 'draft',
          createdAt: existing?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };
        await this.database.reports.put(record);
        await this.touchCase(input.caseId, timestamp);
        return record;
      },
    );
  }

  async updateReportStatus(
    caseId: string,
    target: TakedownTarget,
    status: ReportStatus,
  ): Promise<ReportRecord> {
    const id = reportId(caseId, target);
    const record = await this.database.reports.get(id);
    if (!record || record.caseId !== caseId) throw new Error('Laporan tidak ditemukan dalam kasus ini.');
    const updated = { ...record, status, updatedAt: nowIso() };
    await this.database.reports.put(updated);
    return updated;
  }

  async deleteReport(caseId: string, target: TakedownTarget): Promise<void> {
    const id = reportId(caseId, target);
    const record = await this.database.reports.get(id);
    if (!record || record.caseId !== caseId) throw new Error('Laporan tidak ditemukan dalam kasus ini.');
    await this.database.reports.delete(id);
  }

  async getCaseStats(caseId: string) {
    const [evidence, reports] = await Promise.all([
      this.database.evidence.where('caseId').equals(caseId).count(),
      this.database.reports.where('caseId').equals(caseId).toArray(),
    ]);
    return {
      evidence,
      reports: reports.length,
      submitted: reports.filter((report) => report.status !== 'draft').length,
    };
  }

  async purgeEverything(): Promise<void> {
    await this.database.transaction(
      'rw',
      [this.database.cases, this.database.evidence, this.database.reports, this.database.settings],
      async () => {
        await Promise.all([
          this.database.cases.clear(),
          this.database.evidence.clear(),
          this.database.reports.clear(),
          this.database.settings.clear(),
        ]);
      },
    );
  }

  async exportBackup(): Promise<string> {
    const [cases, evidence, reports, settings] = await Promise.all([
      this.database.cases.toArray(),
      this.database.evidence.toArray(),
      this.database.reports.toArray(),
      this.database.settings.get('settings'),
    ]);
    const backupEvidence: BackupEvidence[] = await Promise.all(
      evidence.map(async ({ blob, ...record }) => ({
        ...record,
        blobBase64: blob ? await blobToBase64(blob) : null,
      })),
    );
    const backup: PerisaiBackup = {
      format: 'perisai-local-backup',
      version: 1,
      exportedAt: nowIso(),
      cases,
      evidence: backupEvidence,
      reports,
      settings: settings ?? { id: 'settings', activeCaseId: null },
    };
    return JSON.stringify(backup, null, 2);
  }

  async importBackup(serialized: string): Promise<void> {
    const backup = parseBackup(serialized);
    validateBackupRelationships(backup);
    const evidence: EvidenceRecord[] = backup.evidence.map(({ blobBase64, ...record }) => ({
      ...record,
      blob: blobBase64 ? base64ToBlob(blobBase64, record.mediaType ?? undefined) : null,
    }));
    await validateImportedEvidence(evidence);
    await this.database.transaction(
      'rw',
      [this.database.cases, this.database.evidence, this.database.reports, this.database.settings],
      async () => {
        await Promise.all([
          this.database.cases.clear(),
          this.database.evidence.clear(),
          this.database.reports.clear(),
          this.database.settings.clear(),
        ]);
        await this.database.cases.bulkAdd(backup.cases);
        await this.database.evidence.bulkAdd(evidence);
        await this.database.reports.bulkAdd(backup.reports);
        await this.database.settings.add(backup.settings);
      },
    );
  }

  close(): void {
    this.database.close();
  }

  async deleteDatabase(): Promise<void> {
    this.database.close();
    await Dexie.delete(this.database.name);
  }

  private async requireCase(caseId: string): Promise<CaseRecord> {
    const record = await this.database.cases.get(caseId);
    if (!record) throw new Error('Kasus tidak ditemukan.');
    return record;
  }

  private async touchCase(caseId: string, timestamp = nowIso()): Promise<void> {
    await this.database.cases.update(caseId, { updatedAt: timestamp });
  }
}

export const caseStore = new LocalCaseStore();

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function base64ToBlob(value: string, type?: string): Blob {
  let binary: string;
  try {
    binary = atob(value);
  } catch {
    throw new Error('Cadangan memuat file yang tidak dapat dibaca.');
  }
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type });
}

function parseBackup(serialized: string): PerisaiBackup {
  let input: unknown;
  try {
    input = JSON.parse(serialized);
  } catch {
    throw new Error('File ini bukan cadangan Perisai yang dapat dibaca.');
  }
  if (!isRecord(input) || input.format !== 'perisai-local-backup' || input.version !== 1) {
    throw new Error('Versi cadangan ini belum didukung oleh Perisai.');
  }
  if (
    !isIsoString(input.exportedAt) ||
    !Array.isArray(input.cases) ||
    !Array.isArray(input.evidence) ||
    !Array.isArray(input.reports) ||
    !isSettings(input.settings)
  ) {
    throw new Error('Cadangan tidak lengkap. Pilih file cadangan Perisai lainnya.');
  }
  if (!input.cases.every(isCaseRecord)) throw new Error('Salah satu kasus dalam cadangan tidak dapat dibaca.');
  if (!input.evidence.every(isBackupEvidence)) throw new Error('Salah satu bukti dalam cadangan tidak dapat dibaca.');
  if (!input.reports.every(isReportRecord)) throw new Error('Salah satu laporan dalam cadangan tidak dapat dibaca.');
  return input as PerisaiBackup;
}

function validateBackupRelationships(backup: PerisaiBackup): void {
  const caseIds = new Set(backup.cases.map((record) => record.id));
  if (caseIds.size !== backup.cases.length) throw new Error('Cadangan memuat kasus ganda dan tidak dapat dipulihkan.');
  const evidenceById = new Map(backup.evidence.map((record) => [record.id, record]));
  if (evidenceById.size !== backup.evidence.length) {
    throw new Error('Cadangan memuat bukti ganda dan tidak dapat dipulihkan.');
  }
  if (backup.evidence.some((record) => !caseIds.has(record.caseId))) {
    throw new Error('Salah satu bukti tidak memiliki kasus yang sesuai.');
  }
  const reportIds = new Set<string>();
  for (const report of backup.reports) {
    if (reportIds.has(report.id)) throw new Error('Cadangan memuat laporan ganda dan tidak dapat dipulihkan.');
    reportIds.add(report.id);
    if (!caseIds.has(report.caseId) || report.id !== reportId(report.caseId, report.target)) {
      throw new Error('Salah satu laporan tidak memiliki kasus yang sesuai.');
    }
    const selected = report.evidenceIds.map((id) => evidenceById.get(id));
    if (
      selected.length === 0 ||
      new Set(report.evidenceIds).size !== report.evidenceIds.length ||
      selected.some((record) => !record || record.caseId !== report.caseId) ||
      selected.some(
        (record) => !record || !eligibleEvidenceForTarget(report.target, record),
      )
    ) {
      throw new Error('Salah satu laporan memakai pilihan bukti yang tidak sesuai.');
    }
    const localCase = backup.cases.find((record) => record.id === report.caseId);
    if (
      !localCase ||
      report.content !==
        generateReport({
          case: localCase,
          target: report.target,
          evidence: selected as BackupEvidence[],
        })
    ) {
      throw new Error('Isi salah satu laporan tidak sesuai dengan kasus dan buktinya.');
    }
  }
  if (backup.settings.activeCaseId && !caseIds.has(backup.settings.activeCaseId)) {
    throw new Error('Kasus yang terakhir dibuka tidak ditemukan dalam cadangan.');
  }
}

async function validateImportedEvidence(evidence: readonly EvidenceRecord[]): Promise<void> {
  for (const record of evidence) {
    const digest =
      record.kind === 'url'
        ? await hashText(record.sourceUrl ?? '')
        : record.blob
          ? await hashFile(record.blob)
          : null;
    if (
      !digest ||
      digest !== record.sha256 ||
      (record.kind === 'file' && record.blob?.size !== record.size)
    ) {
      throw new Error('Salah satu file bukti berubah atau rusak dan tidak dapat dipulihkan.');
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function isNormalizedHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return normalizeUrl(value) === value;
  } catch {
    return false;
  }
}

const INCIDENTS = new Set<IncidentKind>(['deepfake', 'ncii', 'threat', 'other']);
const PLATFORMS = new Set<Platform>(['telegram', 'instagram', 'x', 'tiktok', 'other']);
const TARGETS = new Set<TakedownTarget>([
  'telegram',
  'instagram',
  'x',
  'tiktok',
  'komdigi',
  'police_chronology',
]);
const REPORT_STATUSES = new Set<ReportStatus>([
  'draft',
  'sent',
  'in_review',
  'taken_down',
  'rejected',
]);

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isCaseRecord(value: unknown): value is CaseRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.reference === 'string' &&
    typeof value.title === 'string' &&
    (value.incident === undefined || INCIDENTS.has(value.incident as IncidentKind)) &&
    (value.platform === undefined || PLATFORMS.has(value.platform as Platform)) &&
    (value.firstSeen === undefined || isIsoString(value.firstSeen)) &&
    (value.relationship === undefined || typeof value.relationship === 'string') &&
    isIsoString(value.createdAt) &&
    isIsoString(value.updatedAt)
  );
}

function isBackupEvidence(value: unknown): value is BackupEvidence {
  if (!isRecord(value)) return false;
  const isUrl = value.kind === 'url';
  const isFile = value.kind === 'file';
  return (
    typeof value.id === 'string' &&
    typeof value.caseId === 'string' &&
    (isUrl || isFile) &&
    isNullableString(value.sourceUrl) &&
    isNullableString(value.blobBase64) &&
    isNullableString(value.fileName) &&
    isNullableString(value.mediaType) &&
    (value.size === null || (typeof value.size === 'number' && value.size >= 0)) &&
    typeof value.sha256 === 'string' &&
    /^[a-f0-9]{64}$/.test(value.sha256) &&
    (value.platform === null || PLATFORMS.has(value.platform as Platform)) &&
    isNullableString(value.description) &&
    (value.foundAt === null || isIsoString(value.foundAt)) &&
    isIsoString(value.hashedAt) &&
    isIsoString(value.createdAt) &&
    (isUrl
      ? isNormalizedHttpUrl(value.sourceUrl) && value.blobBase64 === null
      : value.sourceUrl === null && typeof value.blobBase64 === 'string' && value.blobBase64.length > 0)
  );
}

function isReportRecord(value: unknown): value is ReportRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.caseId === 'string' &&
    TARGETS.has(value.target as TakedownTarget) &&
    REPORT_STATUSES.has(value.status as ReportStatus) &&
    typeof value.content === 'string' &&
    Array.isArray(value.evidenceIds) &&
    value.evidenceIds.every((id) => typeof id === 'string') &&
    isIsoString(value.createdAt) &&
    isIsoString(value.updatedAt)
  );
}

function isSettings(value: unknown): value is SettingsRecord {
  return (
    isRecord(value) &&
    value.id === 'settings' &&
    (value.activeCaseId === null || typeof value.activeCaseId === 'string')
  );
}
