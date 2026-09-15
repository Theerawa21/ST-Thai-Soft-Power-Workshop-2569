function getDatabase_() {
  const props = PropertiesService.getScriptProperties();
  const storedId = props.getProperty('SPREADSHEET_ID');
  if (storedId) return SpreadsheetApp.openById(storedId);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('ไม่พบ Google Sheet กรุณาตั้งค่า SPREADSHEET_ID ใน Script Properties');
  props.setProperty('SPREADSHEET_ID', active.getId());
  return active;
}

function getSheet_(name) {
  const sheet = getDatabase_().getSheetByName(name);
  if (!sheet) throw new Error(`ไม่พบชีต ${name} กรุณารัน setupSystem()`);
  return sheet;
}

function ensureSheet_(name, headers) {
  const ss = getDatabase_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    const existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    headers.forEach((header, index) => {
      if (!existing[index]) sheet.getRange(1, index + 1).setValue(header);
    });
  }
  return sheet;
}

function rowsToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(row => row.some(v => v !== '')).map((row, rowIndex) => {
    const obj = { _row: rowIndex + 2 };
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function appendObject_(sheetName, headers, obj) {
  const sheet = getSheet_(sheetName);
  sheet.appendRow(headers.map(key => obj[key] ?? ''));
  return sheet.getLastRow();
}

function updateRowObject_(sheetName, rowNumber, headers, patch) {
  const sheet = getSheet_(sheetName);
  const current = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  const map = {};
  headers.forEach((h, i) => map[h] = current[i]);
  Object.keys(patch).forEach(k => { if (headers.includes(k)) map[k] = patch[k]; });
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([headers.map(k => map[k] ?? '')]);
}

function getSettings_() {
  const rows = rowsToObjects_(getSheet_(SYSTEM_CONFIG.SHEETS.SETTINGS));
  return rows.reduce((acc, row) => {
    acc[String(row.key)] = row.value;
    return acc;
  }, {});
}

function setSetting_(key, value) {
  const sheet = getSheet_(SYSTEM_CONFIG.SHEETS.SETTINGS);
  const rows = rowsToObjects_(sheet);
  const found = rows.find(r => String(r.key) === key);
  const now = new Date();
  if (found) {
    updateRowObject_(SYSTEM_CONFIG.SHEETS.SETTINGS, found._row, SHEET_HEADERS.Settings, { value, updated_at: now });
  } else {
    appendObject_(SYSTEM_CONFIG.SHEETS.SETTINGS, SHEET_HEADERS.Settings, { key, value, updated_at: now });
  }
}

function logAction_(action, registrationId, detail, actor) {
  appendObject_(SYSTEM_CONFIG.SHEETS.LOGS, SHEET_HEADERS.Logs, {
    log_id: Utilities.getUuid(),
    action,
    registration_id: registrationId || '',
    detail: typeof detail === 'string' ? detail : JSON.stringify(detail || {}),
    actor: actor || 'SYSTEM',
    created_at: new Date()
  });
}

function findRegistrationById_(registrationId) {
  return rowsToObjects_(getSheet_(SYSTEM_CONFIG.SHEETS.REGISTRATIONS))
    .find(r => String(r.registration_id) === String(registrationId)) || null;
}

function findRegistrationByToken_(token) {
  return rowsToObjects_(getSheet_(SYSTEM_CONFIG.SHEETS.REGISTRATIONS))
    .find(r => String(r.public_token) === String(token)) || null;
}

function activeRegistrations_() {
  return rowsToObjects_(getSheet_(SYSTEM_CONFIG.SHEETS.REGISTRATIONS))
    .filter(r => String(r.registration_status) !== 'CANCELLED');
}
