import { apiRequest } from './api.js';
import { qs, showMessage } from './ui.js';

export function paymentLabel(status) {
  if (status === 'PAID' || status === 'CONFIRMED') return 'ชำระเงินเรียบร้อยแล้ว';
  return 'รอชำระเงิน 100 บาท';
}

let qrRendered = false;
async function loadStudent(token) {
  try {
    const { data } = await apiRequest('studentStatus', { token });
    document.querySelector('#studentName').textContent = data.full_name;
    document.querySelector('#studentClass').textContent = `${data.grade}/${data.room}`;
    document.querySelector('#studentRegistrationId').textContent = data.registration_id;
    const payment = document.querySelector('#studentPayment');
    payment.textContent = paymentLabel(data.payment_status);
    payment.dataset.status = data.payment_status;
    const market = document.querySelector('#marketSummary');
    if (data.registration_type === 'MARKET_REP') {
      market.hidden = false;
      market.textContent = `${data.group_name || '-'} • ${data.product_type || '-'} • ${data.product_name || 'ยังไม่ระบุเมนู'}`;
    }
    const receiptLink = document.querySelector('#receiptLink');
    if (['PAID','CONFIRMED'].includes(data.payment_status)) {
      receiptLink.hidden = false;
      receiptLink.href = `receipt.html?token=${encodeURIComponent(token)}`;
    } else {
      receiptLink.hidden = true;
    }
    const qrEl = document.querySelector('#studentQr');
    if (!qrRendered && qrEl && window.QRCode) {
      const url = new URL(location.href);
      url.search = `?token=${encodeURIComponent(token)}`;
      new QRCode(qrEl, { text: url.href, width: 190, height: 190, correctLevel: QRCode.CorrectLevel.M });
      qrRendered = true;
    }
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

if (typeof document !== 'undefined') {
  const token = qs('token');
  if (!token) showMessage('ไม่พบ Token ผู้สมัคร', 'error');
  else {
    loadStudent(token);
    setInterval(() => loadStudent(token), 10000);
  }
}
