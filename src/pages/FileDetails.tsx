import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, MessageSquare, FileText, Calendar, HardDrive, Hash, Folder } from 'lucide-react';
import { getFile, deleteFile } from '@/api/files';
import type { FileItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FileIconComponent } from '@/components/files/FileIcon';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { formatBytes, formatDateTime, getFileCategory } from '@/utils';

export default function FileDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [file, setFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadFile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const data = await getFile(id);
      setFile(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadFile();
  }, [loadFile]);

  const handleDelete = async () => {
    if (!file) return;
    setDeleting(true);
    try {
      await deleteFile(file.id);
      navigate('/files');
    } catch {
      // Error handled by dialog
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="surface p-6 space-y-4">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="surface">
        <ErrorState message="Unable to load this file. It may have been deleted or is unavailable." onRetry={loadFile} />
      </div>
    );
  }

  const category = file.category || getFileCategory(file.name, file.mime_type);

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[
        { label: 'Files', to: '/files' },
        { label: file.name },
      ]} />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/files')}
            className="p-2 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Back to files"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <FileIconComponent category={category} className="w-6 h-6 flex-shrink-0" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{file.name}</h1>
          <StatusBadge status={file.status} />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<MessageSquare className="w-3.5 h-3.5" />} onClick={() => navigate('/chat')}>
            Ask AI
          </Button>
          <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="surface p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={FileText} label="File type" value={file.file_type || file.mime_type || category.toUpperCase()} />
          <InfoRow icon={HardDrive} label="Size" value={formatBytes(file.size)} />
          <InfoRow icon={Calendar} label="Created" value={formatDateTime(file.created_at)} />
          <InfoRow icon={Calendar} label="Modified" value={formatDateTime(file.updated_at)} />
          {file.sha256 && <InfoRow icon={Hash} label="SHA-256" value={file.sha256.substring(0, 16) + '...'} mono />}
          {file.file_path && <InfoRow icon={Folder} label="File path" value={file.file_path} />}
          {file.processed_at && <InfoRow icon={Calendar} label="Processed" value={formatDateTime(file.processed_at)} />}
        </div>

        {file.is_duplicate && file.duplicate_file_name && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              This file is a duplicate of{' '}
              <Link to={`/files/${file.duplicate_of || ''}`} className="font-medium underline">
                {file.duplicate_file_name}
              </Link>
            </p>
          </div>
        )}

        {file.error_message && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
            <p className="text-sm text-red-700 dark:text-red-400">Processing error: {file.error_message}</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete file"
        message={`Are you sure you want to delete "${file.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: typeof FileText; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-sm text-gray-900 dark:text-gray-100 truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
