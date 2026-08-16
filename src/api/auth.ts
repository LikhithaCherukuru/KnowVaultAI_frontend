import { apiRequest, storeTokens, clearTokens } from './client';
import type { AuthSession, LoginRequest, RegisterRequest, User } from '@/types';

export async function login(credentials: LoginRequest): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  storeTokens(session.access_token, session.refresh_token);
  return session;
}

export async function register(data: RegisterRequest): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  storeTokens(session.access_token, session.refresh_token);
  return session;
}

export async function logout(): Promise<void> {
  clearTokens();
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/api/v1/users/me');
}

export async function updateProfile(data: {
  full_name?: string;
  avatar_url?: string | null;
  phone?: string | null;
  bio?: string | null;
}): Promise<User> {
  return apiRequest<User>('/api/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
