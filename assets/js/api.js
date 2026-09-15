import { APP_CONFIG } from './config.js';

export async function apiRequest(action, payload = {}, options = {}) {
  const body = { action, payload };
  if (options.adminToken) body.adminToken = options.adminToken;
  const response = await fetch(APP_CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  if (!result.ok) {
    const error = new Error(result.error?.message || 'เกิดข้อผิดพลาด');
    error.code = result.error?.code || 'API_ERROR';
    throw error;
  }
  return result;
}
