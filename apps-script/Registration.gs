function validateCapacity(counts, registrationType) {
  if (Number(counts.total) >= SYSTEM_CONFIG.MAX_CAPACITY) return { ok: false, code: 'CAPACITY_FULL' };
  if (registrationType === 'SCI_MATH' && Number(counts.scienceMath) >= SYSTEM_CONFIG.SCI_MATH_QUOTA) {
    return { ok: false, code: 'SCI_MATH_FULL' };
  }
  return { ok: true };
}

function validateRegistrationPayload_(payload) {
  const required = ['student_id','prefix','first_name','last_name','nickname','grade','room','number','program','phone','registration_type'];
  const missing = required.filter(k => !String(payload?.[k] ?? '').trim());
  if (missing.length) return { ok: false, code: 'INVALID_INPUT', message: `กรอกข้อมูลให้ครบ: ${missing.join(', ')}` };
  if (!['MARKET_REP','SCI_MATH'].includes(payload.registration_type)) return { ok: false, code: 'INVALID_TYPE', message: 'ประเภทผู้สมัครไม่ถูกต้อง' };
  if (payload.registration_type === 'MARKET_REP') {
    if (!String(payload.group_name || '').trim()) return { ok: false, code: 'GROUP_REQUIRED', message: 'กรุณาระบุชื่อกลุ่ม/ชื่อร้าน' };
    if (!['อาหาร','เครื่องดื่ม','ขนม'].includes(payload.product_type)) return { ok: false, code: 'PRODUCT_TYPE_REQUIRED', message: 'กรุณาเลือกประเภทสินค้า' };
  }
  return { ok: true };
}

function nextRegistrationId_(rows) {
  let max = 0;
  rows.forEach(r => {
    const m = String(r.registration_id || '').match(/^GBM2569-(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return `GBM2569-${String(max + 1).padStart(3, '0')}`;
}

function isRegistrationOpen_() {
  const settings = getSettings_();
  const flag = String(settings.REGISTRATION_OPEN ?? 'TRUE').toUpperCase() === 'TRUE';
  const deadline = new Date(settings.REGISTRATION_DEADLINE || SYSTEM_CONFIG.REGISTRATION_DEADLINE);
  return flag && Date.now() <= deadline.getTime();
}

function registerStudent(payload) {
  const validation = validateRegistrationPayload_(payload);
  if (!validation.ok) throw apiError_(validation.code, validation.message);
  if (!isRegistrationOpen_()) throw apiError_('REGISTRATION_CLOSED', 'ปิดรับสมัครแล้ว');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const rows = rowsToObjects_(getSheet_(SYSTEM_CONFIG.SHEETS.REGISTRATIONS));
    const active = rows.filter(r => String(r.registration_status) !== 'CANCELLED');
    if (active.some(r => String(r.student_id).trim() === String(payload.student_id).trim())) {
      throw apiError_('DUPLICATE_STUDENT', 'รหัสนักเรียนนี้สมัครแล้ว');
    }
    if (payload.registration_type === 'MARKET_REP') {
      const groupCount = active.filter(r => String(r.registration_type) === 'MARKET_REP' && String(r.group_name).trim() === String(payload.group_name).trim()).length;
      if (groupCount >= 4) throw apiError_('GROUP_FULL', 'กลุ่มนี้มีตัวแทนครบ 4 คนแล้ว');
    }
    const counts = {
      total: active.length,
      scienceMath: active.filter(r => String(r.registration_type) === 'SCI_MATH').length
    };
    const capacity = validateCapacity(counts, payload.registration_type);
    if (!capacity.ok) {
      const message = capacity.code === 'SCI_MATH_FULL' ? 'โควตานักเรียนแผนวิทย์–คณิตเต็มแล้ว' : 'จำนวนผู้สมัครเต็ม 150 คนแล้ว';
      throw apiError_(capacity.code, message);
    }

    const registrationId = nextRegistrationId_(rows);
    const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    const now = new Date();
    appendObject_(SYSTEM_CONFIG.SHEETS.REGISTRATIONS, SHEET_HEADERS.Registrations, {
      registration_id: registrationId,
      public_token: token,
      student_id: String(payload.student_id).trim(),
      prefix: String(payload.prefix).trim(),
      first_name: String(payload.first_name).trim(),
      last_name: String(payload.last_name).trim(),
      nickname: String(payload.nickname).trim(),
      grade: String(payload.grade).trim(),
      room: String(payload.room).trim(),
      number: String(payload.number).trim(),
      program: String(payload.program).trim(),
      phone: String(payload.phone).trim(),
      registration_type: payload.registration_type,
      group_name: String(payload.group_name || '').trim(),
      product_type: String(payload.product_type || '').trim(),
      product_name: String(payload.product_name || '').trim(),
      soft_power_concept: String(payload.soft_power_concept || '').trim(),
      registration_status: 'REGISTERED',
      payment_status: 'PENDING_PAYMENT',
      created_at: now,
      updated_at: now
    });
    logAction_('REGISTER', registrationId, { registration_type: payload.registration_type }, 'PUBLIC');
    return { registration_id: registrationId, public_token: token, payment_status: 'PENDING_PAYMENT' };
  } finally {
    lock.releaseLock();
  }
}

function getEventStatus() {
  const active = activeRegistrations_();
  const total = active.length;
  const scienceMath = active.filter(r => String(r.registration_type) === 'SCI_MATH').length;
  const paid = active.filter(r => ['PAID','CONFIRMED'].includes(String(r.payment_status))).length;
  return {
    total,
    remaining: Math.max(0, SYSTEM_CONFIG.MAX_CAPACITY - total),
    scienceMath,
    scienceMathRemaining: Math.max(0, SYSTEM_CONFIG.SCI_MATH_QUOTA - scienceMath),
    paid,
    registrationOpen: isRegistrationOpen_() && total < SYSTEM_CONFIG.MAX_CAPACITY,
    maxCapacity: SYSTEM_CONFIG.MAX_CAPACITY,
    scienceMathQuota: SYSTEM_CONFIG.SCI_MATH_QUOTA,
    fee: SYSTEM_CONFIG.FEE
  };
}
