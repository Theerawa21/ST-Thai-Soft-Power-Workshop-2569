import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

function loadPayments() {
  const code = fs.readFileSync(new URL('../../apps-script/Payments.gs', import.meta.url), 'utf8');
  const sandbox = { APP: { RECEIPT_PREFIX: 'GBM-R2569-' }, console };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

describe('receipt numbering', () => {
  it('starts at 0001', () => {
    const { nextReceiptNumber_ } = loadPayments();
    expect(nextReceiptNumber_([])).toBe('GBM-R2569-0001');
  });

  it('never reuses the greatest issued number', () => {
    const { nextReceiptNumber_ } = loadPayments();
    const rows = [
      { receipt_number: 'GBM-R2569-0001', receipt_status: 'ISSUED' },
      { receipt_number: 'GBM-R2569-0002', receipt_status: 'VOID' }
    ];
    expect(nextReceiptNumber_(rows)).toBe('GBM-R2569-0003');
  });
});
