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

    return jsonResponse_({ ok: false, error: { code: 'UNKNOWN_ACTION', message: 'ไม่พบคำสั่งที่ร้องขอ' } });
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
