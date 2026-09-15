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

  it('requires market representatives to include group and product type', () => {
    const result = validateRegistrationForm({ ...base, registration_type: 'MARKET_REP', group_name: '', product_type: '' });
    expect(result.ok).toBe(false);
  });

  it('accepts a complete market representative registration', () => {
    const result = validateRegistrationForm({ ...base, registration_type: 'MARKET_REP', group_name: 'Thai Taste', product_type: 'อาหาร' });
    expect(result.ok).toBe(true);
  });
});
