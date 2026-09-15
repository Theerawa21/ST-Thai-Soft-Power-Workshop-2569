import { apiRequest } from './api.js';
import { formatMoney, getAdminToken, showMessage } from './ui.js';

let lastDashboard = null;
function saveToken(token) { sessionStorage.setItem('gbm_admin_token', token); }

export function renderDashboard(data) {
  lastDashboard = data;
  const map = {
    '#adminTotal': `${data.total}/${data.maxCapacity}`,
    '#adminRemaining': data.remaining,
    '#adminPaid': data.paid,
    '#adminUnpaid': data.unpaid,
    '#adminAmount': formatMoney(data.paidAmount),
    '#adminCheckin': data.checkedIn
  };
  Object.entries(map).forEach(([sel,val]) => { const el = document.querySelector(sel); if (el) el.textContent = val; });
  const tbody = document.querySelector('#registrationsBody');
  if (tbody) {
    tbody.innerHTML = '';
    data.registrations.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.registration_id}</td><td>${r.prefix}${r.first_name} ${r.last_name}</td><td>${r.grade}/${r.room}</td><td>${r.registration_type === 'SCI_MATH' ? 'วิทย์–คณิต' : 'ตัวแทนตลาด'}</td><td>${['PAID','CONFIRMED'].includes(r.payment_status) ? '<span class="status status--ok">ชำระแล้ว</span>' : '<span class="status status--pending">รอชำระ</span>'}</td><td><a class="table-link" href="scanner.html?id=${encodeURIComponent(r.registration_id)}">เปิดรายการ</a></td>`;
      tbody.appendChild(tr);
    });
  }
}

async function loadDashboard() {
  const token = getAdminToken();
  if (!token) return document.querySelector('#adminLogin').hidden = false;
  try {
    const { data } = await apiRequest('dashboard', {}, { adminToken: token });
    document.querySelector('#adminLogin').hidden = true;
    document.querySelector('#adminPanel').hidden = false;
    renderDashboard(data);
  } catch (error) {
    document.querySelector('#adminLogin').hidden = false;
    document.querySelector('#adminPanel').hidden = true;
    showMessage(error.message, 'error');
  }
}

function exportCsv() {
  if (!lastDashboard?.registrations?.length) return;
  const headers = ['registration_id','first_name','last_name','grade','room','program','registration_type','group_name','product_type','product_name','payment_status','checked_in'];
  const esc = value => `"${String(value ?? '').replaceAll('"','""')}"`;
  const rows = [headers.join(','), ...lastDashboard.registrations.map(r => headers.map(h => esc(r[h])).join(','))];
  const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'ST-Thai-Soft-Power-Workshop-2569.csv'; a.click();
  URL.revokeObjectURL(url);
}

if (typeof document !== 'undefined') {
  document.querySelector('#adminLoginForm')?.addEventListener('submit', e => {
    e.preventDefault();
    saveToken(new FormData(e.currentTarget).get('token'));
    loadDashboard();
  });
  document.querySelector('#exportCsv')?.addEventListener('click', exportCsv);
  document.querySelector('#adminLogout')?.addEventListener('click', () => { sessionStorage.removeItem('gbm_admin_token'); location.reload(); });
  loadDashboard();
}
