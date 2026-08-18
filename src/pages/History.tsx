import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Trash2, ChevronRight, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserConversations, deleteUserConversation } from '@/api/history';
import type { ConversationItem } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatRelativeTime } from '@/utils';

export default function History() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConversationItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await getUserConversations();
      setConversations(list || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUserConversation(deleteTarget.id);
      setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Conversation History</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View and resume your past AI Chat conversations
          </p>
        </div>
        <Button size="sm" onClick={() => navigate('/chat')} icon={<MessageSquare className="w-4 h-4" />}>
          Open AI Chat
        </Button>
      </div>

      {loading ? (
        <div className="surface p-4">
          <TableSkeleton />
        </div>
      ) : error ? (
        <div className="surface">
          <ErrorState message="Unable to load conversation history." onRetry={loadData} />
        </div>
      ) : conversations.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={<Clock className="w-10 h-10" />}
            title="No past conversations"
            description="Start asking questions in AI Chat to build your conversation history."
            action={
              <Button onClick={() => navigate('/chat')} icon={<MessageSquare className="w-4 h-4" />}>
                Start New Chat
              </Button>
            }
          />
        </div>
      ) : (
        <div className="surface divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => navigate(`/chat/${conv.id}`)}
              className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-brand-600 dark:text-brand-400 flex-shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {conv.title || 'New conversation'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Created {formatRelativeTime(conv.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setDeleteTarget(conv)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className="p-1.5 text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400"
                >
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete conversation"
        message={`Are you sure you want to delete "${deleteTarget?.title || 'this conversation'}"?`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
