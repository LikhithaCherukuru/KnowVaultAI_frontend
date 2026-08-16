import type {
  AuthSession,
  User,
  FileItem,
  Folder,
  ScanResult,
  SearchResponse,
  ChatResponse,
  Citation,
  DashboardStats,
  ActivityItem,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const TOKEN_STORAGE_KEY = 'sff_access_token';
const REFRESH_TOKEN_KEY = 'sff_refresh_token';

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

type Listener = () => void;
const authListeners: Set<Listener> = new Set();

export function onAuthError(callback: Listener): () => void {
  authListeners.add(callback);
  return () => authListeners.delete(callback);
}

function notifyAuthError() {
  authListeners.forEach((cb) => cb());
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function getStatusMessage(status: number): string | null {
  switch (status) {
    case 400:
      return 'The request was invalid. Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'A conflict occurred. The resource may already exist.';
    case 422:
      return 'The submitted data was invalid. Please review and try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
      return 'The server encountered an error. Please try again shortly.';
    default:
      return null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    if (err instanceof TypeError) {
      throw new ApiRequestError(
        'Unable to connect to the server. Please check your connection and try again.',
        0,
        'NETWORK_ERROR'
      );
    }
    throw err;
  }

  if (!response.ok) {
    let message = getStatusMessage(response.status) || 'An unexpected error occurred.';
    let code: string | undefined;
    let details: unknown;

    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errorBody = await response.json();
        if (errorBody?.detail) {
          message = typeof errorBody.detail === 'string' ? errorBody.detail : message;
          if (typeof errorBody.detail === 'object' && errorBody.detail !== null) {
            details = errorBody.detail;
          }
        }
        if (errorBody?.message) {
          message = errorBody.message;
        }
        if (errorBody?.code) {
          code = errorBody.code;
        }
      }
    } catch {
      // ignore parse errors
    }

    if (response.status === 401) {
      clearTokens();
      notifyAuthError();
    }

    throw new ApiRequestError(message, response.status, code, details);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  return response.text() as unknown as Promise<T>;
}

export { API_BASE_URL };

export type {
  AuthSession,
  User,
  FileItem,
  Folder,
  ScanResult,
  SearchResponse,
  ChatResponse,
  Citation,
  DashboardStats,
  ActivityItem,
};
