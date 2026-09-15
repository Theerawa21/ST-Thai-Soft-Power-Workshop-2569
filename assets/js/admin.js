import { apiRequest } from './api.js';
import { formatMoney, showMessage } from './ui.js';

function getToken() { return sessionStorage.getItem('gbm_admin_token') || ''; }
function setToken(value) { sessionStorage.setItem('gbm_admin_token', value); }

async function loadDashboard() {
  const token = getToken();
  if (!token) return;
  try {
    const { data } = await apiRequest('adminDashboard', {}, { adminToken: token });
    document.querySelector('#adminLogin').hidden = true;
    document.querySelector('#dashboardContent').hidden = false;
    document.querySelector('#aTotal').textContent = `${data.total}/150`;
    document.querySelector('#aRemaining').textContent = data.remaining;
    document.querySelector('#aPaid').textContent = data.paid;
    document.querySelector('#aRevenue').textContent = formatMoney(data.totalRevenue);
    document.querySelector('#aMarket').textContent = data.marketRepresentatives;
    document.querySelector('#aScience').textContent = `${data.scienceMath}/50`;
    document.querySelector('#aUnpaid').textContent = data.unpaid;
    document.querySelector('#aCheckin').textContent = data.checkedIn;
    const tbody = document.querySelector('#recentRows');
    tbody.innerHTML = '';
    for (const row of data.recentRegistrations || []) {
      const tr = document.createElement('tr');
      [row.registration_id,row.student_name,row.grade_room,row.registration_type,row.payment_status].forEach(value => {
        const td = document.createElement('td'); td.textContent = value; tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
  } catch (error) {
    sessionStorage.removeItem('gbm_admin_token');
    document.querySelector('#adminLogin').hidden = false;
    document.querySelector('#dashboardContent').hidden = true;
    showMessage('#adminMessage', error.message, 'error');
  }
}

document.querySelector('#saveAdminToken')?.addEventListener('click', () => {
  const value = document.querySelector('#adminToken').value.trim();
  if (!value) return showMessage('#adminMessage', 'กรุณากรอก Admin token', 'error');
  setToken(value);
  loadDashboard();
});

if (getToken()) loadDashboard();
