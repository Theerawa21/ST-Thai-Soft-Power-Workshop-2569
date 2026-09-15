import { apiRequest } from './api.js';
import { showMessage } from './ui.js';

const params = new URLSearchParams(window.location.search);
const id = params.get('id') || localStorage.getItem('gbm_registration_id');
const token = params.get('token') || localStorage.getItem('gbm_public_token');

async function loadStudent() {
  if (!id || !token) {
    showMessage('#studentMessage', 'ไม่พบข้อมูลยืนยัน กรุณาเปิดจากหน้าสมัครสำเร็จ', 'error');
    return;
  }
  try {
    const { data } = await apiRequest('studentStatus', { registration_id: id, public_token: token });
    const r = data.registration;
    localStorage.setItem('gbm_registration_id', id);
    localStorage.setItem('gbm_public_token', token);
    document.querySelector('#studentRegistrationId').textContent = r.registration_id;
    document.querySelector('#studentName').textContent = `${r.prefix}${r.first_name} ${r.last_name}`;
    document.querySelector('#studentClass').textContent = `${r.grade}/${r.room}`;
    document.querySelector('#studentType').textContent = r.registration_type === 'MARKET_REP' ? 'ตัวแทน Green Business Market' : 'นักเรียนแผนวิทย์–คณิต';

    const paid = r.payment_status === 'PAID';
    const statusEl = document.querySelector('#paymentStatus');
    statusEl.textContent = paid ? 'ชำระเงินแล้ว' : 'รอชำระเงิน';
    statusEl.classList.toggle('paid', paid);
    statusEl.classList.toggle('pending', !paid);

    const receiptNumber = document.querySelector('#receiptNumber');
    receiptNumber.textContent = data.receipt_number || 'ยังไม่มี';
    const receiptButton = document.querySelector('#receiptButton');
    if (data.receipt_number) {
      const receiptUrl = new URL('receipt.html', window.location.href);
      receiptUrl.searchParams.set('id', id);
      receiptUrl.searchParams.set('token', token);
      receiptButton.href = receiptUrl.toString();
      receiptButton.classList.remove('disabled');
    }

    const lineButton = document.querySelector('#lineButton');
    if (data.line_group_url) {
      lineButton.href = data.line_group_url;
      lineButton.classList.remove('disabled');
    }
    document.querySelector('#studentContent').hidden = false;
  } catch (error) {
    showMessage('#studentMessage', error.message, 'error');
  }
}

loadStudent();
