function setupSystem() {
  Object.keys(HEADERS).forEach(name => ensureSheet_(name, HEADERS[name]));
  const defaults = defaultSettings_();
  Object.keys(defaults).forEach(key => {
    if (!findBy_(APP.SHEETS.SETTINGS, 'key', key)) {
      appendObject_(APP.SHEETS.SETTINGS, {
        key,
        value: defaults[key],
        updated_at: new Date()
      });
    }
  });
  logAction_('SYSTEM', 'SETUP_SYSTEM', 'SYSTEM', 'SETUP', { sheets: Object.keys(HEADERS) });
  return { ok: true, message: 'ตั้งค่าระบบเรียบร้อยแล้ว' };
}
