export type ProcessingStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'pending' | 'uploaded' | 'indexed';

export type FileCategory = 'pdf' | 'doc' | 'txt' | 'image' | 'spreadsheet' | 'presentation' | 'code' | 'audio' | 'video' | 'archive' | 'other';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  name?: string;
  avatar_url?: string | null;
  phone?: string | null;
  bio?: string | null;
  created_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface FileItem {
  id: string;
  name: string;
  original_name?: string;
  file_type?: string;
  mime_type?: string;
  size: number;
  category?: FileCategory;
  folder_id?: string | null;
  status: ProcessingStatus;
  sha256?: string;
  is_duplicate?: boolean;
  duplicate_of?: string | null;
  duplicate_file_name?: string | null;
  storage_path?: string;
  file_path?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string | null;
  error_message?: string | null;
  metadata?: Record<string, unknown>;
}

export interface Folder {
  id: string;
  name: string;
  parent_id?: string | null;
  folder_path?: string;
  file_count?: number;
  folder_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ScanFileRequest {
  user_id: string;
  file_path: string;
}

export interface ScanFolderRequest {
  user_id: string;
  folder_path: string;
}

export interface StartIndexingRequest {
  user_id: string;
  folder_path: string;
}

export interface ScanResult {
  message?: string;
  file?: FileItem;
  is_duplicate?: boolean;
  duplicate_of?: string | null;
  duplicate_file_name?: string | null;
  [key: string]: unknown;
}

export interface SearchResult {
  id?: string;
  file_id?: string;
  file_name?: string;
  filename?: string;
  file_type?: string;
  snippet: string;
  text?: string;
  score: number;
  chunk_index?: number;
  page?: number;
  source?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SearchResponse {
  query?: string;
  question?: string;
  results?: SearchResult[];
  answer?: string;
  sources?: Citation[];
  answer_sources?: Citation[];
  total?: number;
  [key: string]: unknown;
}

export interface Citation {
  file_id?: string;
  file_name?: string;
  filename?: string;
  page?: number;
  chunk_index?: number;
  snippet?: string;
  source?: string;
  [key: string]: unknown;
}

export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  answer: string;
  sources?: Citation[];
  [key: string]: unknown;
}

export interface DashboardStats {
  total_files: number;
  total_folders: number;
  indexed_documents: number;
  processing_jobs: number;
  failed_jobs?: number;
}

export interface ActivityItem {
  id: string;
  type: 'file_uploaded' | 'file_processed' | 'search_performed' | 'ai_question' | 'file_deleted' | 'folder_created';
  description: string;
  created_at: string;
  file_name?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}
