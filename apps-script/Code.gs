const APP = Object.freeze({
  TIMEZONE: 'Asia/Bangkok',
  MAX_CAPACITY: 200,
  MARKET_REP_QUOTA: 150,
  SCI_MATH_QUOTA: 50,
  FEE: 100,
  REGISTRATION_PREFIX: 'GBM2569-',
  RECEIPT_PREFIX: 'GBM-R2569-',
  SHEETS: {
    REGISTRATIONS: 'Registrations',
    PAYMENTS: 'Payments',
    RECEIPTS: 'Receipts',
    CHECKIN: 'CheckIn',
    ADMINS: 'Admins',
    SETTINGS: 'Settings',
    LOGS: 'Logs'
  }
});

const HEADERS = Object.freeze({
  Registrations: [
    'registration_id','student_id','prefix','first_name','last_name','nickname',
    'grade','room','number','program','phone','registration_type','group_name',
    'product_type','product_name','soft_power_concept','public_token',
    'registration_status','payment_status','created_at','updated_at'
  ],
  Payments: [
    'payment_id','registration_id','amount','payment_method','payment_status',
    'transfer_date','transfer_time','slip_url','received_by','received_at','note'
  ],
  Receipts: [
    'receipt_id','receipt_number','registration_id','payment_id','amount',
    'payment_method','issued_at','issued_by','receipt_status'
  ],
  CheckIn: ['checkin_id','registration_id','checkin_date','checkin_time','checked_by','status'],
  Admins: ['email','display_name','role','active','created_at'],
  Settings: ['key','value','updated_at'],
  Logs: ['log_id','timestamp','actor','action','entity_type','entity_id','details_json']
});

function defaultSettings_() {
  return {
    EVENT_NAME: 'Workshop Thai Soft Power',
    EVENT_DATE: '2026-10-05',
    START_TIME: '08:30',
    END_TIME: '15:00',
    VENUE: 'ห้องประชุมชั้น 5 อาคารเซนต์เทเรซา',
    MAX_CAPACITY: '200',
    MARKET_REP_QUOTA: '150',
    SCI_MATH_QUOTA: '50',
    FEE: '100',
    REGISTRATION_DEADLINE: '2026-09-18',
    REGISTRATION_OPEN: 'TRUE',
    LINE_GROUP_URL: ''
  };
}

function apiError_(code, message) {
  const error = new Error(message || code);
  error.code = code;
  return error;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return jsonResponse_({
    ok: true,
    data: {
      service: 'ST Thai Soft Power Workshop 2569 API',
      status: 'online'
    }
  });
}

function doPost(e) {
  try {
    const request = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(request.action || '');
    const payload = request.payload || {};
    const options = request.options || {};

    const publicActions = {
      eventStatus: () => getEventStatus(),
      register: () => registerStudent(payload),
      studentStatus: () => getStudentStatus(payload),
      receipt: () => getStudentReceipt(payload)
    };

    const adminActions = {
      adminDashboard: () => getAdminDashboard(options),
      lookupForPayment: () => lookupForPayment(payload, options),
      confirmPayment: () => confirmPayment(payload, options),
      checkIn: () => checkInStudent(payload, options)
    };

    if (publicActions[action]) {
      return jsonResponse_({ ok: true, data: publicActions[action]() });
    }

    if (adminActions[action]) {
      requireAdmin_(options);
      return jsonResponse_({ ok: true, data: adminActions[action]() });
    }

    return jsonResponse_({
      ok: false,
      error: { code: 'UNKNOWN_ACTION', message: 'ไม่พบคำสั่งที่ร้องขอ' }
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: {
        code: error.code || 'SERVER_ERROR',
        message: error.message || 'เกิดข้อผิดพลาดในระบบ'
      }
    });
  }
}

function getSpreadsheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('ยังไม่ได้ตั้งค่า Script Property: SPREADSHEET_ID');
  }
  return SpreadsheetApp.openById(spreadsheetId);
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

function validateCapacity(counts, registrationType) {
  if (Number(counts.total) >= APP.MAX_CAPACITY) return { ok: false, code: 'CAPACITY_FULL' };
  if (registrationType === 'MARKET_REP' && Number(counts.marketRepresentatives) >= APP.MARKET_REP_QUOTA) {
    return { ok: false, code: 'MARKET_REP_FULL' };
  }
  if (registrationType === 'SCI_MATH' && Number(counts.scienceMath) >= APP.SCI_MATH_QUOTA) {
    return { ok: false, code: 'SCI_MATH_FULL' };
  }
  return { ok: true };
}

function getActiveRegistrations_() {
  return rowsAsObjects_(APP.SHEETS.REGISTRATIONS)
    .filter(row => String(row.registration_status) !== 'CANCELLED');
}

function getRegistrationCounts_() {
  const rows = getActiveRegistrations_();
  return {
    total: rows.length,
    marketRepresentatives: rows.filter(row => String(row.registration_type) === 'MARKET_REP').length,
    scienceMath: rows.filter(row => String(row.registration_type) === 'SCI_MATH').length,
    paid: rows.filter(row => ['PAID','CONFIRMED','CHECKED_IN'].includes(String(row.payment_status))).length
  };
}

function getEventStatus() {
  const settings = getSettings_();
  const counts = getRegistrationCounts_();
  const maxCapacity = Number(settings.MAX_CAPACITY || APP.MAX_CAPACITY);
  const marketQuota = Number(settings.MARKET_REP_QUOTA || APP.MARKET_REP_QUOTA);
  const scienceMathQuota = Number(settings.SCI_MATH_QUOTA || APP.SCI_MATH_QUOTA);
  const open = String(settings.REGISTRATION_OPEN || 'TRUE').toUpperCase() === 'TRUE';
  return {
    total: counts.total,
    remaining: Math.max(0, maxCapacity - counts.total),
    marketRepresentatives: counts.marketRepresentatives,
    marketRepresentativesRemaining: Math.max(0, marketQuota - counts.marketRepresentatives),
    scienceMath: counts.scienceMath,
    scienceMathRemaining: Math.max(0, scienceMathQuota - counts.scienceMath),
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
  if (missing.length) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      message: `กรุณากรอกข้อมูลให้ครบ: ${missing.join(', ')}`
    };
  }

  if (!['MARKET_REP','SCI_MATH'].includes(String(payload.registration_type))) {
    return { ok: false, code: 'INVALID_TYPE', message: 'ประเภทผู้สมัครไม่ถูกต้อง' };
  }

  if (payload.registration_type === 'MARKET_REP') {
    if (!String(payload.group_name || '').trim() || !String(payload.product_type || '').trim()) {
      return {
        ok: false,
        code: 'MARKET_INFO_REQUIRED',
        message: 'กรุณากรอกชื่อกลุ่มและประเภทสินค้า'
      };
    }
    if (!['อาหาร','เครื่องดื่ม','ขนม'].includes(String(payload.product_type))) {
      return {
        ok: false,
        code: 'INVALID_PRODUCT_TYPE',
        message: 'ประเภทสินค้าต้องเป็น อาหาร เครื่องดื่ม หรือขนม'
      };
    }
  }

  return { ok: true };
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
      marketRepresentatives: active.filter(row => String(row.registration_type) === 'MARKET_REP').length,
      scienceMath: active.filter(row => String(row.registration_type) === 'SCI_MATH').length
    };
    const capacity = validateCapacity(counts, String(payload.registration_type));
    if (!capacity.ok) {
      const message = capacity.code === 'SCI_MATH_FULL'
        ? 'โควตานักเรียนวิทย์–คณิตเต็มแล้ว'
        : capacity.code === 'MARKET_REP_FULL'
          ? 'โควตาตัวแทน Green Business Market เต็มแล้ว'
          : 'จำนวนผู้สมัครเต็มแล้ว';
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

    logAction_('PUBLIC', 'REGISTER', 'REGISTRATION', registrationId, {
      registration_type: payload.registration_type
    });

    return {
      registration_id: registrationId,
      public_token: publicToken,
      payment_status: 'PENDING_PAYMENT'
    };
  } finally {
    lock.releaseLock();
  }
}

function getRegistrationByPublicRef_(registrationId, publicToken) {
  const row = findBy_(APP.SHEETS.REGISTRATIONS, 'registration_id', registrationId);
  if (!row) throw apiError_('NOT_FOUND', 'ไม่พบข้อมูลการสมัคร');
  if (String(row.public_token) !== String(publicToken || '')) {
    throw apiError_('INVALID_TOKEN', 'ข้อมูลยืนยันไม่ถูกต้อง');
  }
  return row;
}

function sanitizeStudentRegistration_(row) {
  return {
    registration_id: row.registration_id,
    student_id: row.student_id,
    prefix: row.prefix,
    first_name: row.first_name,
    last_name: row.last_name,
    nickname: row.nickname,
    grade: row.grade,
    room: row.room,
    number: row.number,
    program: row.program,
    registration_type: row.registration_type,
    group_name: row.group_name,
    product_type: row.product_type,
    product_name: row.product_name,
    soft_power_concept: row.soft_power_concept,
    registration_status: row.registration_status,
    payment_status: row.payment_status
  };
}

function getStudentStatus(payload) {
  payload = payload || {};
  const row = getRegistrationByPublicRef_(payload.registration_id, payload.public_token);
  const settings = getSettings_();
  const receipt = rowsAsObjects_(APP.SHEETS.RECEIPTS).find(r =>
    String(r.registration_id) === String(row.registration_id) &&
    String(r.receipt_status) === 'ISSUED'
  );

  return {
    registration: sanitizeStudentRegistration_(row),
    receipt_number: receipt ? receipt.receipt_number : null,
    line_group_url: String(settings.LINE_GROUP_URL || ''),
    event: {
      name: String(settings.EVENT_NAME || 'Workshop Thai Soft Power'),
      date: String(settings.EVENT_DATE || '2026-10-05'),
      start_time: String(settings.START_TIME || '08:30'),
      end_time: String(settings.END_TIME || '15:00'),
      venue: String(settings.VENUE || '')
    }
  };
}

function getStudentReceipt(payload) {
  payload = payload || {};
  const registration = getRegistrationByPublicRef_(payload.registration_id, payload.public_token);
  const receipt = rowsAsObjects_(APP.SHEETS.RECEIPTS).find(r =>
    String(r.registration_id) === String(registration.registration_id) &&
    String(r.receipt_status) === 'ISSUED'
  );

  if (!receipt) throw apiError_('RECEIPT_NOT_READY', 'ยังไม่มีใบรับเงินสำหรับรายการนี้');

  return {
    receipt_number: receipt.receipt_number,
    registration_id: registration.registration_id,
    student_name: `${registration.prefix}${registration.first_name} ${registration.last_name}`,
    grade_room: `${registration.grade}/${registration.room}`,
    amount: Number(receipt.amount),
    amount_text: 'หนึ่งร้อยบาทถ้วน',
    payment_method: receipt.payment_method,
    issued_at: receipt.issued_at,
    issued_by: receipt.issued_by,
    receipt_status: receipt.receipt_status,
    item_description: 'ค่าเข้าร่วมกิจกรรม Workshop Thai Soft Power'
  };
}

function nextReceiptNumber_(rows) {
  const max = rows.reduce((highest, row) => {
    const match = String(row.receipt_number || '').match(/(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return APP.RECEIPT_PREFIX + String(max + 1).padStart(4, '0');
}

function lookupForPayment(payload, options) {
  requireAdmin_(options);
  payload = payload || {};
  let row = null;

  if (payload.registration_id) {
    row = findBy_(APP.SHEETS.REGISTRATIONS, 'registration_id', payload.registration_id);
  }
  if (!row && payload.public_token) {
    row = findBy_(APP.SHEETS.REGISTRATIONS, 'public_token', payload.public_token);
  }
  if (!row) throw apiError_('NOT_FOUND', 'ไม่พบข้อมูลผู้สมัคร');

  const receipt = rowsAsObjects_(APP.SHEETS.RECEIPTS).find(r =>
    String(r.registration_id) === String(row.registration_id) &&
    String(r.receipt_status) === 'ISSUED'
  );

  return {
    registration_id: row.registration_id,
    student_name: `${row.prefix}${row.first_name} ${row.last_name}`,
    nickname: row.nickname,
    grade_room: `${row.grade}/${row.room}`,
    registration_type: row.registration_type,
    payment_status: row.payment_status,
    amount: APP.FEE,
    receipt_number: receipt ? receipt.receipt_number : null
  };
}

function confirmPayment(payload, options) {
  const admin = requireAdmin_(options);
  payload = payload || {};
  const method = String(payload.payment_method || '').toUpperCase();

  if (!['CASH','TRANSFER'].includes(method)) {
    throw apiError_('INVALID_PAYMENT_METHOD', 'วิธีชำระเงินไม่ถูกต้อง');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const registration = findBy_(APP.SHEETS.REGISTRATIONS, 'registration_id', payload.registration_id);
    if (!registration) throw apiError_('NOT_FOUND', 'ไม่พบข้อมูลผู้สมัคร');
    if (String(registration.registration_status) === 'CANCELLED') {
      throw apiError_('CANCELLED', 'รายการสมัครถูกยกเลิกแล้ว');
    }

    const existingReceipt = rowsAsObjects_(APP.SHEETS.RECEIPTS).find(r =>
      String(r.registration_id) === String(registration.registration_id) &&
      String(r.receipt_status) === 'ISSUED'
    );

    if (existingReceipt) {
      return {
        registration_id: registration.registration_id,
        payment_status: 'PAID',
        receipt_number: existingReceipt.receipt_number,
        already_confirmed: true
      };
    }

    const now = new Date();
    const paymentId = 'PAY-' + Utilities.getUuid();

    appendObject_(APP.SHEETS.PAYMENTS, {
      payment_id: paymentId,
      registration_id: registration.registration_id,
      amount: APP.FEE,
      payment_method: method,
      payment_status: 'PAID',
      transfer_date: method === 'TRANSFER' ? String(payload.transfer_date || '') : '',
      transfer_time: method === 'TRANSFER' ? String(payload.transfer_time || '') : '',
      slip_url: method === 'TRANSFER' ? String(payload.slip_url || '') : '',
      received_by: admin.actor,
      received_at: now,
      note: String(payload.note || '')
    });

    const receipts = rowsAsObjects_(APP.SHEETS.RECEIPTS);
    const receiptNumber = nextReceiptNumber_(receipts);

    appendObject_(APP.SHEETS.RECEIPTS, {
      receipt_id: Utilities.getUuid(),
      receipt_number: receiptNumber,
      registration_id: registration.registration_id,
      payment_id: paymentId,
      amount: APP.FEE,
      payment_method: method,
      issued_at: now,
      issued_by: admin.actor,
      receipt_status: 'ISSUED'
    });

    updateObjectRow_(APP.SHEETS.REGISTRATIONS, registration._row, {
      registration_status: 'CONFIRMED',
      payment_status: 'PAID',
      updated_at: now
    });

    logAction_(admin.actor, 'CONFIRM_PAYMENT', 'REGISTRATION', registration.registration_id, {
      method,
      receipt_number: receiptNumber
    });

    return {
      registration_id: registration.registration_id,
      payment_status: 'PAID',
      receipt_number: receiptNumber,
      amount: APP.FEE,
      payment_method: method
    };
  } finally {
    lock.releaseLock();
  }
}

function voidReceipt(receiptNumber, options) {
  const admin = requireAdmin_(options);
  const receipt = findBy_(APP.SHEETS.RECEIPTS, 'receipt_number', receiptNumber);

  if (!receipt) throw apiError_('NOT_FOUND', 'ไม่พบใบรับเงิน');
  if (String(receipt.receipt_status) === 'VOID') {
    return { receipt_number: receiptNumber, receipt_status: 'VOID' };
  }

  updateObjectRow_(APP.SHEETS.RECEIPTS, receipt._row, { receipt_status: 'VOID' });
  logAction_(admin.actor, 'VOID_RECEIPT', 'RECEIPT', receiptNumber, {});
  return { receipt_number: receiptNumber, receipt_status: 'VOID' };
}

function getAdminDashboard(options) {
  requireAdmin_(options);
  const registrations = getActiveRegistrations_();
  const payments = rowsAsObjects_(APP.SHEETS.PAYMENTS)
    .filter(row => String(row.payment_status) === 'PAID');
  const receipts = rowsAsObjects_(APP.SHEETS.RECEIPTS)
    .filter(row => String(row.receipt_status) === 'ISSUED');
  const checkins = rowsAsObjects_(APP.SHEETS.CHECKIN)
    .filter(row => String(row.status) === 'CHECKED_IN');

  const paidRegistrationIds = new Set(payments.map(row => String(row.registration_id)));
  const totalRevenue = payments.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  return {
    total: registrations.length,
    remaining: Math.max(0, APP.MAX_CAPACITY - registrations.length),
    scienceMath: registrations.filter(row => String(row.registration_type) === 'SCI_MATH').length,
    marketRepresentatives: registrations.filter(row => String(row.registration_type) === 'MARKET_REP').length,
    paid: paidRegistrationIds.size,
    unpaid: registrations.filter(row => !paidRegistrationIds.has(String(row.registration_id))).length,
    receiptsIssued: receipts.length,
    checkedIn: checkins.length,
    totalRevenue,
    recentRegistrations: registrations
      .slice(-10)
      .reverse()
      .map(row => ({
        registration_id: row.registration_id,
        student_name: `${row.prefix}${row.first_name} ${row.last_name}`,
        grade_room: `${row.grade}/${row.room}`,
        registration_type: row.registration_type,
        payment_status: row.payment_status,
        created_at: row.created_at
      }))
  };
}

function validateCheckInEligibility(paymentStatus) {
  if (String(paymentStatus) !== 'PAID') {
    return { ok: false, code: 'PAYMENT_REQUIRED' };
  }
  return { ok: true };
}

function checkInStudent(payload, options) {
  const admin = requireAdmin_(options);
  payload = payload || {};

  const registration = payload.registration_id
    ? findBy_(APP.SHEETS.REGISTRATIONS, 'registration_id', payload.registration_id)
    : findBy_(APP.SHEETS.REGISTRATIONS, 'public_token', payload.public_token);

  if (!registration) throw apiError_('NOT_FOUND', 'ไม่พบข้อมูลผู้สมัคร');

  const eligibility = validateCheckInEligibility(registration.payment_status);
  if (!eligibility.ok) {
    throw apiError_(eligibility.code, 'ยังไม่ได้ยืนยันการชำระเงิน');
  }

  const existing = rowsAsObjects_(APP.SHEETS.CHECKIN).find(row =>
    String(row.registration_id) === String(registration.registration_id) &&
    String(row.status) === 'CHECKED_IN'
  );

  if (existing) {
    return {
      registration_id: registration.registration_id,
      student_name: `${registration.prefix}${registration.first_name} ${registration.last_name}`,
      grade_room: `${registration.grade}/${registration.room}`,
      status: 'CHECKED_IN',
      already_checked_in: true,
      checkin_date: existing.checkin_date,
      checkin_time: existing.checkin_time
    };
  }

  const now = new Date();
  const date = Utilities.formatDate(now, APP.TIMEZONE, 'yyyy-MM-dd');
  const time = Utilities.formatDate(now, APP.TIMEZONE, 'HH:mm:ss');

  appendObject_(APP.SHEETS.CHECKIN, {
    checkin_id: Utilities.getUuid(),
    registration_id: registration.registration_id,
    checkin_date: date,
    checkin_time: time,
    checked_by: admin.actor,
    status: 'CHECKED_IN'
  });

  updateObjectRow_(APP.SHEETS.REGISTRATIONS, registration._row, {
    registration_status: 'CHECKED_IN',
    updated_at: now
  });

  logAction_(admin.actor, 'CHECK_IN', 'REGISTRATION', registration.registration_id, { date, time });

  return {
    registration_id: registration.registration_id,
    student_name: `${registration.prefix}${registration.first_name} ${registration.last_name}`,
    grade_room: `${registration.grade}/${registration.room}`,
    status: 'CHECKED_IN',
    already_checked_in: false,
    checkin_date: date,
    checkin_time: time
  };
}

function configureAdminToken(token) {
  const value = String(token || '').trim();
  if (value.length < 20) {
    throw new Error('Admin token ต้องมีอย่างน้อย 20 ตัวอักษร');
  }
  PropertiesService.getScriptProperties().setProperty('ADMIN_TOKEN', value);
  return { ok: true };
}

function requireAdmin_(options) {
  options = options || {};
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');
  if (!expected) {
    throw apiError_('ADMIN_NOT_CONFIGURED', 'ยังไม่ได้ตั้งค่า Admin token');
  }

  const supplied = String(options.adminToken || '');
  if (!supplied || supplied !== expected) {
    throw apiError_('UNAUTHORIZED', 'ไม่มีสิทธิ์ดำเนินการ');
  }

  return { actor: 'ACADEMIC_OFFICE' };
}

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

  logAction_('SYSTEM', 'SETUP_SYSTEM', 'SYSTEM', 'SETUP', {
    sheets: Object.keys(HEADERS)
  });

  return { ok: true, message: 'ตั้งค่าระบบเรียบร้อยแล้ว' };
}
