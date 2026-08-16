import { apiRequest } from './client';
import type { FileItem, ScanResult, ScanFileRequest, ScanFolderRequest, StartIndexingRequest } from '@/types';

export async function getFiles(): Promise<FileItem[] | { items: FileItem[] }> {
  return apiRequest<FileItem[] | { items: FileItem[] }>('/api/v1/files/');
}

export async function getFile(id: string): Promise<FileItem> {
  return apiRequest<FileItem>(`/api/v1/files/${id}`);
}

export async function deleteFile(id: string): Promise<void> {
  await apiRequest<void>(`/api/v1/files/${id}`, {
    method: 'DELETE',
  });
}

export async function syncFile(data: Record<string, unknown>): Promise<FileItem> {
  return apiRequest<FileItem>('/api/v1/files/sync', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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
    body: JSON.stringify(data),
  });
}
