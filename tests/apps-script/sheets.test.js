import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

describe('Apps Script spreadsheet connection', () => {
  it('opens the spreadsheet ID stored in Script Properties for a standalone project', () => {
    const openById = vi.fn(() => ({ marker: 'target-sheet' }));
    const getProperty = vi.fn((key) => key === 'SPREADSHEET_ID' ? 'sheet-123' : null);
    const context = {
      SpreadsheetApp: { openById },
      PropertiesService: {
        getScriptProperties: () => ({ getProperty })
      }
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('apps-script/Sheets.gs', 'utf8'), context);

    const result = context.getSpreadsheet_();

    expect(getProperty).toHaveBeenCalledWith('SPREADSHEET_ID');
    expect(openById).toHaveBeenCalledWith('sheet-123');
    expect(result.marker).toBe('target-sheet');
  });

  it('fails clearly when SPREADSHEET_ID is not configured', () => {
    const context = {
      SpreadsheetApp: { openById: vi.fn() },
      PropertiesService: {
        getScriptProperties: () => ({ getProperty: () => null })
      }
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('apps-script/Sheets.gs', 'utf8'), context);

    expect(() => context.getSpreadsheet_()).toThrow('SPREADSHEET_ID');
  });
});
