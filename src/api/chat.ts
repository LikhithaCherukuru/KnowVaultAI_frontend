import { apiRequest } from './client';
import type { ChatResponse, ChatRequest, ConversationItem, ChatMessage } from '@/types';

export interface ChatHistoryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  message?: string;
  sources?: unknown[];
  conversation_id?: string;
  created_at?: string;
}

export async function askQuestion(question: string, conversationId?: string): Promise<ChatResponse> {
  return apiRequest<ChatResponse>('/api/v1/chat', {
    method: 'POST',
    body: JSON.stringify({ question, conversation_id: conversationId } as ChatRequest),
  });
}

export async function editMessage(messageId: string, conversationId: string, question: string): Promise<ChatResponse> {
  return apiRequest<ChatResponse>('/api/v1/chat/edit', {
    method: 'POST',
    body: JSON.stringify({ message_id: messageId, conversation_id: conversationId, question }),
  });
}

export async function getConversations(): Promise<ConversationItem[]> {
  return apiRequest<ConversationItem[]>('/api/v1/chat/conversations');
}

export async function createConversation(title?: string): Promise<ConversationItem> {
  return apiRequest<ConversationItem>('/api/v1/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ title: title || 'New conversation' }),
  });
}

export async function getConversationDetails(conversationId: string): Promise<{ conversation: ConversationItem; messages: ChatMessage[] }> {
  return apiRequest<{ conversation: ConversationItem; messages: ChatMessage[] }>(`/api/v1/chat/conversations/${conversationId}`);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await apiRequest<void>(`/api/v1/chat/conversations/${conversationId}`, {
    method: 'DELETE',
  });
}

export async function getChatHistory(conversationId?: string): Promise<ChatHistoryMessage[]> {
  const suffix = conversationId ? `?conversation_id=${encodeURIComponent(conversationId)}` : '';
  return apiRequest<ChatHistoryMessage[]>(`/api/v1/chat/history${suffix}`);
}
