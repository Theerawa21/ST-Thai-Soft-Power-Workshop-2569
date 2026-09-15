function secureEquals_(a, b) {
  a = String(a || ''); b = String(b || '');
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function assertAdmin_(token) {
  const props = PropertiesService.getScriptProperties();
  const expected = props.getProperty('ADMIN_TOKEN');
  if (!expected) throw apiError_('ADMIN_NOT_CONFIGURED', 'ยังไม่ได้ตั้งค่า ADMIN_TOKEN');
  if (!secureEquals_(token, expected)) throw apiError_('UNAUTHORIZED', 'ไม่มีสิทธิ์ใช้งานส่วนผู้ดูแล');
  return props.getProperty('ADMIN_NAME') || 'ฝ่ายวิชาการ';
}
