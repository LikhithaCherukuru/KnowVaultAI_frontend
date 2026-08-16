import { apiRequest } from './client';
import type { Folder } from '@/types';

export async function getFolders(): Promise<Folder[] | { items: Folder[] }> {
  return apiRequest<Folder[] | { items: Folder[] }>('/api/v1/files/folders');
}

export async function deleteFolder(id: string): Promise<void> {
  await apiRequest<void>(`/api/v1/files/folders/${id}`, {
    method: 'DELETE',
  });
}

export async function syncFolder(data: Record<string, unknown>): Promise<Folder> {
  return apiRequest<Folder>('/api/v1/files/folders/sync', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
