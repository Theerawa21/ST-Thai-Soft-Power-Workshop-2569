function configureAdminToken(token) {
  const value = String(token || '').trim();
  if (value.length < 20) throw new Error('Admin token ต้องมีอย่างน้อย 20 ตัวอักษร');
  PropertiesService.getScriptProperties().setProperty('ADMIN_TOKEN', value);
  return { ok: true };
}

function requireAdmin_(options) {
  options = options || {};
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');
  if (!expected) throw apiError_('ADMIN_NOT_CONFIGURED', 'ยังไม่ได้ตั้งค่า Admin token');
  const supplied = String(options.adminToken || '');
  if (!supplied || supplied !== expected) throw apiError_('UNAUTHORIZED', 'ไม่มีสิทธิ์ดำเนินการ');
  return { actor: 'ACADEMIC_OFFICE' };
}
