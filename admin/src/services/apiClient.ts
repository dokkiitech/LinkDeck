import { auth } from '../firebase';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  authRequired?: boolean;
  headers?: Record<string, string>;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const {
    method = 'GET',
    body,
    authRequired = true,
    headers = {},
  } = options;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (authRequired) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('ログインが必要です');
    }
    const idToken = await user.getIdToken();
    requestHeaders.Authorization = `Bearer ${idToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload: any = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message = payload?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return payload as T;
};

export const getApiBaseUrl = (): string => API_BASE_URL;
