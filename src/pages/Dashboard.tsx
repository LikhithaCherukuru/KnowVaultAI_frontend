import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Search, MessageSquare, FolderPlus, FileText, Clock, Loader2 } from 'lucide-react';
import { useAuth, getDisplayName } from '@/contexts/AuthContext';
import { getFiles } from '@/api/files';
import { getFolders } from '@/api/folders';
import type { FileItem, Folder } from '@/types';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { FileIconComponent } from '@/components/files/FileIcon';
import { formatBytes, formatRelativeTime, getGreeting, getFileCategory } from '@/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [filesRes, foldersRes] = await Promise.allSettled([
        getFiles(),
        getFolders(),
      ]);

      if (filesRes.status === 'fulfilled') {
        const val = filesRes.value;
        const fileArray = Array.isArray(val) ? val : (val.items ?? []);
        const sorted = [...fileArray].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setFiles(sorted);
      }
      if (foldersRes.status === 'fulfilled') {
        const val = foldersRes.value;
        setFolders(Array.isArray(val) ? val : (val.items ?? []));
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const recentFiles = files.slice(0, 5);
  const processingFiles = files.filter(
    (f) => f.status === 'queued' || f.status === 'processing' || f.status === 'pending' || f.status === 'uploaded'
  );
  const indexedCount = files.filter((f) => f.status === 'completed' || f.status === 'indexed').length;

  const quickActions = [
    { label: 'Upload File', icon: Upload, to: '/files', primary: true },
    { label: 'Search Files', icon: Search, to: '/search' },
    { label: 'Ask AI', icon: MessageSquare, to: '/chat' },
    { label: 'Create Folder', icon: FolderPlus, to: '/folders' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {getGreeting()}{user ? `, ${getDisplayName(user) || user.email}` : ''}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Find anything in your knowledge base.</p>
      </div>

      <div className="surface p-4">
        <button
          onClick={() => navigate('/search')}
          className="w-full flex items-center gap-2 text-left"
        >
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-400">Search your knowledge base...</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="surface p-4 flex flex-col items-center gap-2 hover:border-brand-300 dark:hover:border-brand-700 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-950/40 dark:group-hover:text-brand-400 transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="surface p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Unable to load your data. Please try again.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={loadData}>Try again</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total Files" value={files.length} icon={FileText} />
            <StatCard label="Folders" value={folders.length} icon={FolderPlus} />
            <StatCard label="Indexed" value={indexedCount} icon={Search} />
            <StatCard label="Processing" value={processingFiles.length} icon={Clock} />
          </div>

          {processingFiles.length > 0 && (
            <div className="surface">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Currently Processing</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {processingFiles.slice(0, 4).map((file) => (
                  <div key={file.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Loader2 className="w-4 h-4 text-brand-500 animate-spin flex-shrink-0" />
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 truncate">{file.name}</span>
                    <StatusBadge status={file.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="surface">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Files</h2>
              <button onClick={() => navigate('/files')} className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400">
                View all
              </button>
            </div>
            {recentFiles.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No files yet. Upload your first document to get started.</p>
                <Button size="sm" className="mt-3" icon={<Upload className="w-3.5 h-3.5" />} onClick={() => navigate('/files')}>
                  Upload File
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {recentFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => navigate(`/files/${file.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <FileIconComponent category={file.category || getFileCategory(file.name, file.mime_type)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(file.size)} · {formatRelativeTime(file.updated_at)}</p>
                    </div>
                    <StatusBadge status={file.status} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof FileText }) {
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{value}</p>
    </div>
  );
}
