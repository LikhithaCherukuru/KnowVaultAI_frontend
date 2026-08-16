import { apiRequest } from './client';
import type { SearchResponse } from '@/types';

export async function semanticSearch(query: string): Promise<SearchResponse> {
  return apiRequest<SearchResponse>('/api/v1/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}
