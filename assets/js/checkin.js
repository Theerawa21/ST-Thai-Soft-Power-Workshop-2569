import { apiRequest } from './api.js';
import { getAdminToken, showMessage } from './ui.js';

function parseToken(value) {
  try { return new URL(value).searchParams.get('token') || value; } catch { return value; }
}

async function checkIn(value) {
  const token = parseToken(value);
  try {
    const { data } = await apiRequest('checkIn', { token }, { adminToken: getAdminToken() });
    const text = data.already_checked_in ? `เช็กอินแล้วก่อนหน้านี้ • ${data.registration_id}` : `เช็กอินสำเร็จ • ${data.full_name || data.registration_id}`;
    showMessage(text, 'success');
  } catch (error) { showMessage(error.message, 'error'); }
}

if (typeof document !== 'undefined') {
  if (window.Html5QrcodeScanner) {
    const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 230, height: 230 } }, false);
    scanner.render(decoded => checkIn(decoded), () => {});
  }
  document.querySelector('#checkinManualForm')?.addEventListener('submit', e => {
    e.preventDefault();
    checkIn(String(new FormData(e.currentTarget).get('lookup') || '').trim());
  });
}
