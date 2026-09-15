function setupSystem() {
  Object.keys(SHEET_HEADERS).forEach(name => ensureSheet_(name, SHEET_HEADERS[name]));
  const settings = {
    EVENT_NAME: 'Workshop Thai Soft Power',
    EVENT_YEAR: '2569',
    EVENT_DATE: '2026-10-05',
    START_TIME: '08:30',
    END_TIME: '15:00',
    VENUE: 'ห้องประชุมชั้น 5 อาคารเซนต์เทเรซา',
    MAX_CAPACITY: SYSTEM_CONFIG.MAX_CAPACITY,
    SCI_MATH_QUOTA: SYSTEM_CONFIG.SCI_MATH_QUOTA,
    FEE: SYSTEM_CONFIG.FEE,
    REGISTRATION_DEADLINE: SYSTEM_CONFIG.REGISTRATION_DEADLINE,
    REGISTRATION_OPEN: 'TRUE',
    LINE_GROUP_URL: ''
  };
  Object.keys(settings).forEach(key => setSetting_(key, settings[key]));
  return { ok: true, sheets: Object.keys(SHEET_HEADERS) };
}

function setInitialAdminToken(token, displayName) {
  if (!token || String(token).length < 12) throw new Error('ADMIN_TOKEN ต้องยาวอย่างน้อย 12 ตัวอักษร');
  const props = PropertiesService.getScriptProperties();
  props.setProperty('ADMIN_TOKEN', String(token));
  props.setProperty('ADMIN_NAME', String(displayName || 'ฝ่ายวิชาการ'));
  return { ok: true };
}
