import { useEffect, useState, useCallback, useRef } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) as T : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    setStored(value);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, [key]);

  return [stored, setValue];
}

export function usePolling<T>(
  fetcher: () => Promise<T>,
  options: { interval: number; enabled: boolean; onUpdate?: (data: T) => void }
): { data: T | null; loading: boolean; error: Error | null; stop: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (!options.enabled) {
      stop();
      return;
    }

    const poll = async () => {
      setLoading(true);
      try {
        const result = await fetcher();
        if (mountedRef.current) {
          setData(result);
          setError(null);
          options.onUpdate?.(result);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error('Polling failed'));
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, options.interval);

    return stop;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.enabled, options.interval]);

  return { data, loading, error, stop };
}
