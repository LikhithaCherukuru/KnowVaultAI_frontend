import { Info, MessageSquare, Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';

export default function History() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">History</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your past searches and AI conversations</p>
      </div>

      <div className="surface">
        <EmptyState
          icon={<Info className="w-10 h-10" />}
          title="History endpoints not available"
          description="The backend does not currently expose search history or chat conversation history endpoints. When these become available, they will appear here."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/search')}
          className="surface p-4 flex items-center gap-3 hover:border-brand-300 dark:hover:border-brand-700 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500">
            <SearchIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Go to AI Search</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Search your knowledge base</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/chat')}
          className="surface p-4 flex items-center gap-3 hover:border-brand-300 dark:hover:border-brand-700 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Go to AI Chat</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ask questions about your documents</p>
          </div>
        </button>
      </div>
    </div>
  );
}
