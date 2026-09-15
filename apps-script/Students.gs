function getStudentStatus(payload) {
  let reg = null;
  if (payload.token) {
    reg = findRegistrationByToken_(String(payload.token));
  } else if (payload.student_id && payload.phone) {
    reg = activeRegistrations_().find(r => String(r.student_id) === String(payload.student_id).trim() && String(r.phone) === String(payload.phone).trim()) || null;
  }
  if (!reg) throw apiError_('NOT_FOUND', 'ไม่พบข้อมูลผู้สมัคร หรือข้อมูลยืนยันไม่ถูกต้อง');
  const receipt = findReceiptByRegistration_(reg.registration_id);
  return {
    registration_id: reg.registration_id,
    public_token: reg.public_token,
    full_name: `${reg.prefix}${reg.first_name} ${reg.last_name}`,
    nickname: reg.nickname,
    grade: reg.grade,
    room: reg.room,
    program: reg.program,
    registration_type: reg.registration_type,
    group_name: reg.group_name,
    product_type: reg.product_type,
    product_name: reg.product_name,
    registration_status: reg.registration_status,
    payment_status: reg.payment_status,
    receipt_number: receipt ? receipt.receipt_number : '',
    fee: SYSTEM_CONFIG.FEE
  };
}

function getStudentReceipt(payload) {
  const reg = payload.token ? findRegistrationByToken_(String(payload.token)) : null;
  if (!reg) throw apiError_('NOT_FOUND', 'ไม่พบข้อมูลผู้สมัคร');
  const receipt = findReceiptByRegistration_(reg.registration_id);
  if (!receipt) throw apiError_('RECEIPT_NOT_READY', 'ยังไม่มีใบรับเงิน กรุณาชำระเงินและรอฝ่ายวิชาการยืนยัน');
  return {
    receipt_number: receipt.receipt_number,
    registration_id: reg.registration_id,
    full_name: `${reg.prefix}${reg.first_name} ${reg.last_name}`,
    grade: reg.grade,
    room: reg.room,
    amount: Number(receipt.amount || SYSTEM_CONFIG.FEE),
    amount_text: 'หนึ่งร้อยบาทถ้วน',
    payment_method: receipt.payment_method,
    issued_at: receipt.issued_at,
    issued_by: receipt.issued_by,
    receipt_status: receipt.receipt_status
  };
}
