import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder as FolderIcon, MoreVertical, Trash2, ArrowLeft, FileText, Search, RefreshCw } from 'lucide-react';
import { getFolders, deleteFolder } from '@/api/folders';
import { getFilesByFolder, deleteFile } from '@/api/files';
import type { Folder, FileItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { FileIconComponent } from '@/components/files/FileIcon';
import { formatBytes, formatRelativeTime, getFileCategory } from '@/utils';

export default function Folders() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  // Selected folder drill-down state
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [folderFiles, setFolderFiles] = useState<FileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [deleteFileTarget, setDeleteFileTarget] = useState<FileItem | null>(null);

  const loadFolders = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getFolders();
      const list = Array.isArray(data) ? data : (data.items ?? []);
      setFolders(list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleSelectFolder = async (folder: Folder) => {
    setSelectedFolder(folder);
    setLoadingFiles(true);
    try {
      const path = folder.folder_path || folder.local_path || folder.name;
      const files = await getFilesByFolder(path);
      setFolderFiles(files);
    } catch (e) {
      console.error('Error fetching folder files:', e);
      setFolderFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFolder(deleteTarget.id);
      setFolders((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      if (selectedFolder?.id === deleteTarget.id) {
        setSelectedFolder(null);
      }
      setDeleteTarget(null);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!deleteFileTarget) return;
    try {
      await deleteFile(deleteFileTarget.id);
      setFolderFiles((prev) => prev.filter((f) => f.id !== deleteFileTarget.id));
      setDeleteFileTarget(null);
    } catch {
      // ignore
    }
  };

  const filteredFolders = folders.filter((f) => {
    const q = search.toLowerCase();
    const name = f.name || f.folder_name || '';
    const path = f.folder_path || f.local_path || '';
    return !q || name.toLowerCase().includes(q) || path.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          {selectedFolder ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedFolder(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                aria-label="Back to folders"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {selectedFolder.name || selectedFolder.folder_name}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-lg">
                  {selectedFolder.folder_path || selectedFolder.local_path}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Folders</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Discovered filesystem directories
              </p>
            </div>
          )}
        </div>

        {!selectedFolder && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search folders..."
                className="input-base pl-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={loadFolders} disabled={loading}>
              Refresh
            </Button>
          </div>
        )}
      </div>

      {/* Detail view when a folder is clicked */}
      {selectedFolder ? (
        <div className="space-y-3">
          {loadingFiles ? (
            <div className="surface p-4">
              <TableSkeleton />
            </div>
          ) : folderFiles.length === 0 ? (
            <div className="surface">
              <EmptyState
                icon={<FileText className="w-10 h-10" />}
                title="No files in this folder"
                description={`No files were indexed under "${selectedFolder.folder_path || selectedFolder.local_path}".`}
              />
            </div>
          ) : (
            <div className="surface overflow-hidden">
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
                  {folderFiles.map((file) => (
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
                      <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 max-w-sm truncate" title={file.file_path}>
                        {file.file_path}
                      </td>
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
                          <DropdownItem onClick={() => setDeleteFileTarget(file)} icon={<Trash2 className="w-4 h-4" />} danger>
                            Delete
                          </DropdownItem>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="surface p-4">
          <TableSkeleton />
        </div>
      ) : error ? (
        <div className="surface">
          <ErrorState message="Unable to load folders." onRetry={loadFolders} />
        </div>
      ) : filteredFolders.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={<FolderIcon className="w-10 h-10" />}
            title="No folders discovered yet"
            description="Folders are populated automatically when you run 'Scan Computer' in the Files page."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredFolders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => handleSelectFolder(folder)}
              className="surface p-3 flex items-center gap-3 group cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
            >
              <FolderIcon className="w-8 h-8 text-brand-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {folder.name || folder.folder_name}
                </p>
                {(folder.folder_path || folder.local_path) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {folder.folder_path || folder.local_path}
                  </p>
                )}
              </div>
              <Dropdown
                trigger={
                  <button
                    className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Folder actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                }
              >
                <DropdownItem onClick={() => setDeleteTarget(folder)} icon={<Trash2 className="w-4 h-4" />} danger>
                  Delete
                </DropdownItem>
              </Dropdown>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteFolder}
        title="Delete folder"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        loading={deleting}
      />

      <ConfirmDialog
        open={!!deleteFileTarget}
        onClose={() => setDeleteFileTarget(null)}
        onConfirm={handleDeleteFile}
        title="Delete file"
        message={`Are you sure you want to delete "${deleteFileTarget?.name}"?`}
        confirmLabel="Delete"
      />
    </div>
  );
}
