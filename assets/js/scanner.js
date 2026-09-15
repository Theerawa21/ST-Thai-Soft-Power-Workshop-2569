import { apiRequest } from './api.js';
import { showMessage } from './ui.js';

let currentRegistrationId = '';
let scanner = null;
const token = () => sessionStorage.getItem('gbm_admin_token') || '';

function parseRegistrationId(text) {
  const raw = String(text || '').trim();
  if (/^GBM2569-\d+$/i.test(raw)) return raw.toUpperCase();
  try {
    const url = new URL(raw);
    return (url.searchParams.get('id') || '').toUpperCase();
  } catch (_) {
    return '';
  }
}

async function lookupRegistration(registrationId) {
  if (!token()) {
    showMessage('#scannerMessage', 'กรุณาเข้าสู่ระบบผู้ดูแลจากหน้า Dashboard ก่อน', 'error');
    return;
  }
  try {
    const { data } = await apiRequest('lookupForPayment', { registration_id: registrationId }, { adminToken: token() });
    currentRegistrationId = data.registration_id;
    document.querySelector('#pId').textContent = data.registration_id;
    document.querySelector('#pName').textContent = data.student_name;
    document.querySelector('#pClass').textContent = data.grade_room;
    document.querySelector('#pStatus').textContent = data.receipt_number ? `ชำระแล้ว (${data.receipt_number})` : 'รอชำระเงิน';
    document.querySelector('#paymentPanel').hidden = false;
    const button = document.querySelector('#confirmPayment');
    button.disabled = Boolean(data.receipt_number);
    button.textContent = data.receipt_number ? 'รายการนี้ชำระแล้ว' : 'ยืนยันรับเงิน 100 บาท';
  } catch (error) {
    showMessage('#scannerMessage', error.message, 'error');
  }
}

async function startScanner() {
  if (!window.Html5Qrcode) {
    showMessage('#scannerMessage', 'ไม่สามารถโหลดตัวสแกน QR ได้ กรุณากรอกเลขที่สมัครแทน', 'error');
    return;
  }
  if (!scanner) scanner = new Html5Qrcode('reader');
  try {
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      async decodedText => {
        const id = parseRegistrationId(decodedText);
        if (id) {
          await scanner.stop();
          await lookupRegistration(id);
        }
      },
      () => {}
    );
  } catch (error) {
    showMessage('#scannerMessage', `เปิดกล้องไม่ได้: ${error}`, 'error');
  }
}

document.querySelector('#startScanner')?.addEventListener('click', startScanner);
document.querySelector('#lookupManual')?.addEventListener('click', () => {
  const id = parseRegistrationId(document.querySelector('#manualId').value);
  if (!id) return showMessage('#scannerMessage', 'กรุณากรอกเลขที่สมัครให้ถูกต้อง', 'error');
  lookupRegistration(id);
});

document.querySelectorAll('input[name="payMethod"]').forEach(input => {
  input.addEventListener('change', () => {
    const transfer = document.querySelector('input[name="payMethod"]:checked')?.value === 'TRANSFER';
    document.querySelector('#transferFields').hidden = !transfer;
  });
});

document.querySelector('#confirmPayment')?.addEventListener('click', async () => {
  if (!currentRegistrationId) return;
  const method = document.querySelector('input[name="payMethod"]:checked')?.value || 'CASH';
  const button = document.querySelector('#confirmPayment');
  button.disabled = true;
  button.textContent = 'กำลังยืนยัน...';
  try {
    const payload = {
      registration_id: currentRegistrationId,
      payment_method: method,
      transfer_date: document.querySelector('#transferDate').value,
      transfer_time: document.querySelector('#transferTime').value,
      note: document.querySelector('#paymentNote').value.trim()
    };
    const { data } = await apiRequest('confirmPayment', payload, { adminToken: token() });
    const result = document.querySelector('#paymentResult');
    result.hidden = false;
    result.textContent = `ยืนยันการชำระเงินแล้ว เลขที่ใบรับเงิน ${data.receipt_number}`;
    document.querySelector('#pStatus').textContent = `ชำระแล้ว (${data.receipt_number})`;
    button.textContent = 'รายการนี้ชำระแล้ว';
  } catch (error) {
    showMessage('#scannerMessage', error.message, 'error');
    button.disabled = false;
    button.textContent = 'ยืนยันรับเงิน 100 บาท';
  }
});

const initial = new URLSearchParams(window.location.search).get('id');
if (initial) lookupRegistration(initial);
