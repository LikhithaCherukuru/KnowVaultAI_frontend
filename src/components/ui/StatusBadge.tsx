import type { ProcessingStatus } from '@/types';
import { getStatusBg, getStatusLabel, cn } from '@/utils';

interface StatusBadgeProps {
  status: ProcessingStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium',
        getStatusBg(status),
        className
      )}
    >
      {status === 'processing' && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {status === 'queued' && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      )}
      {getStatusLabel(status)}
    </span>
  );
}
