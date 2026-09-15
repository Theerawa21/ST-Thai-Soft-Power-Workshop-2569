import { apiRequest } from './api.js';
import { showMessage } from './ui.js';

const REQUIRED = ['student_id','prefix','first_name','last_name','nickname','grade','room','number','program','phone','registration_type'];

export function validateRegistrationForm(data) {
  const missing = REQUIRED.filter(key => !String(data[key] ?? '').trim());
  if (missing.length) return { ok:false, message:'กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน' };
  if (!['MARKET_REP','SCI_MATH'].includes(data.registration_type)) return { ok:false, message:'กรุณาเลือกประเภทผู้สมัคร' };
  if (data.registration_type === 'MARKET_REP') {
    if (!String(data.group_name || '').trim() || !String(data.product_type || '').trim()) {
      return { ok:false, message:'ตัวแทน Green Business Market ต้องระบุชื่อกลุ่มและประเภทสินค้า' };
    }
  }
  return { ok:true };
}

function serializeForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') data[key] = data[key].trim();
  });
  return data;
}

const form = document.querySelector('#registrationForm');
if (form) {
  const marketFields = document.querySelector('#marketFields');
  form.addEventListener('change', event => {
    if (event.target.name === 'registration_type') {
      const show = event.target.value === 'MARKET_REP';
      marketFields.hidden = !show;
      document.querySelector('#group_name').required = show;
      document.querySelector('#product_type').required = show;
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const data = serializeForm(form);
    const validation = validateRegistrationForm(data);
    if (!validation.ok) {
      showMessage('#formMessage', validation.message, 'error');
      return;
    }

    const button = document.querySelector('#submitButton');
    button.disabled = true;
    button.textContent = 'กำลังบันทึก...';
    try {
      const { data: result } = await apiRequest('register', data);
      localStorage.setItem('gbm_registration_id', result.registration_id);
      localStorage.setItem('gbm_public_token', result.public_token);
      const params = new URLSearchParams({ id: result.registration_id, token: result.public_token });
      window.location.href = `success.html?${params.toString()}`;
    } catch (error) {
      showMessage('#formMessage', error.message, 'error');
      button.disabled = false;
      button.textContent = 'ยืนยันการสมัคร';
    }
  });
}
