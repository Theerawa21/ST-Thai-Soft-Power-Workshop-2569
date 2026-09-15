function apiError_(code, message) {
  const error = new Error(message || code);
  error.apiCode = code;
  return error;
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = e?.parameter?.action || 'eventStatus';
  try {
    if (action === 'eventStatus') return jsonOutput_({ ok: true, data: getEventStatus() });
    return jsonOutput_({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'กรุณาเรียก API ผ่าน POST' } });
  } catch (error) {
    return jsonOutput_({ ok: false, error: { code: error.apiCode || 'SERVER_ERROR', message: error.message || 'เกิดข้อผิดพลาด' } });
  }
}

function doPost(e) {
  try {
    const request = JSON.parse(e?.postData?.contents || '{}');
    const action = String(request.action || '');
    const payload = request.payload || {};
    const publicActions = {
      eventStatus: () => getEventStatus(),
      register: () => registerStudent(payload),
      studentStatus: () => getStudentStatus(payload),
      receipt: () => getStudentReceipt(payload)
    };
    const adminActions = {
      adminApplicant: () => getAdminApplicant(payload, request.adminToken),
      dashboard: () => getAdminDashboard(request.adminToken),
      confirmPayment: () => confirmPayment(payload, request.adminToken),
      checkIn: () => checkInStudent(payload, request.adminToken),
      voidReceipt: () => voidReceipt(payload, request.adminToken)
    };
    const fn = publicActions[action] || adminActions[action];
    if (!fn) throw apiError_('UNKNOWN_ACTION', 'ไม่พบคำสั่งที่ร้องขอ');
    return jsonOutput_({ ok: true, data: fn() });
  } catch (error) {
    return jsonOutput_({ ok: false, error: { code: error.apiCode || 'SERVER_ERROR', message: error.message || 'เกิดข้อผิดพลาด' } });
  }
}
