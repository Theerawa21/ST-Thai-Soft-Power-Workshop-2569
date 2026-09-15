import test from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest } from '../../assets/js/api.js';

test('apiRequest posts action and payload as JSON', async () => {
  let call;
  globalThis.fetch = async (url, options) => {
    call = { url, options };
    return { ok: true, json: async () => ({ ok: true, data: { remaining: 63 } }) };
  };
  const result = await apiRequest('eventStatus', { sample: 1 });
  const body = JSON.parse(call.options.body);
  assert.equal(body.action, 'eventStatus');
  assert.deepEqual(body.payload, { sample: 1 });
  assert.equal(result.data.remaining, 63);
  assert.equal(body.adminToken, undefined);
});
