import { qs } from './ui.js';

function makeStudentUrl(token) {
  const url = new URL('student.html', location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('token', token);
  return url.href;
}

if (typeof document !== 'undefined') {
  const id = qs('id') || sessionStorage.getItem('gbm_registration_id');
  const token = qs('token') || sessionStorage.getItem('gbm_public_token');
  document.querySelector('#registrationId').textContent = id || '-';
  const studentUrl = token ? makeStudentUrl(token) : '';
  const link = document.querySelector('#studentLink');
  if (link && studentUrl) link.href = studentUrl;
  const qrEl = document.querySelector('#qrcode');
  if (qrEl && studentUrl && window.QRCode) new QRCode(qrEl, { text: studentUrl, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
}
