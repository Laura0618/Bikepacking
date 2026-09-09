// Cliente de la API del Worker. Todas las llamadas envian la cookie de sesion.

import type { AuthUser, SyncPullResponse, SyncPushRequest, SyncPushResponse } from '../types';

export const LOGIN_URL = '/api/auth/login';

export class ApiError extends Error {
  status: number;
  code: string | null;
  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      credentials: 'include',
      headers: { accept: 'application/json', ...(init.headers ?? {}) },
      ...init,
    });
  } catch {
    throw new ApiError(0, 'network', 'Sin conexion con el servidor.');
  }

  const text = await res.text();
  const body: unknown = text ? safeParse(text) : null;

  if (!res.ok) {
    const code =
      typeof body === 'object' && body !== null && 'code' in body
        ? String((body as { code: unknown }).code)
        : null;
    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : `Error ${res.status}`;
    throw new ApiError(res.status, code, message);
  }

  return body as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  config: (): Promise<{ oauthConfigured: boolean }> => request('/api/config'),
  me: (): Promise<{ user: AuthUser }> => request('/api/me'),
  logout: (): Promise<{ ok: true }> => request('/api/auth/logout', { method: 'POST' }),
  syncPull: (): Promise<SyncPullResponse> => request('/api/sync'),
  syncPush: (payload: SyncPushRequest): Promise<SyncPushResponse> =>
    request('/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};
