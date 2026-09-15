import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadFunctions() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(new URL('../../apps-script/Config.gs', import.meta.url), 'utf8'), context);
  vm.runInContext(fs.readFileSync(new URL('../../apps-script/Registration.gs', import.meta.url), 'utf8'), context);
  return context;
}

test('rejects registration when capacity reaches 150', () => {
  const { validateCapacity } = loadFunctions();
  assert.deepEqual(JSON.parse(JSON.stringify(validateCapacity({ total: 150, scienceMath: 20 }, 'MARKET_REP'))), { ok: false, code: 'CAPACITY_FULL' });
});

test('rejects science-math when quota reaches 50', () => {
  const { validateCapacity } = loadFunctions();
  assert.deepEqual(JSON.parse(JSON.stringify(validateCapacity({ total: 120, scienceMath: 50 }, 'SCI_MATH'))), { ok: false, code: 'SCI_MATH_FULL' });
});

test('accepts a registration when both limits are available', () => {
  const { validateCapacity } = loadFunctions();
  assert.deepEqual(JSON.parse(JSON.stringify(validateCapacity({ total: 149, scienceMath: 49 }, 'SCI_MATH'))), { ok: true });
});
