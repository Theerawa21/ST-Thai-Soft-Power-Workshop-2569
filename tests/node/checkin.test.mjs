import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadCheckin() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(new URL('../../apps-script/CheckIn.gs', import.meta.url), 'utf8'), context);
  return context;
}

test('check-in requires a paid status', () => {
  const { canCheckInPaymentStatus_ } = loadCheckin();
  assert.equal(canCheckInPaymentStatus_('PAID'), true);
  assert.equal(canCheckInPaymentStatus_('CONFIRMED'), true);
  assert.equal(canCheckInPaymentStatus_('PENDING_PAYMENT'), false);
});
