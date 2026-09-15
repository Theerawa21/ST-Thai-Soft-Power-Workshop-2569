function getAdminDashboard(options) {
  requireAdmin_(options);
  const registrations = getActiveRegistrations_();
  const payments = rowsAsObjects_(APP.SHEETS.PAYMENTS).filter(row => String(row.payment_status) === 'PAID');
  const receipts = rowsAsObjects_(APP.SHEETS.RECEIPTS).filter(row => String(row.receipt_status) === 'ISSUED');
  const checkins = rowsAsObjects_(APP.SHEETS.CHECKIN).filter(row => String(row.status) === 'CHECKED_IN');

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
