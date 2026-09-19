import { describe, it, expect } from 'vitest';
import { validateRegistrationForm } from '../../assets/js/register.js';

const base = {
  student_id: '12345', prefix: 'นาย', first_name: 'ทดสอบ', last_name: 'ระบบ',
  nickname: 'ต้น', grade: 'ม.5', room: '2', number: '10', program: 'วิทย์–คณิต',
  phone: '0812345678', registration_type: 'SCI_MATH'
};

describe('validateRegistrationForm', () => {
  it('accepts a complete science-math registration', () => {
    expect(validateRegistrationForm(base).ok).toBe(true);
  });

  it('requires only the group/shop name for market representatives', () => {
    const missingGroup = validateRegistrationForm({
      ...base,
      registration_type: 'MARKET_REP',
      group_name: ''
    });
    expect(missingGroup.ok).toBe(false);

    const complete = validateRegistrationForm({
      ...base,
      registration_type: 'MARKET_REP',
      group_name: 'Thai Taste'
    });
    expect(complete.ok).toBe(true);
  });

  it('does not require product details from market representatives', () => {
    const result = validateRegistrationForm({
      ...base,
      registration_type: 'MARKET_REP',
      group_name: 'Thai Taste',
      product_type: '',
      product_name: '',
      soft_power_concept: ''
    });
    expect(result.ok).toBe(true);
  });
});
