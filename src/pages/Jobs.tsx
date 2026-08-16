import { Clock, Info } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Jobs() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Processing Jobs</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Background file processing and indexing</p>
      </div>

      <div className="surface">
        <EmptyState
          icon={<Clock className="w-10 h-10" />}
          title="Jobs endpoint not available"
          description="The backend does not currently expose a dedicated /jobs endpoint. File processing status is shown on the Files and Dashboard pages instead."
        />
      </div>

      <div className="surface p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Where to see processing status</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Each file's processing status (queued, processing, completed, failed) is displayed directly in the Files list and on the Dashboard. Check the Files page for the most up-to-date status of your documents.
          </p>
        </div>
      </div>
    </div>
  );
}
