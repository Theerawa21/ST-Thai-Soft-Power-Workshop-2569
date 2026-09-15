function canCheckInPaymentStatus_(status) {
  return status === 'PAID' || status === 'CONFIRMED';
}

function checkInStudent(payload, adminToken) {
  const actor = assertAdmin_(adminToken);
  const reg = payload.token ? findRegistrationByToken_(String(payload.token)) : findRegistrationById_(String(payload.registration_id || ''));
  if (!reg) throw apiError_('NOT_FOUND', 'ไม่พบผู้สมัคร');
  if (!canCheckInPaymentStatus_(String(reg.payment_status))) throw apiError_('PAYMENT_REQUIRED', 'ผู้สมัครยังไม่ได้ยืนยันการชำระเงิน');
  const rows = rowsToObjects_(getSheet_(SYSTEM_CONFIG.SHEETS.CHECKIN));
  const existing = rows.find(r => String(r.registration_id) === String(reg.registration_id) && String(r.status) === 'CHECKED_IN');
  if (existing) return { already_checked_in: true, registration_id: reg.registration_id, checkin_at: existing.checkin_at };
  const now = new Date();
  appendObject_(SYSTEM_CONFIG.SHEETS.CHECKIN, SHEET_HEADERS.CheckIn, {
    checkin_id: Utilities.getUuid(), registration_id: reg.registration_id, checkin_at: now, checked_by: actor, status: 'CHECKED_IN'
  });
  updateRowObject_(SYSTEM_CONFIG.SHEETS.REGISTRATIONS, reg._row, SHEET_HEADERS.Registrations, { registration_status: 'CHECKED_IN', updated_at: now });
  logAction_('CHECK_IN', reg.registration_id, {}, actor);
  return { already_checked_in: false, registration_id: reg.registration_id, full_name: `${reg.prefix}${reg.first_name} ${reg.last_name}`, checkin_at: now };
}
