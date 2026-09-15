function validateCapacity(counts, registrationType) {
  if (Number(counts.total) >= APP.MAX_CAPACITY) return { ok: false, code: 'CAPACITY_FULL' };
  if (registrationType === 'SCI_MATH' && Number(counts.scienceMath) >= APP.SCI_MATH_QUOTA) {
    return { ok: false, code: 'SCI_MATH_FULL' };
  }
  return { ok: true };
}

function getActiveRegistrations_() {
  return rowsAsObjects_(APP.SHEETS.REGISTRATIONS).filter(row => String(row.registration_status) !== 'CANCELLED');
}

function getRegistrationCounts_() {
  const rows = getActiveRegistrations_();
  return {
    total: rows.length,
    scienceMath: rows.filter(row => String(row.registration_type) === 'SCI_MATH').length,
    paid: rows.filter(row => ['PAID','CONFIRMED','CHECKED_IN'].includes(String(row.payment_status))).length
  };
}

function getEventStatus() {
  const settings = getSettings_();
  const counts = getRegistrationCounts_();
  const maxCapacity = Number(settings.MAX_CAPACITY || APP.MAX_CAPACITY);
  const quota = Number(settings.SCI_MATH_QUOTA || APP.SCI_MATH_QUOTA);
  const open = String(settings.REGISTRATION_OPEN || 'TRUE').toUpperCase() === 'TRUE';
  return {
    total: counts.total,
    remaining: Math.max(0, maxCapacity - counts.total),
    scienceMath: counts.scienceMath,
    scienceMathRemaining: Math.max(0, quota - counts.scienceMath),
    paid: counts.paid,
    registrationOpen: open && counts.total < maxCapacity,
    fee: Number(settings.FEE || APP.FEE)
  };
}

function requiredRegistrationFields_() {
  return ['student_id','prefix','first_name','last_name','nickname','grade','room','number','program','phone','registration_type'];
}

function validateRegistrationPayload_(payload) {
  const missing = requiredRegistrationFields_().filter(key => !String(payload[key] ?? '').trim());
  if (missing.length) return { ok:false, code:'INVALID_INPUT', message:`กรุณากรอกข้อมูลให้ครบ: ${missing.join(', ')}` };
  if (!['MARKET_REP','SCI_MATH'].includes(String(payload.registration_type))) {
    return { ok:false, code:'INVALID_TYPE', message:'ประเภทผู้สมัครไม่ถูกต้อง' };
  }
  if (payload.registration_type === 'MARKET_REP') {
    if (!String(payload.group_name || '').trim() || !String(payload.product_type || '').trim()) {
      return { ok:false, code:'MARKET_INFO_REQUIRED', message:'กรุณากรอกชื่อกลุ่มและประเภทสินค้า' };
    }
    if (!['อาหาร','เครื่องดื่ม','ขนม'].includes(String(payload.product_type))) {
      return { ok:false, code:'INVALID_PRODUCT_TYPE', message:'ประเภทสินค้าต้องเป็น อาหาร เครื่องดื่ม หรือขนม' };
    }
  }
  return { ok:true };
}

function nextRegistrationId_(rows) {
  const max = rows.reduce((highest, row) => {
    const match = String(row.registration_id || '').match(/(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return APP.REGISTRATION_PREFIX + String(max + 1).padStart(3, '0');
}

function registerStudent(payload) {
  const validation = validateRegistrationPayload_(payload || {});
  if (!validation.ok) throw apiError_(validation.code, validation.message);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const settings = getSettings_();
    if (String(settings.REGISTRATION_OPEN || 'TRUE').toUpperCase() !== 'TRUE') {
      throw apiError_('REGISTRATION_CLOSED', 'ขณะนี้ปิดรับสมัคร');
    }

    const active = getActiveRegistrations_();
    const duplicate = active.some(row => String(row.student_id) === String(payload.student_id).trim());
    if (duplicate) throw apiError_('DUPLICATE_STUDENT', 'รหัสนักเรียนนี้สมัครแล้ว');

    const counts = {
      total: active.length,
      scienceMath: active.filter(row => String(row.registration_type) === 'SCI_MATH').length
    };
    const capacity = validateCapacity(counts, String(payload.registration_type));
    if (!capacity.ok) {
      const message = capacity.code === 'SCI_MATH_FULL' ? 'โควตานักเรียนวิทย์–คณิตเต็มแล้ว' : 'จำนวนผู้สมัครเต็มแล้ว';
      throw apiError_(capacity.code, message);
    }

    const allRows = rowsAsObjects_(APP.SHEETS.REGISTRATIONS);
    const registrationId = nextRegistrationId_(allRows);
    const publicToken = Utilities.getUuid().replace(/-/g, '');
    const now = new Date();
    appendObject_(APP.SHEETS.REGISTRATIONS, {
      registration_id: registrationId,
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
      registration_type: String(payload.registration_type),
      group_name: String(payload.group_name || '').trim(),
      product_type: String(payload.product_type || '').trim(),
      product_name: String(payload.product_name || '').trim(),
      soft_power_concept: String(payload.soft_power_concept || '').trim(),
      public_token: publicToken,
      registration_status: 'REGISTERED',
      payment_status: 'PENDING_PAYMENT',
      created_at: now,
      updated_at: now
    });
    logAction_('PUBLIC', 'REGISTER', 'REGISTRATION', registrationId, { registration_type: payload.registration_type });
    return { registration_id: registrationId, public_token: publicToken, payment_status: 'PENDING_PAYMENT' };
  } finally {
    lock.releaseLock();
  }
}
