import { useCallback } from "react";
import { usePolling } from "../utils/polling";
import { fetchDsnStatus } from "../adapters/dsn";

export function useDsn(enabled: boolean = true) {
  const fetchFn = useCallback(
    (signal: AbortSignal) => fetchDsnStatus(signal),
    [],
  );

  return usePolling(fetchFn, 10_000, enabled); // DSN updates every ~5-10s
}
