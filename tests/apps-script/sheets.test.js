import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

describe('Apps Script spreadsheet connection', () => {
  it('opens the configured spreadsheet by ID for a standalone Apps Script project', () => {
    const openById = vi.fn(() => ({ marker: 'target-sheet' }));
    const context = {
      APP: { SPREADSHEET_ID: 'sheet-123', SHEETS: {} },
      SpreadsheetApp: { openById }
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('apps-script/Sheets.gs', 'utf8'), context);

    const result = context.getSpreadsheet_();

    expect(openById).toHaveBeenCalledWith('sheet-123');
    expect(result.marker).toBe('target-sheet');
  });
});
