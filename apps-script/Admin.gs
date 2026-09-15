function getAdminApplicant(payload, adminToken) {
  const actor = assertAdmin_(adminToken);
  const registration = payload.token ? findRegistrationByToken_(payload.token) : findRegistrationById_(payload.registration_id);
  if (!registration) throw apiError_('NOT_FOUND', 'ไม่พบข้อมูลผู้สมัคร');
  return {
    registration: sanitizeRegistrationForAdmin_(registration),
    receipt: findReceiptByRegistration_(registration.registration_id),
    actor
  };
}

function sanitizeRegistrationForAdmin_(r) {
  const copy = {};
  SHEET_HEADERS.Registrations.forEach(k => { if (k !== 'public_token') copy[k] = r[k]; });
  return copy;
}

function getAdminDashboard(adminToken) {
  assertAdmin_(adminToken);
  const regs = activeRegistrations_();
  const payments = rowsToObjects_(getSheet_(SYSTEM_CONFIG.SHEETS.PAYMENTS)).filter(p => String(p.payment_status) === 'PAID');
  const paidTotal = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const checkins = rowsToObjects_(getSheet_(SYSTEM_CONFIG.SHEETS.CHECKIN)).filter(c => String(c.status) === 'CHECKED_IN');
  return {
    ...getEventStatus(),
    unpaid: regs.filter(r => !['PAID','CONFIRMED'].includes(String(r.payment_status))).length,
    paidAmount: paidTotal,
    checkedIn: checkins.length,
    registrations: regs.slice(-200).reverse().map(r => {
      const item = sanitizeRegistrationForAdmin_(r);
      item.checked_in = checkins.some(c => String(c.registration_id) === String(r.registration_id));
      return item;
    })
  };
}
