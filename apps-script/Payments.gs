function isPaymentMethodValid_(method) {
  return method === 'CASH' || method === 'TRANSFER';
}

function nextReceiptNumberFromRows_(rows) {
  let max = 0;
  rows.forEach(r => {
    const m = String(r.receipt_number || '').match(/^GBM-R2569-(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return `GBM-R2569-${String(max + 1).padStart(4, '0')}`;
}

function nextPaymentId_(rows) {
  let max = 0;
  rows.forEach(r => {
    const m = String(r.payment_id || '').match(/^PAY2569-(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return `PAY2569-${String(max + 1).padStart(4, '0')}`;
}

function findReceiptByRegistration_(registrationId) {
  return rowsToObjects_(getSheet_(SYSTEM_CONFIG.SHEETS.RECEIPTS))
    .find(r => String(r.registration_id) === String(registrationId) && String(r.receipt_status) !== 'VOID') || null;
}

function confirmPayment(payload, adminToken) {
  const actor = assertAdmin_(adminToken);
  const registrationId = String(payload.registration_id || '').trim();
  const method = String(payload.payment_method || '').trim().toUpperCase();
  if (!registrationId) throw apiError_('INVALID_INPUT', 'ไม่พบเลขที่สมัคร');
  if (!isPaymentMethodValid_(method)) throw apiError_('INVALID_PAYMENT_METHOD', 'วิธีชำระเงินไม่ถูกต้อง');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const reg = findRegistrationById_(registrationId);
    if (!reg || String(reg.registration_status) === 'CANCELLED') throw apiError_('NOT_FOUND', 'ไม่พบผู้สมัคร');
    const existingReceipt = findReceiptByRegistration_(registrationId);
    if (existingReceipt && ['PAID','CONFIRMED'].includes(String(reg.payment_status))) {
      return { already_paid: true, receipt: existingReceipt };
    }

    const paymentRows = rowsToObjects_(getSheet_(SYSTEM_CONFIG.SHEETS.PAYMENTS));
    const receiptRows = rowsToObjects_(getSheet_(SYSTEM_CONFIG.SHEETS.RECEIPTS));
    const paymentId = nextPaymentId_(paymentRows);
    const receiptNumber = nextReceiptNumberFromRows_(receiptRows);
    const now = new Date();

    appendObject_(SYSTEM_CONFIG.SHEETS.PAYMENTS, SHEET_HEADERS.Payments, {
      payment_id: paymentId,
      registration_id: registrationId,
      amount: SYSTEM_CONFIG.FEE,
      payment_method: method,
      payment_status: 'PAID',
      transfer_reference: String(payload.transfer_reference || '').trim(),
      transfer_note: String(payload.transfer_note || '').trim(),
      received_by: actor,
      received_at: now,
      created_at: now
    });
    appendObject_(SYSTEM_CONFIG.SHEETS.RECEIPTS, SHEET_HEADERS.Receipts, {
      receipt_id: Utilities.getUuid(),
      receipt_number: receiptNumber,
      registration_id: registrationId,
      payment_id: paymentId,
      amount: SYSTEM_CONFIG.FEE,
      payment_method: method,
      issued_at: now,
      issued_by: actor,
      receipt_status: 'ISSUED'
    });
    updateRowObject_(SYSTEM_CONFIG.SHEETS.REGISTRATIONS, reg._row, SHEET_HEADERS.Registrations, {
      payment_status: 'PAID',
      registration_status: 'CONFIRMED',
      updated_at: now
    });
    logAction_('PAYMENT_CONFIRMED', registrationId, { method, receipt_number: receiptNumber }, actor);
    return {
      already_paid: false,
      receipt: {
        receipt_number: receiptNumber,
        registration_id: registrationId,
        amount: SYSTEM_CONFIG.FEE,
        payment_method: method,
        issued_at: now,
        issued_by: actor,
        receipt_status: 'ISSUED'
      }
    };
  } finally {
    lock.releaseLock();
  }
}

function voidReceipt(payload, adminToken) {
  const actor = assertAdmin_(adminToken);
  const receiptNumber = String(payload.receipt_number || '').trim();
  if (!receiptNumber) throw apiError_('INVALID_INPUT', 'ไม่พบเลขใบรับเงิน');
  const rows = rowsToObjects_(getSheet_(SYSTEM_CONFIG.SHEETS.RECEIPTS));
  const receipt = rows.find(r => String(r.receipt_number) === receiptNumber);
  if (!receipt) throw apiError_('NOT_FOUND', 'ไม่พบใบรับเงิน');
  if (String(receipt.receipt_status) === 'VOID') return { receipt_number: receiptNumber, status: 'VOID' };
  updateRowObject_(SYSTEM_CONFIG.SHEETS.RECEIPTS, receipt._row, SHEET_HEADERS.Receipts, { receipt_status: 'VOID' });
  const paymentRows = rowsToObjects_(getSheet_(SYSTEM_CONFIG.SHEETS.PAYMENTS));
  const linkedPayment = paymentRows.find(p => String(p.payment_id) === String(receipt.payment_id));
  if (linkedPayment) updateRowObject_(SYSTEM_CONFIG.SHEETS.PAYMENTS, linkedPayment._row, SHEET_HEADERS.Payments, { payment_status: 'VOID' });
  const reg = findRegistrationById_(receipt.registration_id);
  if (reg) updateRowObject_(SYSTEM_CONFIG.SHEETS.REGISTRATIONS, reg._row, SHEET_HEADERS.Registrations, { payment_status: 'PENDING_PAYMENT', registration_status: 'REGISTERED', updated_at: new Date() });
  logAction_('RECEIPT_VOID', receipt.registration_id, { receipt_number: receiptNumber, reason: payload.reason || '' }, actor);
  return { receipt_number: receiptNumber, status: 'VOID' };
}
