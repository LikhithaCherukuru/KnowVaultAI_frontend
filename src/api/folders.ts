import { apiRequest } from './client';
import type { Folder } from '@/types';

function normalizeFolder(row: any): Folder {
  return {
    ...row,
    id: row.id,
    name: row.name ?? row.folder_name ?? 'Unknown folder',
    folder_path: row.folder_path ?? row.local_path,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? row.modified_date ?? row.created_at ?? new Date().toISOString(),
  };
}

export async function getFolders(): Promise<Folder[] | { items: Folder[] }> {
  const data = await apiRequest<any[] | { items: any[] }>('/api/v1/files/folders');
  return Array.isArray(data) ? data.map(normalizeFolder) : { items: (data.items ?? []).map(normalizeFolder) };
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
