import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistrationForm } from '../../assets/js/register.js';

test('market representative requires group and product type', () => {
  const result = validateRegistrationForm({
    student_id:'123', prefix:'นาย', first_name:'A', last_name:'B', nickname:'C', grade:'ม.4', room:'1', number:'1', program:'ทั่วไป', phone:'0812345678', registration_type:'MARKET_REP', group_name:'', product_type:''
  });
  assert.equal(result.ok, false);
});

test('science-math interested student does not require market fields', () => {
  const result = validateRegistrationForm({
    student_id:'123', prefix:'นาย', first_name:'A', last_name:'B', nickname:'C', grade:'ม.4', room:'1', number:'1', program:'วิทย์-คณิต', phone:'0812345678', registration_type:'SCI_MATH'
  });
  assert.equal(result.ok, true);
});
