import { useCallback } from "react";
import { usePolling } from "../utils/polling";
import { fetchNasaImages } from "../adapters/nasa-images";
import type { NasaImage } from "../targets/types";

export function useNasaImages(query: string) {
  const fetchFn = useCallback(
    async (signal: AbortSignal): Promise<NasaImage[]> => {
      return fetchNasaImages(query, signal);
    },
    [query],
  );

  return usePolling(fetchFn, 300_000, !!query);
}
