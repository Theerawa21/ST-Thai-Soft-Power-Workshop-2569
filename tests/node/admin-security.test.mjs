import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('admin dashboard renders applicant data without innerHTML', () => {
  const source = fs.readFileSync(new URL('../../assets/js/admin.js', import.meta.url), 'utf8');
  assert.equal(source.includes('tr.innerHTML'), false, 'student-controlled dashboard data must not be inserted with innerHTML');
  assert.equal(source.includes('.textContent'), true, 'dashboard should render values through textContent');
});
