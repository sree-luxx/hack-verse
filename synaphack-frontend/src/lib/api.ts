// Lightweight API client using fetch. Reads base URL from Vite env: VITE_API_URL

const API_BASE_URL: string = (import.meta as any).env?.VITE_API_URL || '';

function getStoredToken(): string | null {
  try {
    return localStorage.getItem('hackverse_token');
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) localStorage.setItem('hackverse_token', token);
    else localStorage.removeItem('hackverse_token');
  } catch {}
}

async function request(path: string, init: RequestInit = {}) {
  const isAbsolute = /^https?:\/\//i.test(path);
  const url = isAbsolute ? path : `${API_BASE_URL}${path}`;

  const headers = new Headers({ 'Content-Type': 'application/json' });
  const provided = init.headers ? new Headers(init.headers as any) : undefined;
  if (provided) {
    provided.forEach((value, key) => headers.set(key, value));
  }

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
  });

  if (!response.ok) {
    let errMessage = response.statusText;
    try {
      const errBody = await response.json();
      errMessage = errBody?.message || errMessage;
      const error = new Error(errMessage) as Error & { status?: number; body?: unknown };
      error.status = response.status;
      error.body = errBody;
      throw error;
    } catch (e) {
      if (e instanceof Error) throw e;
      const error = new Error(errMessage) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await response.json();
    // Auto-unwrap { success, data } envelopes when present
    if (json && typeof json === 'object' && ('data' in json || 'success' in json)) {
      return (json as any).data !== undefined ? (json as any).data : json;
    }
    return json;
  }
  return response.text();
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: unknown) => request(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: (path: string, body?: unknown) => request(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: (path: string, body?: unknown) => request(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: (path: string) => request(path, { method: 'DELETE' }),
};

export function hasApiBaseUrl(): boolean {
  return Boolean(API_BASE_URL);
}

export async function postForm(path: string, formData: Record<string, string>) {
  const isAbsolute = /^https?:\/\//i.test(path);
  const url = isAbsolute ? path : `${API_BASE_URL}${path}`;
  const params = new URLSearchParams(formData);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    credentials: 'include',
  });
  const contentType = response.headers.get('content-type') || '';
  const text = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const err = new Error((text as any)?.message || 'Request failed') as Error & { status?: number };
    err.status = response.status;
    throw err;
  }
  return (text as any)?.data ?? text;
}


