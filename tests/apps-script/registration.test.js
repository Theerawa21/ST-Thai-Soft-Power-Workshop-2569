import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadRegistration() {
  const code = fs.readFileSync(path.resolve(process.cwd(), 'apps-script/Registration.gs'), 'utf8');
  const sandbox = {
    APP: {
      MAX_CAPACITY: 200,
      MARKET_REP_QUOTA: 150,
      SCI_MATH_QUOTA: 50,
      REGISTRATION_PREFIX: 'GBM2569-'
    },
    console
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

describe('Apps Script registration rules', () => {
  it('rejects registration when total reaches 200', () => {
    const { validateCapacity } = loadRegistration();
    expect(validateCapacity({ total: 200, marketRepresentatives: 150, scienceMath: 50 }, 'MARKET_REP'))
      .toEqual({ ok:false, code:'CAPACITY_FULL' });
  });

  it('rejects science-math registration when quota reaches 50', () => {
    const { validateCapacity } = loadRegistration();
    expect(validateCapacity({ total: 120, marketRepresentatives: 70, scienceMath: 50 }, 'SCI_MATH'))
      .toEqual({ ok:false, code:'SCI_MATH_FULL' });
  });

  it('rejects market representatives when quota reaches 150', () => {
    const { validateCapacity } = loadRegistration();
    expect(validateCapacity({ total: 150, marketRepresentatives: 150, scienceMath: 0 }, 'MARKET_REP'))
      .toEqual({ ok:false, code:'MARKET_REP_FULL' });
  });

  it('allows registration below all limits', () => {
    const { validateCapacity } = loadRegistration();
    expect(validateCapacity({ total: 80, marketRepresentatives: 50, scienceMath: 30 }, 'SCI_MATH'))
      .toEqual({ ok:true });
  });
});
