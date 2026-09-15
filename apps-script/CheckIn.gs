function validateCheckInEligibility(paymentStatus) {
  if (String(paymentStatus) !== 'PAID') return { ok: false, code: 'PAYMENT_REQUIRED' };
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
  if (!eligibility.ok) throw apiError_(eligibility.code, 'ยังไม่ได้ยืนยันการชำระเงิน');

  const existing = rowsAsObjects_(APP.SHEETS.CHECKIN).find(row =>
    String(row.registration_id) === String(registration.registration_id) && String(row.status) === 'CHECKED_IN'
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
