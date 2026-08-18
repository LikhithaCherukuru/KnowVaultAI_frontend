import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send,
  Loader2,
  MessageSquare,
  FileText,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Copy,
  Check,
  Edit2,
  X,
  Menu,
  FileSearch,
} from 'lucide-react';
import {
  askQuestion,
  editMessage,
  getConversations,
  getConversationDetails,
  createConversation,
  deleteConversation,
} from '@/api/chat';
import type { ChatResponse, Citation, ConversationItem, ChatMessage } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Citation[];
  error?: boolean;
  isEditing?: boolean;
}

function getCitationName(c: Citation): string {
  return c.file_name || c.filename || 'Document';
}

function formatGroupDate(dateStr: string): 'Today' | 'Yesterday' | 'Older' {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d >= today) return 'Today';
  if (d >= yesterday) return 'Yesterday';
  return 'Older';
}

export default function Chat() {
  const { id: paramConvId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | undefined>(paramConvId);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Load conversations list
  const loadConversationsList = useCallback(async () => {
    try {
      const list = await getConversations();
      setConversations(list);
      return list;
    } catch (e) {
      console.error('Failed to load conversations:', e);
      return [];
    }
  }, []);

  // Initial load
  useEffect(() => {
    async function init() {
      const list = await loadConversationsList();
      if (paramConvId) {
        setActiveConvId(paramConvId);
        loadMessages(paramConvId);
      } else if (list.length > 0) {
        const first = list[0].id;
        setActiveConvId(first);
        navigate(`/chat/${first}`, { replace: true });
        loadMessages(first);
      }
    }
    init();
  }, [paramConvId, loadConversationsList, navigate]);

  const loadMessages = async (convId: string) => {
    setLoadingHistory(true);
    try {
      const details = await getConversationDetails(convId);
      if (details?.messages) {
        setMessages(
          details.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content || m.message || '',
            sources: m.sources,
          }))
        );
      }
    } catch (e) {
      console.error('Failed to load messages for conversation:', e);
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectConversation = (convId: string) => {
    if (convId === activeConvId) return;
    setActiveConvId(convId);
    navigate(`/chat/${convId}`);
    loadMessages(convId);
  };

  const handleNewChat = async () => {
    try {
      const newConv = await createConversation('New conversation');
      await loadConversationsList();
      setActiveConvId(newConv.id);
      setMessages([]);
      navigate(`/chat/${newConv.id}`);
      inputRef.current?.focus();
    } catch (e) {
      console.error('Failed to create conversation:', e);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await deleteConversation(convId);
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);
      if (activeConvId === convId) {
        if (remaining.length > 0) {
          handleSelectConversation(remaining[0].id);
        } else {
          setActiveConvId(undefined);
          setMessages([]);
          navigate('/chat');
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const question = input.trim();
    setInput('');
    setSending(true);

    const tempUserId = `user-${Date.now()}`;
    const userMsg: LocalMessage = {
      id: tempUserId,
      role: 'user',
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response: ChatResponse = await askQuestion(question, activeConvId);

      if (response.conversation_id && response.conversation_id !== activeConvId) {
        setActiveConvId(response.conversation_id);
        navigate(`/chat/${response.conversation_id}`, { replace: true });
      }

      // Update user message ID if returned
      if (response.user_message_id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempUserId ? { ...m, id: response.user_message_id! } : m))
        );
      }

      const aiMsg: LocalMessage = {
        id: response.assistant_message_id || `ai-${Date.now()}`,
        role: 'assistant',
        content: response.answer || 'No answer was returned.',
        sources: response.sources || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
      loadConversationsList();
    } catch (err) {
      const errMsg: LocalMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Unable to get a response. Please try again.',
        error: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartEdit = (msg: LocalMessage) => {
    setEditingMsgId(msg.id);
    setEditText(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMsgId(null);
    setEditText('');
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!editText.trim() || !activeConvId || sending) return;
    const newQuestion = editText.trim();
    setEditingMsgId(null);
    setSending(true);

    try {
      const response = await editMessage(msgId, activeConvId, newQuestion);
      if (response.messages) {
        setMessages(
          response.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content || m.message || '',
            sources: m.sources,
          }))
        );
      } else {
        // Fallback reload
        await loadMessages(activeConvId);
      }
      loadConversationsList();
    } catch (err) {
      console.error('Failed to edit message:', err);
    } finally {
      setSending(false);
    }
  };

  // Group conversations
  const groupedConvs = conversations.reduce(
    (acc, conv) => {
      const group = formatGroupDate(conv.created_at);
      acc[group].push(conv);
      return acc;
    },
    { Today: [] as ConversationItem[], Yesterday: [] as ConversationItem[], Older: [] as ConversationItem[] }
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -mx-4 sm:-mx-6 lg:-mx-8 -my-6 overflow-hidden bg-gray-50 dark:bg-[#0b0e14]">
      {/* Conversations Sidebar */}
      <div
        className={cn(
          'w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0d1119] flex flex-col flex-shrink-0 transition-all duration-200 z-10',
          sidebarOpen ? 'block' : 'hidden md:block md:w-0 md:border-none md:overflow-hidden'
        )}
      >
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <Button
            size="sm"
            className="w-full justify-start text-xs font-medium"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleNewChat}
          >
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
          {(['Today', 'Yesterday', 'Older'] as const).map((group) => {
            const list = groupedConvs[group];
            if (list.length === 0) return null;
            return (
              <div key={group} className="space-y-1">
                <p className="px-2.5 py-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {group}
                </p>
                {list.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={cn(
                      'group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-left',
                      conv.id === activeConvId
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 font-medium'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/60'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{conv.title || 'New conversation'}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity rounded"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Chat Header Bar */}
        <div className="h-12 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0d1119] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              aria-label="Toggle chat history"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Findora AI Assistant
              </span>
            </div>
          </div>
          <Button size="sm" variant="ghost" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleNewChat}>
            New Chat
          </Button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {loadingHistory ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState
                icon={<FileSearch className="w-10 h-10" />}
                title="Ask about your documents & files"
                description="Ask any question about your indexed files, request summaries, or locate documents across your system."
                className="py-20"
              />
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn('flex gap-3 group', msg.role === 'user' && 'flex-row-reverse')}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold mt-1',
                      msg.role === 'user'
                        ? 'bg-brand-600 text-white'
                        : msg.error
                        ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                        : 'bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-sm'
                    )}
                  >
                    {msg.role === 'user' ? 'You' : msg.error ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </div>

                  {/* Bubble Content */}
                  <div className={cn('max-w-[85%] space-y-1.5', msg.role === 'user' && 'items-end')}>
                    {/* Inline edit mode for user message */}
                    {editingMsgId === msg.id ? (
                      <div className="bg-white dark:bg-[#11151f] border border-brand-300 dark:border-brand-700 rounded-xl p-3 shadow-sm space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="input-base text-sm resize-none w-full"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => handleSaveEdit(msg.id)}>
                            Save & Submit
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'rounded-xl px-4 py-3 text-sm relative transition-all',
                          msg.role === 'user'
                            ? 'bg-brand-600 text-white shadow-sm'
                            : msg.error
                            ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400'
                            : 'bg-white dark:bg-[#11151f] border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 shadow-sm'
                        )}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                        {/* Citations */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-1.5">
                            {msg.sources.map((citation, i) => (
                              <button
                                key={i}
                                onClick={() => citation.file_id && navigate(`/files/${citation.file_id}`)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:text-brand-600 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 transition-colors"
                              >
                                <FileText className="w-3 h-3 text-brand-500" />
                                <span className="font-medium truncate max-w-[200px]">{getCitationName(citation)}</span>
                                {citation.page && <span className="text-gray-400 text-[11px]">p.{citation.page}</span>}
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Bar (Copy & Edit) */}
                    {editingMsgId !== msg.id && (
                      <div
                        className={cn(
                          'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400',
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="flex items-center gap-1 p-1 hover:text-gray-700 dark:hover:text-gray-200 rounded"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-[11px] text-emerald-500 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>

                        {msg.role === 'user' && (
                          <button
                            onClick={() => handleStartEdit(msg)}
                            className="flex items-center gap-1 p-1 hover:text-gray-700 dark:hover:text-gray-200 rounded ml-1"
                            title="Edit message"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Edit</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {sending && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center flex-shrink-0 text-white shadow-sm mt-1">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 py-2 text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                  <span>Searching documents & generating answer...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-[#0d1119]">
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
                placeholder="Ask about your documents (e.g. 'Where is my Python file?' or 'What is in topic 1?')..."
                rows={2}
                className="input-base pr-12 resize-none max-h-32 text-sm"
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="absolute right-2.5 bottom-2.5 p-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                aria-label="Send message"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
