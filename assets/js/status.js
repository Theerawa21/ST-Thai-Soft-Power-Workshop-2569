import { apiRequest } from './api.js';
import { showMessage } from './ui.js';

if (typeof document !== 'undefined') {
  document.querySelector('#statusForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const { data } = await apiRequest('studentStatus', payload);
      const box = document.querySelector('#statusResult');
      box.hidden = false;
      box.querySelector('[data-name]').textContent = data.full_name;
      box.querySelector('[data-id]').textContent = data.registration_id;
      box.querySelector('[data-payment]').textContent = data.payment_status === 'PAID' ? 'ชำระเงินแล้ว' : 'รอชำระเงิน';
      const link = box.querySelector('[data-dashboard]');
      link.href = `student.html?token=${encodeURIComponent(data.public_token)}`;
    } catch (error) {
      showMessage(error.message, 'error');
    }
  });
}
