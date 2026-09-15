import { apiRequest } from './api.js';
import { showMessage } from './ui.js';

const REQUIRED = ['student_id','prefix','first_name','last_name','nickname','grade','room','number','program','phone','registration_type'];

export function validateRegistrationForm(data) {
  const missing = REQUIRED.filter(k => !String(data?.[k] ?? '').trim());
  if (missing.length) return { ok: false, message: 'กรุณากรอกข้อมูลให้ครบทุกช่องที่จำเป็น' };
  if (!/^0\d{8,9}$/.test(String(data.phone).replace(/\D/g, ''))) return { ok: false, message: 'กรุณาตรวจสอบเบอร์โทรศัพท์' };
  if (data.registration_type === 'MARKET_REP') {
    if (!String(data.group_name || '').trim()) return { ok: false, message: 'กรุณาระบุชื่อกลุ่ม/ชื่อร้าน' };
    if (!['อาหาร','เครื่องดื่ม','ขนม'].includes(data.product_type)) return { ok: false, message: 'กรุณาเลือกประเภทสินค้า' };
  }
  return { ok: true };
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function toggleMarketFields(type) {
  const section = document.querySelector('#marketFields');
  if (!section) return;
  section.hidden = type !== 'MARKET_REP';
}

if (typeof document !== 'undefined') {
  const form = document.querySelector('#registrationForm');
  const typeSelect = document.querySelector('#registration_type');
  if (typeSelect) {
    typeSelect.addEventListener('change', e => toggleMarketFields(e.target.value));
    toggleMarketFields(typeSelect.value);
  }
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = formToObject(form);
    const validation = validateRegistrationForm(data);
    if (!validation.ok) return showMessage(validation.message, 'error');
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'กำลังบันทึก...';
    try {
      const { data: result } = await apiRequest('register', data);
      sessionStorage.setItem('gbm_registration_id', result.registration_id);
      sessionStorage.setItem('gbm_public_token', result.public_token);
      location.href = `success.html?id=${encodeURIComponent(result.registration_id)}&token=${encodeURIComponent(result.public_token)}`;
    } catch (error) {
      showMessage(error.message, 'error');
      button.disabled = false;
      button.textContent = 'ยืนยันการสมัคร';
    }
  });
}
