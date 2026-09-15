import { apiRequest } from './api.js';
import { showMessage } from './ui.js';

export function renderEventStatus(data) {
  const set = (id, value) => { const el = document.querySelector(id); if (el) el.textContent = value; };
  set('#totalCount', `${data.total}/${data.maxCapacity ?? 150}`);
  set('#remainingCount', data.remaining);
  set('#scienceMathCount', `${data.scienceMath}/${data.scienceMathQuota ?? 50}`);
  set('#paidCount', data.paid);
  const btn = document.querySelector('#registerButton');
  if (btn) {
    const disabled = !data.registrationOpen || data.remaining <= 0;
    btn.classList.toggle('button--disabled', disabled);
    btn.setAttribute('aria-disabled', String(disabled));
    btn.href = disabled ? '#' : 'register.html';
    btn.textContent = disabled ? 'ปิดรับสมัคร / เต็มแล้ว' : 'สมัครเข้าร่วมกิจกรรม';
  }
}

export async function loadStatus() {
  try {
    const { data } = await apiRequest('eventStatus');
    renderEventStatus(data);
  } catch (error) {
    showMessage(error.message, 'error', '#statusMessage');
  }
}

if (typeof document !== 'undefined') {
  loadStatus();
  setInterval(loadStatus, 30000);
}
