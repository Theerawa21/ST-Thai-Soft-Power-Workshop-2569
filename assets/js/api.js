import { APP_CONFIG } from './config.js';

export async function apiRequest(action, payload = {}, options = {}) {
  const response = await fetch(APP_CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, payload, options })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error?.message || 'เกิดข้อผิดพลาด');
  }
  return result;
}
