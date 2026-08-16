import { apiRequest } from './client';
import type { ChatResponse, ChatRequest } from '@/types';

export async function askQuestion(question: string): Promise<ChatResponse> {
  return apiRequest<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify({ question } as ChatRequest),
  });
}
