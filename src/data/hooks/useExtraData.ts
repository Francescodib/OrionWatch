import { useCallback } from "react";
import { usePolling } from "../utils/polling";
import { fetchEpicImage } from "../adapters/epic";
import { fetchNeoSummary } from "../adapters/neo";
import { fetchApod } from "../adapters/apod";
import { fetchAuroraForecast } from "../adapters/aurora";

export function useEpic(enabled = true) {
  const fetchFn = useCallback(
    (signal: AbortSignal) => fetchEpicImage(signal),
    [],
  );
  return usePolling(fetchFn, 600_000, enabled); // 10 min — images update rarely
}

export function useNeo(enabled = true) {
  const fetchFn = useCallback(
    (signal: AbortSignal) => fetchNeoSummary(signal),
    [],
  );
  return usePolling(fetchFn, 600_000, enabled); // 10 min
}

export function useApod(enabled = true) {
  const fetchFn = useCallback(
    (signal: AbortSignal) => fetchApod(signal),
    [],
  );
  return usePolling(fetchFn, 3600_000, enabled); // 1 hr — changes daily
}

export function useAurora(enabled = true) {
  const fetchFn = useCallback(
    (signal: AbortSignal) => fetchAuroraForecast(signal),
    [],
  );
  return usePolling(fetchFn, 120_000, enabled); // 2 min
}
