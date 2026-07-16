import type { TakedownTarget } from './takedown-prompts';

const PLATFORM_TO_TARGET: Record<string, TakedownTarget> = {
  telegram: 'telegram',
  instagram: 'instagram',
  x: 'x',
  tiktok: 'tiktok',
};

/** Only offer letters for platforms the victim actually has evidence on. */
export function availableTargets(
  evidence: { platform: string | null }[]
): TakedownTarget[] {
  const platforms = new Set(
    evidence.map((e) => e.platform).filter(Boolean) as string[]
  );
  const fromEvidence = [...platforms]
    .map((p) => PLATFORM_TO_TARGET[p])
    .filter(Boolean);
  return [...fromEvidence, 'komdigi', 'police_chronology'];
}