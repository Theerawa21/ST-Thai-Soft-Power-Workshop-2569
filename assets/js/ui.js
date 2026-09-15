export function formatMoney(value) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 }).format(Number(value || 0));
}

export function formatThaiDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(date);
}

export function showMessage(message, type = 'info', target = '#message') {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  el.textContent = message;
  el.className = `message message--${type}`;
  el.hidden = !message;
}

export function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

export function getAdminToken() {
  return sessionStorage.getItem('gbm_admin_token') || '';
}
