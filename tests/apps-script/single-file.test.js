import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

describe('single-file Apps Script backend', () => {
  it('exposes all required backend functions from Code.gs alone', () => {
    const code = fs.readFileSync(path.resolve(process.cwd(), 'apps-script/Code.gs'), 'utf8');
    const sandbox = { console };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    const required = [
      'doGet',
      'doPost',
      'setupSystem',
      'validateCapacity',
      'getEventStatus',
      'registerStudent',
      'getStudentStatus',
      'getStudentReceipt',
      'lookupForPayment',
      'confirmPayment',
      'getAdminDashboard',
      'validateCheckInEligibility',
      'checkInStudent',
      'requireAdmin_'
    ];

    required.forEach(name => {
      expect(typeof sandbox[name], `${name} should exist in Code.gs`).toBe('function');
    });
  });
});
