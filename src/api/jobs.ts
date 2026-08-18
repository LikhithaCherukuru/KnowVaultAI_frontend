import { apiRequest } from './client';

export interface ProcessingJob {
  id: string;
  file_id?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  message?: string;
  error?: string;
  created_at?: string;
}

export async function getJobs(): Promise<ProcessingJob[]> {
  return apiRequest<ProcessingJob[]>('/api/v1/jobs/');
}
