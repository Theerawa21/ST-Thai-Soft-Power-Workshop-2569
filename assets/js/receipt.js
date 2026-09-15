import { apiRequest } from './api.js';
import { formatMoney, formatThaiDate, showMessage } from './ui.js';

const params = new URLSearchParams(window.location.search);
const id = params.get('id') || localStorage.getItem('gbm_registration_id');
const token = params.get('token') || localStorage.getItem('gbm_public_token');

export function paymentMethodLabel(method) {
  return method === 'TRANSFER' ? 'โอนเงิน' : method === 'CASH' ? 'เงินสด' : method || '-';
}

async function loadReceipt() {
  if (!id || !token) {
    showMessage('#receiptMessage', 'ไม่พบข้อมูลยืนยันสำหรับเปิดใบรับเงิน', 'error');
    return;
  }
  try {
    const { data } = await apiRequest('receipt', { registration_id: id, public_token: token });
    document.querySelector('#rNumber').textContent = data.receipt_number;
    document.querySelector('#rRegistration').textContent = data.registration_id;
    document.querySelector('#rName').textContent = data.student_name;
    document.querySelector('#rClass').textContent = data.grade_room;
    document.querySelector('#rItem').textContent = data.item_description;
    document.querySelector('#rAmount').textContent = formatMoney(data.amount);
    document.querySelector('#rTotal').textContent = formatMoney(data.amount);
    document.querySelector('#rAmountText').textContent = data.amount_text;
    document.querySelector('#rMethod').textContent = paymentMethodLabel(data.payment_method);
    document.querySelector('#rIssuedAt').textContent = formatThaiDate(data.issued_at);
    document.querySelector('#rIssuedBy').textContent = data.issued_by;
    document.querySelector('#receiptContent').hidden = false;

    const backUrl = new URL('student.html', window.location.href);
    backUrl.searchParams.set('id', id);
    backUrl.searchParams.set('token', token);
    document.querySelector('#backStudent').href = backUrl.toString();
  } catch (error) {
    showMessage('#receiptMessage', error.message, 'error');
  }
}

document.querySelector('#printReceipt')?.addEventListener('click', () => window.print());
loadReceipt();
