import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare, FileText, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import { askQuestion } from '@/api/chat';
import type { ChatResponse, Citation } from '@/types';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/utils';

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Citation[];
  error?: boolean;
}

function getCitationName(c: Citation): string {
  return c.file_name || c.filename || 'Unknown file';
}

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const question = input.trim();
    setInput('');
    setSending(true);
    setError(false);

    const userMsg: LocalMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response: ChatResponse = await askQuestion(question);
      const aiMsg: LocalMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.answer || 'No answer was returned.',
        sources: response.sources || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errMsg: LocalMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Unable to get a response. Please try again.',
        error: true,
      };
      setMessages((prev) => [...prev, errMsg]);
      setError(true);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -mx-4 sm:-mx-6 lg:-mx-8 -my-6 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-10 h-10" />}
              title="Ask about your documents"
              description="Type a question below and I'll search your knowledge base for answers with source citations."
              className="py-20"
            />
          ) : (
            messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                onCitationClick={(fileId) => fileId && navigate(`/files/${fileId}`)}
              />
            ))
          )}
          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Searching your documents...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-[#0b0e14]">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about your documents..."
              rows={1}
              className="input-base pr-12 resize-none max-h-32"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="absolute right-2 bottom-2 p-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMessageBubble({
  message,
  onCitationClick,
}: {
  message: LocalMessage;
  onCitationClick: (fileId?: string) => void;
}) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold',
          isUser
            ? 'bg-brand-600 text-white'
            : message.error
            ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        )}
      >
        {isUser ? 'You' : message.error ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>
      <div className={cn('max-w-[80%] space-y-2', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-xl px-3.5 py-2.5 text-sm',
            isUser
              ? 'bg-brand-600 text-white'
              : message.error
              ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400'
              : 'bg-white dark:bg-[#11151f] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200'
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.sources.map((citation, i) => (
              <button
                key={i}
                onClick={() => onCitationClick(citation.file_id)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:text-brand-600 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                <FileText className="w-3 h-3" />
                {getCitationName(citation)}
                {citation.page ? ` · p.${citation.page}` : ''}
                <ChevronRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
