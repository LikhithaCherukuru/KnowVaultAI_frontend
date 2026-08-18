import { getConversations, deleteConversation } from './chat';
import type { ConversationItem } from '@/types';

export async function getUserConversations(): Promise<ConversationItem[]> {
  return getConversations();
}

export async function deleteUserConversation(id: string): Promise<void> {
  return deleteConversation(id);
}
