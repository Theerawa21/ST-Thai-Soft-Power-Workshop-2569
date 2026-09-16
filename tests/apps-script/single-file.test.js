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

  it('enforces the 200 total and 150 market representative limits', () => {
    const code = fs.readFileSync(path.resolve(process.cwd(), 'apps-script/Code.gs'), 'utf8');
    const sandbox = { console };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    expect(sandbox.validateCapacity(
      { total: 199, marketRepresentatives: 150, scienceMath: 49 },
      'MARKET_REP'
    )).toEqual({ ok:false, code:'MARKET_REP_FULL' });
    expect(sandbox.validateCapacity(
      { total: 200, marketRepresentatives: 150, scienceMath: 50 },
      'SCI_MATH'
    )).toEqual({ ok:false, code:'CAPACITY_FULL' });
  });
});
