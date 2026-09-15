import { showMessage } from './ui.js';

const params = new URLSearchParams(window.location.search);
const id = params.get('id') || localStorage.getItem('gbm_registration_id');
const token = params.get('token') || localStorage.getItem('gbm_public_token');

if (!id || !token) {
  showMessage('#successMessage', 'ไม่พบข้อมูลการสมัคร กรุณากลับไปตรวจสอบสถานะ', 'error');
} else {
  document.querySelector('#registrationId').textContent = id;
  const studentUrl = new URL('student.html', window.location.href);
  studentUrl.searchParams.set('id', id);
  studentUrl.searchParams.set('token', token);
  document.querySelector('#studentLink').href = studentUrl.toString();

  const adminLookupUrl = new URL('admin/scanner.html', window.location.href);
  adminLookupUrl.searchParams.set('id', id);
  adminLookupUrl.searchParams.set('token', token);

  if (window.QRCode) {
    new QRCode(document.querySelector('#qrCode'), {
      text: adminLookupUrl.toString(),
      width: 220,
      height: 220,
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    showMessage('#successMessage', 'ไม่สามารถสร้าง QR Code ได้ กรุณาใช้เลขที่สมัครแทน', 'error');
  }
}
