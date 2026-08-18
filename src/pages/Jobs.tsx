import { useEffect, useState } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { getJobs, type ProcessingJob } from '@/api/jobs';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatRelativeTime } from '@/utils';

export default function Jobs() {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    setError(false);
    try {
      setJobs(await getJobs());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Processing Jobs</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Backend-generated scanning and indexing work</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={loadJobs}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="surface p-4"><TableSkeleton /></div>
      ) : error ? (
        <div className="surface"><ErrorState message="Unable to load jobs." onRetry={loadJobs} /></div>
      ) : jobs.length === 0 ? (
        <div className="surface">
          <EmptyState icon={<Clock className="w-10 h-10" />} title="No jobs yet" description="Jobs are created automatically when configured folders are scanned." />
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                <th className="text-left font-medium px-4 py-2.5">Job</th>
                <th className="text-left font-medium px-4 py-2.5">File</th>
                <th className="text-left font-medium px-4 py-2.5">Status</th>
                <th className="text-left font-medium px-4 py-2.5">Progress</th>
                <th className="text-left font-medium px-4 py-2.5">Message</th>
                <th className="text-left font-medium px-4 py-2.5">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">{job.id}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">{job.file_id || '-'}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={job.status.toLowerCase() as any} /></td>
                  <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300">{job.progress ?? 0}%</td>
                  <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300">{job.error || job.message || '-'}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">{job.created_at ? formatRelativeTime(job.created_at) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
