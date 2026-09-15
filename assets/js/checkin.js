import { apiRequest } from './api.js';
import { showMessage } from './ui.js';

let scanner = null;
const token = () => sessionStorage.getItem('gbm_admin_token') || '';

function parseRegistrationId(text) {
  const raw = String(text || '').trim();
  if (/^GBM2569-\d+$/i.test(raw)) return raw.toUpperCase();
  try {
    return (new URL(raw).searchParams.get('id') || '').toUpperCase();
  } catch (_) {
    return '';
  }
}

async function checkIn(registrationId) {
  if (!token()) return showMessage('#checkinMessage', 'กรุณาเข้าสู่ระบบผู้ดูแลจากหน้า Dashboard ก่อน', 'error');
  try {
    const { data } = await apiRequest('checkIn', { registration_id: registrationId }, { adminToken: token() });
    document.querySelector('#cId').textContent = data.registration_id;
    document.querySelector('#cName').textContent = data.student_name || '-';
    document.querySelector('#cClass').textContent = data.grade_room || '-';
    document.querySelector('#cTime').textContent = `${data.checkin_date || ''} ${data.checkin_time || ''}`.trim();
    document.querySelector('#checkinResult').hidden = false;
    if (data.already_checked_in) showMessage('#checkinMessage', 'นักเรียนคนนี้ Check-in แล้วก่อนหน้านี้', 'success');
  } catch (error) {
    showMessage('#checkinMessage', error.message, 'error');
  }
}

async function startScanner() {
  if (!window.Html5Qrcode) return showMessage('#checkinMessage', 'ไม่สามารถโหลดตัวสแกน QR ได้', 'error');
  if (!scanner) scanner = new Html5Qrcode('checkinReader');
  try {
    await scanner.start({ facingMode:'environment' }, { fps:10, qrbox:{ width:240, height:240 } }, async text => {
      const id = parseRegistrationId(text);
      if (id) {
        await scanner.stop();
        await checkIn(id);
      }
    }, () => {});
  } catch (error) {
    showMessage('#checkinMessage', `เปิดกล้องไม่ได้: ${error}`, 'error');
  }
}

document.querySelector('#startCheckinScanner')?.addEventListener('click', startScanner);
document.querySelector('#checkinManualButton')?.addEventListener('click', () => {
  const id = parseRegistrationId(document.querySelector('#checkinManualId').value);
  if (!id) return showMessage('#checkinMessage', 'กรุณากรอกเลขที่สมัครให้ถูกต้อง', 'error');
  checkIn(id);
});
