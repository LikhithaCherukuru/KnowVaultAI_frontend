import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="mb-3 text-red-400 dark:text-red-500">
        <AlertCircle className="w-8 h-8" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4" icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Try again
        </Button>
      )}
    </div>
  );
}
