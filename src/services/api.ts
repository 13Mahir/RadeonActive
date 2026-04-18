const BASE_URL = '/api';

async function handleResponse(res: Response) {
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
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(res);
  },

  async post(path: string, body: any): Promise<any> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },

  async patch(path: string, body: any): Promise<any> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },

  async uploadFiles(path: string, formData: FormData): Promise<any> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(res);
  }
};
