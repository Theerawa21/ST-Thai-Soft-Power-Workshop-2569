import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadPayments() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(new URL('../../apps-script/Payments.gs', import.meta.url), 'utf8'), context);
  return context;
}

test('creates next immutable receipt number from highest existing number', () => {
  const { nextReceiptNumberFromRows_ } = loadPayments();
  const result = nextReceiptNumberFromRows_([
    { receipt_number: 'GBM-R2569-0002' },
    { receipt_number: 'GBM-R2569-0008' },
    { receipt_number: 'GBM-R2569-0003' }
  ]);
  assert.equal(result, 'GBM-R2569-0009');
});

test('accepts only CASH or TRANSFER payment methods', () => {
  const { isPaymentMethodValid_ } = loadPayments();
  assert.equal(isPaymentMethodValid_('CASH'), true);
  assert.equal(isPaymentMethodValid_('TRANSFER'), true);
  assert.equal(isPaymentMethodValid_('CARD'), false);
});

test('voided receipt numbers are still counted and never reused', () => {
  const { nextReceiptNumberFromRows_ } = loadPayments();
  const result = nextReceiptNumberFromRows_([
    { receipt_number: 'GBM-R2569-0009', receipt_status: 'VOID' }
  ]);
  assert.equal(result, 'GBM-R2569-0010');
});
