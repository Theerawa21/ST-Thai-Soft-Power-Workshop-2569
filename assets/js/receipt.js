import { apiRequest } from './api.js';
import { qs, formatMoney, formatThaiDate, showMessage } from './ui.js';

export function paymentMethodLabel(method) {
  return method === 'TRANSFER' ? 'โอนเงิน' : 'เงินสด';
}

export function renderReceipt(data) {
  const set = (selector, value) => { const el = document.querySelector(selector); if (el) el.textContent = value; };
  set('[data-receipt-number]', data.receipt_number);
  set('[data-registration-id]', data.registration_id);
  set('[data-full-name]', data.full_name);
  set('[data-class]', `${data.grade}/${data.room}`);
  set('[data-amount]', formatMoney(data.amount));
  set('[data-amount-text]', data.amount_text || 'หนึ่งร้อยบาทถ้วน');
  set('[data-method]', paymentMethodLabel(data.payment_method));
  set('[data-issued-at]', formatThaiDate(data.issued_at));
  set('[data-issued-by]', data.issued_by || 'ฝ่ายวิชาการ');
  set('[data-status]', data.receipt_status === 'VOID' ? 'ยกเลิก' : 'ชำระเงินเรียบร้อยแล้ว');
}

if (typeof document !== 'undefined') {
  const token = qs('token');
  if (!token) showMessage('ไม่พบ Token ผู้สมัคร', 'error');
  else apiRequest('receipt', { token }).then(({ data }) => renderReceipt(data)).catch(error => showMessage(error.message, 'error'));
  document.querySelector('#printReceipt')?.addEventListener('click', () => window.print());
}
