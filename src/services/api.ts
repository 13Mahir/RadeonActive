// src/services/api.ts
const BASE_URL = '/api';

function getToken(): string | null {
  return sessionStorage.getItem('dbt_auth_token');
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function handleResponse(res: Response) {
  if (res.status === 401) {
    // Token expired — clear session and reload to trigger login
    sessionStorage.removeItem('dbt_auth_token');
    sessionStorage.removeItem('dbt_auth_user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  async get(path: string): Promise<any> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async post(path: string, body: any): Promise<any> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },

  async patch(path: string, body: any): Promise<any> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },

  async uploadFiles(path: string, formData: FormData): Promise<any> {
    const token = getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    return handleResponse(res);
  }
};
