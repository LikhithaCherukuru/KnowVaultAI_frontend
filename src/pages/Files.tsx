import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Trash2, FileText, X, AlertCircle, CheckCircle2, Loader2, FolderPlus } from 'lucide-react';
import { getFiles, deleteFile, scanFile, startIndexing } from '@/api/files';
import { getFolders } from '@/api/folders';
import type { FileItem, Folder, ScanResult } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FileIconComponent } from '@/components/files/FileIcon';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Modal } from '@/components/ui/Modal';
import { formatBytes, formatRelativeTime, getFileCategory, cn } from '@/utils';

interface ScanTask {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ScanResult;
  error?: string;
}

export default function Files() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [scanPath, setScanPath] = useState('');
  const [scanFolder, setScanFolder] = useState('');
  const [scanTasks, setScanTasks] = useState<ScanTask[]>([]);
  const [scanning, setScanning] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [filesRes, foldersRes] = await Promise.allSettled([getFiles(), getFolders()]);
      if (filesRes.status === 'fulfilled') {
        const val = filesRes.value;
        setFiles(Array.isArray(val) ? val : (val.items ?? []));
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

  const filteredFiles = search
    ? files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFile(deleteTarget.id);
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // Error handled by dialog state
    } finally {
      setDeleting(false);
    }
  };

  const handleScanFile = async () => {
    if (!scanPath.trim() || !user) return;
    setScanning(true);
    const taskId = `task-${Date.now()}`;
    setScanTasks((prev) => [...prev, { id: taskId, label: scanPath.trim(), status: 'processing' }]);
    try {
      const result = await scanFile({ user_id: user.id, file_path: scanPath.trim() });
      setScanTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'completed', result } : t))
      );
      setTimeout(() => loadData(), 500);
    } catch (err) {
      setScanTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'failed', error: err instanceof Error ? err.message : 'Scan failed' }
            : t
        )
      );
    } finally {
      setScanning(false);
      setScanPath('');
    }
  };

  const handleStartIndexing = async () => {
    if (!scanFolder.trim() || !user) return;
    setScanning(true);
    const taskId = `task-${Date.now()}`;
    setScanTasks((prev) => [...prev, { id: taskId, label: scanFolder.trim(), status: 'processing' }]);
    try {
      const result = await startIndexing({ user_id: user.id, folder_path: scanFolder.trim() });
      setScanTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'completed', result } : t))
      );
      setTimeout(() => loadData(), 500);
    } catch (err) {
      setScanTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'failed', error: err instanceof Error ? err.message : 'Indexing failed' }
            : t
        )
      );
    } finally {
      setScanning(false);
      setScanFolder('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            className="input-base pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button icon={<FolderPlus className="w-4 h-4" />} onClick={() => setScanOpen(true)}>
          Scan / Index
        </Button>
      </div>

      {loading ? (
        <div className="surface p-4">
          <TableSkeleton />
        </div>
      ) : error ? (
        <div className="surface">
          <ErrorState message="Unable to load your files." onRetry={loadData} />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={<FileText className="w-10 h-10" />}
            title={search ? "No files match your search" : "No files found"}
            description={search ? "Try different keywords." : "Scan a file or folder from your system to add documents to your knowledge base."}
            action={
              !search ? (
                <Button icon={<FolderPlus className="w-4 h-4" />} onClick={() => setScanOpen(true)}>
                  Scan / Index
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="surface hidden md:block overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                  <th className="text-left font-medium px-4 py-2.5">Name</th>
                  <th className="text-left font-medium px-4 py-2.5">Size</th>
                  <th className="text-left font-medium px-4 py-2.5">Modified</th>
                  <th className="text-left font-medium px-4 py-2.5">Status</th>
                  <th className="w-10 px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/files/${file.id}`)}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <FileIconComponent category={file.category || getFileCategory(file.name, file.mime_type)} />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 tabular-nums">{formatBytes(file.size)}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">{formatRelativeTime(file.updated_at)}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={file.status} /></td>
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Dropdown
                        trigger={
                          <button className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="File actions">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        }
                      >
                        <DropdownItem onClick={() => navigate(`/files/${file.id}`)} icon={<FileText className="w-4 h-4" />}>
                          View details
                        </DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem onClick={() => setDeleteTarget(file)} icon={<Trash2 className="w-4 h-4" />} danger>
                          Delete
                        </DropdownItem>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filteredFiles.map((file) => (
              <div key={file.id} className="surface p-3 flex items-center gap-3" onClick={() => navigate(`/files/${file.id}`)}>
                <FileIconComponent category={file.category || getFileCategory(file.name, file.mime_type)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(file.size)} · {formatRelativeTime(file.updated_at)}</p>
                  <div className="mt-1.5"><StatusBadge status={file.status} /></div>
                </div>
                <button
                  className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(file); }}
                  aria-label="File actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Scan / Index Modal */}
      <Modal open={scanOpen} onClose={() => setScanOpen(false)} title="Scan & Index Files" size="lg">
        <div className="space-y-4">
          <div>
            <Input
              label="Scan a single file"
              placeholder="/path/to/your/document.pdf"
              value={scanPath}
              onChange={(e) => setScanPath(e.target.value)}
              hint="Enter the full file path on your system"
            />
            <Button
              size="sm"
              className="mt-2"
              onClick={handleScanFile}
              loading={scanning}
              disabled={!scanPath.trim() || !user}
              icon={<FileText className="w-3.5 h-3.5" />}
            >
              Scan File
            </Button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <Input
              label="Index a folder"
              placeholder="/path/to/your/folder"
              value={scanFolder}
              onChange={(e) => setScanFolder(e.target.value)}
              hint="Enter the full folder path to index all files"
            />
            <Button
              size="sm"
              className="mt-2"
              onClick={handleStartIndexing}
              loading={scanning}
              disabled={!scanFolder.trim() || !user}
              icon={<FolderPlus className="w-3.5 h-3.5" />}
            >
              Start Indexing
            </Button>
          </div>

          {scanTasks.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {scanTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 dark:border-gray-800">
                  <div className="flex-shrink-0">
                    {task.status === 'processing' && <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />}
                    {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {task.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{task.label}</p>
                    {task.status === 'failed' && task.error && (
                      <p className="text-xs text-red-600 dark:text-red-400">{task.error}</p>
                    )}
                    {task.status === 'completed' && task.result?.is_duplicate && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Duplicate of: {task.result.duplicate_file_name || 'existing file'}
                      </p>
                    )}
                    {task.status === 'completed' && !task.result?.is_duplicate && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">Scanned and processing</p>
                    )}
                  </div>
                  <button
                    onClick={() => setScanTasks((prev) => prev.filter((t) => t.id !== task.id))}
                    className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete file"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
