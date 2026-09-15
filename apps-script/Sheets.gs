function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet_(name) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error(`ไม่พบชีต ${name} กรุณารัน setupSystem() ก่อน`);
  return sheet;
}

function ensureSheet_(name, headers) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const mismatch = headers.some((header, index) => current[index] !== header);
    if (mismatch) {
      throw new Error(`หัวตารางของชีต ${name} ไม่ตรงกับระบบ`);
    }
  }
  return sheet;
}

function rowsAsObjects_(sheetName) {
  const sheet = getSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  return values.slice(1).map((row, offset) => {
    const obj = { _row: offset + 2 };
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
}

function appendObject_(sheetName, object) {
  const sheet = getSheet_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => Object.prototype.hasOwnProperty.call(object, header) ? object[header] : '');
  sheet.appendRow(row);
  return sheet.getLastRow();
}

function updateObjectRow_(sheetName, rowNumber, patch) {
  const sheet = getSheet_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const current = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  const next = headers.map((header, i) => Object.prototype.hasOwnProperty.call(patch, header) ? patch[header] : current[i]);
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([next]);
}

function findBy_(sheetName, field, value) {
  return rowsAsObjects_(sheetName).find(row => String(row[field]) === String(value)) || null;
}

function getSettings_() {
  const rows = rowsAsObjects_(APP.SHEETS.SETTINGS);
  return rows.reduce((acc, row) => {
    acc[String(row.key)] = row.value;
    return acc;
  }, {});
}

function setSetting_(key, value) {
  const sheetName = APP.SHEETS.SETTINGS;
  const existing = findBy_(sheetName, 'key', key);
  const now = new Date();
  if (existing) {
    updateObjectRow_(sheetName, existing._row, { value: String(value), updated_at: now });
  } else {
    appendObject_(sheetName, { key, value: String(value), updated_at: now });
  }
}

function logAction_(actor, action, entityType, entityId, details) {
  appendObject_(APP.SHEETS.LOGS, {
    log_id: Utilities.getUuid(),
    timestamp: new Date(),
    actor: actor || 'SYSTEM',
    action,
    entity_type: entityType || '',
    entity_id: entityId || '',
    details_json: JSON.stringify(details || {})
  });
}
