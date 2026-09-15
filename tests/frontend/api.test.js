import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiRequest } from '../../assets/js/api.js';

afterEach(() => vi.restoreAllMocks());

describe('apiRequest', () => {
  it('posts action and payload as JSON and returns parsed result', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, data: { remaining: 63 } })
    }));

    const result = await apiRequest('eventStatus', { sample: 1 });

    expect(fetch).toHaveBeenCalledOnce();
    const [, options] = fetch.mock.calls[0];
    expect(JSON.parse(options.body)).toMatchObject({
      action: 'eventStatus',
      payload: { sample: 1 }
    });
    expect(result.data.remaining).toBe(63);
  });

  it('does not expose admin credentials for a public request', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, data: {} })
    }));

    await apiRequest('eventStatus');
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.action).toBe('eventStatus');
    expect(body.adminToken).toBeUndefined();
  });
});
