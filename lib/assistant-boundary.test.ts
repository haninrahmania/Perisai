import { describe, expect, it, vi } from 'vitest';
import { reviewAssistantDisclosure } from './assistant-boundary';

describe('reviewAssistantDisclosure', () => {
  it('gates crisis text locally before disclosure consent', () => {
    const result = reviewAssistantDisclosure({
      message: 'aku sudah tidak sanggup hidup dan ingin mati',
      consent: false,
      reportContext: null,
    });
    expect(result).toMatchObject({ kind: 'crisis', crisis: 'self_harm' });
  });

  it('requires consent and bounded non-empty text', () => {
    expect(() => reviewAssistantDisclosure({ message: 'halo', consent: false, reportContext: null })).toThrow('Centang persetujuan');
    expect(() => reviewAssistantDisclosure({ message: ' ', consent: true, reportContext: null })).toThrow('1–1000');
    expect(() => reviewAssistantDisclosure({ message: 'x'.repeat(1001), consent: true, reportContext: null })).toThrow('1–1000');
  });

  it('carries only an explicitly selected target and non-draft status', () => {
    const result = reviewAssistantDisclosure({
      message: 'Apa langkah berikutnya?',
      consent: true,
      reportContext: { target: 'telegram', status: 'sent' },
    });
    expect(result).toEqual({
      kind: 'approved',
      disclosure: {
        message: 'Apa langkah berikutnya?',
        reportContext: { target: 'telegram', status: 'sent' },
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/content|evidence|caseId|sourceUrl/);
  });

  it('performs no network request', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    reviewAssistantDisclosure({ message: 'Aku ingin tahu opsi dukungan.', consent: true, reportContext: null });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
