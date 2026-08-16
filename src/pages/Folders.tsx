import { useEffect, useState, useCallback } from 'react';
import { Folder as FolderIcon, MoreVertical, Trash2, ChevronRight, FolderPlus } from 'lucide-react';
import { getFolders, deleteFolder } from '@/api/folders';
import type { Folder } from '@/types';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';

export default function Folders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadFolders = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getFolders();
      setFolders(Array.isArray(data) ? data : (data.items ?? []));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFolder(deleteTarget.id);
      setFolders((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Folders</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Organize your scanned documents</p>
        </div>
      </div>

      {loading ? (
        <div className="surface p-4">
          <TableSkeleton />
        </div>
      ) : error ? (
        <div className="surface">
          <ErrorState message="Unable to load folders." onRetry={loadFolders} />
        </div>
      ) : folders.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={<FolderIcon className="w-10 h-10" />}
            title="No folders yet"
            description="Folders are created when you scan and index directories from your system. Use the Scan / Index button in Files to add folders."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="surface p-3 flex items-center gap-3 group"
            >
              <FolderIcon className="w-8 h-8 text-brand-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{folder.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {folder.file_count ?? 0} files
                  {folder.folder_count ? ` · ${folder.folder_count} folders` : ''}
                </p>
              </div>
              <Dropdown
                trigger={
                  <button className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Folder actions">
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
        onConfirm={handleDelete}
        title="Delete folder"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Files inside may also be affected.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
