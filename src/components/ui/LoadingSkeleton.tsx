import { cn } from '@/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-md bg-gray-200 dark:bg-gray-800', className)} />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="w-8 h-8 rounded-md" />
          <Skeleton className="flex-1 h-4" />
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-16 h-4" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="surface p-4 space-y-3">
      <Skeleton className="w-12 h-12 rounded-lg" />
      <Skeleton className="w-3/4 h-4" />
      <Skeleton className="w-1/2 h-3" />
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 py-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={cn('flex gap-3', i % 2 === 0 && 'flex-row-reverse')}>
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="max-w-[70%] space-y-2">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-2/3 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}
