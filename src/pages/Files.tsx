import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Trash2, FileText, FolderPlus, RefreshCw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getFiles, deleteFile, startIndexing } from '@/api/files';
import type { FileItem, ScanResult } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { FileIconComponent } from '@/components/files/FileIcon';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatBytes, formatRelativeTime, getFileCategory } from '@/utils';

export default function Files() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const filesRes = await getFiles();
      const val = Array.isArray(filesRes) ? filesRes : (filesRes.items ?? []);
      setFiles(val);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fileTypes = Array.from(new Set(files.map((f) => f.file_type || '').filter(Boolean))).sort();
  const filteredFiles = files
    .filter((f) => {
      const q = search.toLowerCase();
      const path = f.file_path || '';
      return !q || f.name.toLowerCase().includes(q) || path.toLowerCase().includes(q);
    })
    .filter((f) => typeFilter === 'all' || f.file_type === typeFilter)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

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

  const handleScanComputer = async () => {
    if (!user || scanning) return;
    setScanning(true);
    setScanMessage(null);
    try {
      const result: ScanResult = await startIndexing({ user_id: user.id });
      const added = result.files_registered ?? 0;
      setScanMessage({
        text: `Scan completed successfully. Discovered and registered ${added} new files.`,
        type: 'success',
      });
      await loadData();
    } catch (err) {
      setScanMessage({
        text: err instanceof Error ? err.message : 'Filesystem scan failed.',
        type: 'error',
      });
    } finally {
      setScanning(false);
      setTimeout(() => setScanMessage(null), 6000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header actions */}
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
        <div className="flex items-center gap-2">
          <Button
            icon={scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
            onClick={handleScanComputer}
            disabled={scanning || !user}
          >
            {scanning ? 'Scanning...' : 'Scan Computer'}
          </Button>
          <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={loadData} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {scanMessage && (
        <div
          className={`p-3 rounded-lg flex items-center gap-2.5 text-sm ${
            scanMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {scanMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{scanMessage.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <select
          className="input-base max-w-xs"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All file types ({files.length})</option>
          {fileTypes.map((type) => (
            <option key={type} value={type}>
              {type} ({files.filter((f) => f.file_type === type).length})
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Showing {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
        </span>
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
            title={search ? 'No files match your search' : 'No files found'}
            description={
              search
                ? 'Try different search keywords.'
                : 'Click "Scan Computer" to discover files from your system and add them to Findora.'
            }
            action={
              !search ? (
                <Button
                  icon={<FolderPlus className="w-4 h-4" />}
                  onClick={handleScanComputer}
                  loading={scanning}
                >
                  Scan Computer
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
                  <th className="text-left font-medium px-4 py-2.5">Path</th>
                  <th className="text-left font-medium px-4 py-2.5">Type</th>
                  <th className="text-left font-medium px-4 py-2.5">Size</th>
                  <th className="text-left font-medium px-4 py-2.5">Modified</th>
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
                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 max-w-sm truncate" title={file.file_path}>{file.file_path}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">{file.file_type || '-'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 tabular-nums">{formatBytes(file.size)}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">{formatRelativeTime(file.updated_at)}</td>
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
                  {file.file_path && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{file.file_path}</p>}
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
