'use client';
import { useState } from 'react';
import { ensureSession } from '@/lib/supabase';
import { addEvidence, listEvidence } from '@/lib/evidence';
import { generateCertificate } from '@/lib/certificate';
import { type TakedownTarget } from '@/lib/takedown-prompts';
import { availableTargets } from '@/lib/targets';

const MAYA_EVIDENCE = [
  {
    kind: 'url' as const,
    sourceUrl: 'https://t.me/c/1885043762/412',
    platform: 'telegram',
    description: 'Video manipulasi disebar di grup Telegram, dikirim teman via DM',
    foundAt: '2026-07-14T21:30:00+07:00',
  },
];

const MAYA_CTX = {
  platform: 'telegram',
  firstSeen: '14 Juli 2026',
  relationship: 'mantan pasangan',
};

export default function DevPage() {
  const [log, setLog] = useState<string[]>([]);
  const say = (s: string) => setLog((l) => [...l, s]);

  async function whoami() {
    const user = await ensureSession();
    say(`user_id: ${user?.id}`);
  }

  async function insert() {
    try {
      const row = await addEvidence({
        kind: 'url',
        sourceUrl: `https://t.me/fake-channel/${Date.now()}`,
        platform: 'telegram',
        description: 'smoke test',
      });
      say(`inserted: ${row.id} | sha256: ${row.sha256.slice(0, 16)}…`);
    } catch (e: any) {
      say(`INSERT ERROR: ${e.message}`);
    }
  }

  async function list() {
    try {
      const rows = await listEvidence();
      say(`listEvidence() → ${rows.length} row(s)`);
      rows.forEach((r: any, i: number) =>
        say(`  ${i + 1}. [${r.kind}] ${r.sha256.slice(0, 12)}… ${r.description ?? ''}`)
      );
    } catch (e: any) {
      say(`LIST ERROR: ${e.message}`);
    }
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const row = await addEvidence({
        kind: 'screenshot',
        file,
        platform: 'telegram',
        description: 'storage smoke test',
      });
      say(`uploaded: ${row.storage_path} | sha256: ${row.sha256.slice(0, 16)}…`);
      const { previewUrl } = await import('@/lib/evidence');
      const url = await previewUrl(row.storage_path);
      window.open(url, '_blank');
    } catch (err: any) {
      say(`UPLOAD ERROR: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  }

  async function seedMaya(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    try {
      const existing = await listEvidence();
      if (existing.length > 0) {
        say(`⚠️  ${existing.length} row(s) already exist — wipe first or fallbacks bake stale data.`);
        return;
      }
      for (const ev of MAYA_EVIDENCE) await addEvidence(ev);
      const descs = [
        'Tangkapan layar pesan dari teman yang memberi tahu keberadaan konten',
        'Tangkapan layar daftar anggota grup penyebar',
      ];
      const picked = [...files].slice(0, 2);
      for (let i = 0; i < picked.length; i++) {
        await addEvidence({
          kind: 'screenshot',
          file: picked[i],
          platform: 'telegram',
          description: descs[i],
          foundAt: '2026-07-14T21:45:00+07:00',
        });
      }
      const rows = await listEvidence();
      const hashes = new Set(rows.map((r: any) => r.sha256));
      say(`seeded ${rows.length} row(s), ${hashes.size} distinct hash(es)`);
      if (hashes.size !== rows.length) say('⚠️  duplicate hash — use two different images');
    } catch (err: any) {
      say(`SEED ERROR: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  }

  async function cert() {
    const rows = await listEvidence();
    generateCertificate(rows as any, `PRS-${Date.now().toString(36).toUpperCase()}`);
  }

  async function callWithRetry(target: TakedownTarget, ctx: any, tries = 3) {
    for (let i = 0; i < tries; i++) {
      const r = await fetch('/api/takedown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, ctx }),
      });
      const j = await r.json();
      if (!j.error) return j;
      say(`   retry ${i + 1}/${tries}: ${String(j.error).slice(0, 60)}`);
      await new Promise((res) => setTimeout(res, 3000 * 2 ** i));
    }
    return { error: 'exhausted retries' };
  }

  async function genFallbacks() {
    const evidence = await listEvidence();
    if (evidence.length === 0) {
      say('no evidence — seed Maya first');
      return;
    }
    const targets = availableTargets(evidence);
    say(`targets: ${targets.join(', ')}`);

    const out: Record<string, string> = {};

    for (const target of targets) {
      say(`→ ${target}…`);
      const j = await callWithRetry(target, { ...MAYA_CTX, evidence });
      if (j.error) {
        say(`   FAILED: ${j.error}`);
        continue;
      }
      out[target] = j.text;
      say(`   ok (${j.text.length} chars, source=${j.source})`);
      await new Promise((res) => setTimeout(res, 5000));
    }

    const missing = targets.filter((t) => !out[t]);
    if (missing.length) say(`⚠️  missing: ${missing.join(', ')} — re-run before shipping`);

    const esc = (s: string) =>
      s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    const file =
      `import type { TakedownTarget } from './takedown-prompts';\n\n` +
      `export const FALLBACKS: Partial<Record<TakedownTarget, string>> = {\n` +
      Object.entries(out).map(([k, v]) => `  ${k}: \`${esc(v)}\`,`).join('\n\n') +
      `\n};\n`;

    console.log(file);
    await navigator.clipboard.writeText(file);
    say(`\n✅ ${Object.keys(out).length}/${targets.length} generated — copied to clipboard.`);
  }

  return (
    <div className="p-8 space-y-4 font-mono text-sm">
      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={whoami} className="border px-3 py-1">whoami</button>
        <button onClick={insert} className="border px-3 py-1">insert evidence</button>
        <button onClick={list} className="border px-3 py-1">list evidence</button>
        <button onClick={cert} className="border px-3 py-1">certificate</button>
        <button onClick={genFallbacks} className="border px-3 py-1">generate fallbacks</button>
        <label className="border px-3 py-1 cursor-pointer">
          seed Maya
          <input type="file" accept="image/*" multiple className="hidden" onChange={seedMaya} />
        </label>
        <label className="border px-3 py-1 cursor-pointer">
          upload one
          <input type="file" accept="image/*" className="hidden" onChange={upload} />
        </label>
      </div>
      <pre className="whitespace-pre-wrap">{log.join('\n')}</pre>
    </div>
  );
}