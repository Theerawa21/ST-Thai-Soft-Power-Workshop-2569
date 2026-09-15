import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('check-in uses script lock to prevent duplicate concurrent scans', () => {
  const source = fs.readFileSync(new URL('../../apps-script/CheckIn.gs', import.meta.url), 'utf8');
  assert.equal(source.includes('LockService.getScriptLock()'), true);
  assert.equal(source.includes('waitLock(10000)'), true);
  assert.equal(source.includes('releaseLock()'), true);
});
