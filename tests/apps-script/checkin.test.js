import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

function loadCheckIn() {
  const code = fs.readFileSync(new URL('../../apps-script/CheckIn.gs', import.meta.url), 'utf8');
  const sandbox = { console };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

describe('check-in eligibility', () => {
  it('requires confirmed payment', () => {
    const { validateCheckInEligibility } = loadCheckIn();
    expect(validateCheckInEligibility('PENDING_PAYMENT')).toEqual({ ok:false, code:'PAYMENT_REQUIRED' });
  });

  it('allows paid registrations', () => {
    const { validateCheckInEligibility } = loadCheckIn();
    expect(validateCheckInEligibility('PAID')).toEqual({ ok:true });
  });
});
