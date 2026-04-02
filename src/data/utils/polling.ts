import { useEffect, useRef, useState, useCallback } from "react";

export interface PollingResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  lastUpdated: Date | null;
  refetch: () => void;
}

export function usePolling<T>(
  fetchFn: (signal: AbortSignal) => Promise<T>,
  intervalMs: number,
  enabled: boolean = true,
): PollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const fetchRef = useRef(fetchFn);
  const manualTrigger = useRef(0);

  fetchRef.current = fetchFn;

  const refetch = useCallback(() => {
    manualTrigger.current += 1;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout>;
    let mounted = true;

    async function doFetch() {
      try {
        const result = await fetchRef.current(controller.signal);
        if (mounted) {
          setData(result);
          setError(null);
          setLastUpdated(new Date());
          setLoading(false);
        }
      } catch (err) {
        if (mounted && !controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
      if (mounted && !controller.signal.aborted) {
        timeoutId = setTimeout(doFetch, intervalMs);
      }
    }

    setLoading(true);
    doFetch();

    return () => {
      mounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [intervalMs, enabled, manualTrigger.current]);

  return { data, error, loading, lastUpdated, refetch };
}
