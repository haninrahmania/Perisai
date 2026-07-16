import { type CrisisKind } from './crisis';

// Gate broke three separate ways in an hour — keep these cases wired to a
// visible check (see app/dev "test gate" button) instead of trusting the regexes blind.
export const CRISIS_TEST_CASES: [string, CrisisKind][] = [
  ['aku udah gak sanggup hidup', 'self_harm'],
  ['dia bilang mau bunuh aku kalau aku lapor', 'physical_danger'],
  ['pelakunya mantan aku, dia bisa dihukum gak?', null],
];
