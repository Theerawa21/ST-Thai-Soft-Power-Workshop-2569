import { apiRequest } from './api.js';
import { getAdminToken, qs, showMessage } from './ui.js';

function parseScan(value) {
  try {
    const url = new URL(value);
    return { token: url.searchParams.get('token') || '', registration_id: url.searchParams.get('id') || '' };
  } catch {
    return value.startsWith('GBM2569-') ? { registration_id: value } : { token: value };
  }
}

let currentRegistration = null;

async function lookup(ref) {
  const token = getAdminToken();
  if (!token) return showMessage('กรุณาเข้าสู่ระบบผู้ดูแลก่อน', 'error');
  try {
    const { data } = await apiRequest('adminApplicant', ref, { adminToken: token });
    currentRegistration = data.registration;
    const box = document.querySelector('#applicantCard');
    box.hidden = false;
    box.querySelector('[data-name]').textContent = `${currentRegistration.prefix}${currentRegistration.first_name} ${currentRegistration.last_name}`;
    box.querySelector('[data-id]').textContent = currentRegistration.registration_id;
    box.querySelector('[data-class]').textContent = `${currentRegistration.grade}/${currentRegistration.room}`;
    box.querySelector('[data-payment]').textContent = ['PAID','CONFIRMED'].includes(currentRegistration.payment_status) ? 'ชำระเงินแล้ว' : 'รอชำระเงิน';
    const form = document.querySelector('#paymentForm');
    const paid = ['PAID','CONFIRMED'].includes(currentRegistration.payment_status);
    form.hidden = paid;
    if (paid && data.receipt) document.querySelector('#existingReceipt').textContent = `ใบรับเงิน ${data.receipt.receipt_number}`;
  } catch (error) { showMessage(error.message, 'error'); }
}

async function startScanner() {
  if (!window.Html5QrcodeScanner) return;
  const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 230, height: 230 } }, false);
  scanner.render(decoded => { scanner.clear(); lookup(parseScan(decoded)); }, () => {});
}

if (typeof document !== 'undefined') {
  const id = qs('id');
  const token = qs('token');
  if (id || token) lookup({ registration_id: id || '', token: token || '' });
  startScanner();
  document.querySelector('#manualLookupForm')?.addEventListener('submit', e => {
    e.preventDefault();
    lookup(parseScan(String(new FormData(e.currentTarget).get('lookup') || '').trim()));
  });
  document.querySelector('#paymentForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentRegistration) return;
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const { data } = await apiRequest('confirmPayment', {
        registration_id: currentRegistration.registration_id,
        payment_method: values.payment_method,
        transfer_reference: values.transfer_reference || '',
        transfer_note: values.transfer_note || ''
      }, { adminToken: getAdminToken() });
      showMessage(`ยืนยันรับเงินแล้ว • ${data.receipt.receipt_number}`, 'success');
      form.hidden = true;
      document.querySelector('#existingReceipt').textContent = `ใบรับเงิน ${data.receipt.receipt_number}`;
    } catch (error) {
      showMessage(error.message, 'error');
      button.disabled = false;
    }
  });
}
