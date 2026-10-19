import { firebaseAuth } from '../firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Error thrown for non-2xx API replies. Carries the HTTP status and, for
 * refused AI requests, the machine-readable `code` (see AI_ERROR_CODES) so the
 * UI can show a localized message instead of the server's Polish text.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => ({ error: res.statusText }));
  return new ApiError(body.error || 'Request failed', res.status, body.code, body);
}

async function getAuthToken(): Promise<string | null> {
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}
