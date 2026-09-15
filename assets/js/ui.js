export function formatThaiDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok'
  }).format(date);
}

export function formatMoney(value) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency', currency: 'THB', minimumFractionDigits: 2
  }).format(Number(value || 0));
}

export function showMessage(target, message, type = 'info') {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  el.textContent = message;
  el.dataset.type = type;
  el.hidden = false;
}
