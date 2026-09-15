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
    String(r.registration_id) === String(row.registration_id) && String(r.receipt_status) === 'ISSUED'
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
    String(r.registration_id) === String(registration.registration_id) && String(r.receipt_status) === 'ISSUED'
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
