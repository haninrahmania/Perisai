import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

function request(body: unknown) {
  return new Request('http://localhost/api/navigator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function userMessage(text: string) {
  return { id: crypto.randomUUID(), role: 'user', parts: [{ type: 'text', text }] };
}

describe('POST /api/navigator', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is honestly unavailable without a server-side Gemini key', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const response = await POST(request({ consent: true, messages: [userMessage('Halo')] }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Pendamping belum tersedia. Coba lagi nanti.' });
  });

  it('rejects missing consent and non-text message parts before calling the provider', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    const noConsent = await POST(request({ consent: false, messages: [userMessage('Halo')] }));
    expect(noConsent.status).toBe(400);

    const filePart = await POST(request({
      consent: true,
      messages: [{ id: '1', role: 'user', parts: [{ type: 'file', mediaType: 'image/png', url: 'data:image/png;base64,AA==' }] }],
    }));
    expect(filePart.status).toBe(400);
  });

  it('rejects draft or malformed report context', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    const response = await POST(request({
      consent: true,
      messages: [userMessage('Halo')],
      reportContext: { target: 'telegram', status: 'draft' },
    }));
    expect(response.status).toBe(400);
  });

  it('runs the crisis gate before any provider stream starts', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    const response = await POST(request({
      consent: true,
      messages: [userMessage('aku ingin mati')],
      reportContext: null,
    }));
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ crisis: 'self_harm' });
  });
});
