// For a real phone, replace localhost with your Mac's LAN IP (same Wi-Fi).
// Android emulator: http://10.0.2.2:5000/api | iOS simulator: http://localhost:5000/api
export const API_URL = 'http://localhost:5000/api';

export async function api(path, { token, method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
  } catch {
    throw new Error(`Cannot connect to the server. Check API_URL in src/api/client.js and make sure the backend is running (${API_URL}).`);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
}
