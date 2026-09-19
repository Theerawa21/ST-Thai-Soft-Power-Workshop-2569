import { apiRequest } from './api.js';
import { formatMoney, showMessage } from './ui.js';

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
    document.querySelector('#rNumber').textContent = data.registration_id;
    document.querySelector('#rRegistration').textContent = data.registration_id;
    document.querySelector('#rName').textContent = data.student_name;
    document.querySelector('#rClass').textContent = data.grade_room;
    document.querySelector('#rItem').textContent = 'ค่าลงทะเบียนเข้าร่วม Workshop Thai Soft Power 2569';
    document.querySelector('#rAmount').textContent = formatMoney(100);
    document.querySelector('#rTotal').textContent = formatMoney(100);
    document.querySelector('#rAmountText').textContent = 'หนึ่งร้อยบาทถ้วน';
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
