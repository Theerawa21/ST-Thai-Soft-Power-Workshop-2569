import { apiRequest } from './api.js';
import { showMessage } from './ui.js';

async function loadStatus() {
  const registerButton = document.querySelector('#registerButton');
  const notice = document.querySelector('#registrationNotice');
  try {
    const { data } = await apiRequest('eventStatus');
    document.querySelector('#totalCount').textContent = `${data.total ?? 0}/200`;
    document.querySelector('#remainingCount').textContent = data.remaining ?? 0;
    document.querySelector('#scienceMathCount').textContent = `${data.scienceMath ?? 0}/50`;
    document.querySelector('#paidCount').textContent = data.paid ?? 0;

    const isOpen = Boolean(data.registrationOpen) && Number(data.remaining) > 0;
    registerButton.classList.toggle('disabled', !isOpen);
    registerButton.setAttribute('aria-disabled', String(!isOpen));
    if (!isOpen) {
      registerButton.removeAttribute('href');
      notice.hidden = false;
      notice.classList.add('danger');
      notice.textContent = Number(data.remaining) <= 0 ? 'จำนวนผู้สมัครเต็มแล้ว ไม่รับเพิ่ม' : 'ขณะนี้ปิดรับสมัคร';
    } else {
      registerButton.href = 'register.html';
      notice.hidden = true;
      notice.classList.remove('danger');
    }
  } catch (error) {
    showMessage('#homeMessage', `ไม่สามารถโหลดจำนวนผู้สมัครได้: ${error.message}`, 'error');
  }
}

loadStatus();
setInterval(loadStatus, 30000);
