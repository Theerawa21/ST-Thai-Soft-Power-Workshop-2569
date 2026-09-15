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
  if (payload.registration_id) row = findBy_(APP.SHEETS.REGISTRATIONS, 'registration_id', payload.registration_id);
  if (!row && payload.public_token) row = findBy_(APP.SHEETS.REGISTRATIONS, 'public_token', payload.public_token);
  if (!row) throw apiError_('NOT_FOUND', 'ไม่พบข้อมูลผู้สมัคร');

  const receipt = rowsAsObjects_(APP.SHEETS.RECEIPTS).find(r =>
    String(r.registration_id) === String(row.registration_id) && String(r.receipt_status) === 'ISSUED'
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
  if (!['CASH','TRANSFER'].includes(method)) throw apiError_('INVALID_PAYMENT_METHOD', 'วิธีชำระเงินไม่ถูกต้อง');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const registration = findBy_(APP.SHEETS.REGISTRATIONS, 'registration_id', payload.registration_id);
    if (!registration) throw apiError_('NOT_FOUND', 'ไม่พบข้อมูลผู้สมัคร');
    if (String(registration.registration_status) === 'CANCELLED') throw apiError_('CANCELLED', 'รายการสมัครถูกยกเลิกแล้ว');

    const existingReceipt = rowsAsObjects_(APP.SHEETS.RECEIPTS).find(r =>
      String(r.registration_id) === String(registration.registration_id) && String(r.receipt_status) === 'ISSUED'
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
  if (String(receipt.receipt_status) === 'VOID') return { receipt_number: receiptNumber, receipt_status: 'VOID' };
  updateObjectRow_(APP.SHEETS.RECEIPTS, receipt._row, { receipt_status: 'VOID' });
  logAction_(admin.actor, 'VOID_RECEIPT', 'RECEIPT', receiptNumber, {});
  return { receipt_number: receiptNumber, receipt_status: 'VOID' };
}
