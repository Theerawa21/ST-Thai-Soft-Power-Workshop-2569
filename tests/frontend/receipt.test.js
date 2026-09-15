import { describe, it, expect } from 'vitest';
import { paymentMethodLabel } from '../../assets/js/receipt.js';

describe('paymentMethodLabel', () => {
  it('maps CASH to Thai label', () => {
    expect(paymentMethodLabel('CASH')).toBe('เงินสด');
  });

  it('maps TRANSFER to Thai label', () => {
    expect(paymentMethodLabel('TRANSFER')).toBe('โอนเงิน');
  });
});
