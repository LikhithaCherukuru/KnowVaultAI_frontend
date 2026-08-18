import { apiRequest } from './client';
import type { FileItem, ScanResult, ScanFileRequest, ScanFolderRequest, StartIndexingRequest } from '@/types';

function normalizeFile(row: any): FileItem {
  return {
    ...row,
    id: row.id,
    name: row.name ?? row.file_name ?? row.original_name ?? 'Unknown file',
    original_name: row.original_name ?? row.file_name,
    size: row.size ?? row.file_size ?? 0,
    file_type: row.file_type ?? row.extension,
    file_path: row.file_path ?? row.local_path,
    sha256: row.sha256 ?? row.file_hash,
    created_at: row.created_at ?? row.created_date ?? new Date().toISOString(),
    updated_at: row.updated_at ?? row.modified_date ?? row.created_at ?? new Date().toISOString(),
  };
}

export async function getFiles(): Promise<FileItem[] | { items: FileItem[] }> {
  const data = await apiRequest<any[] | { items: any[] }>('/api/v1/files/');
  return Array.isArray(data) ? data.map(normalizeFile) : { items: (data.items ?? []).map(normalizeFile) };
}

export async function getFilesByFolder(folderPath: string): Promise<FileItem[]> {
  const data = await apiRequest<any[]>(`/api/v1/files/folders/files?folder_path=${encodeURIComponent(folderPath)}`);
  return Array.isArray(data) ? data.map(normalizeFile) : [];
}

export async function getFile(id: string): Promise<FileItem> {
  const data = await apiRequest<any>(`/api/v1/files/${id}`);
  return normalizeFile(data);
}

export async function deleteFile(id: string): Promise<void> {
  await apiRequest<void>(`/api/v1/files/${id}`, {
    method: 'DELETE',
  });
}

export async function syncFile(data: Record<string, unknown>): Promise<FileItem> {
  const res = await apiRequest<any>('/api/v1/files/sync', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return normalizeFile(res);
}

export async function scanFile(data: ScanFileRequest): Promise<ScanResult> {
  return apiRequest<ScanResult>('/api/v1/files/scan-file', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function scanFolder(data: ScanFolderRequest): Promise<ScanResult> {
  return apiRequest<ScanResult>('/api/v1/files/scan-folder', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function startIndexing(data: StartIndexingRequest): Promise<ScanResult> {
  return apiRequest<ScanResult>('/api/v1/indexing/start', {
    method: 'POST',
    body: JSON.stringify({ user_id: data.user_id, folder_path: data.folder_path }),
  });
}
