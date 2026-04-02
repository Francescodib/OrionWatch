import { useCallback } from "react";
import { usePolling } from "../utils/polling";
import { fetchMissionBlog } from "../adapters/rss";
import type { BlogPost } from "../targets/types";

export function useMissionBlog(rssUrl: string) {
  const fetchFn = useCallback(
    async (signal: AbortSignal): Promise<BlogPost[]> => {
      return fetchMissionBlog(rssUrl, signal);
    },
    [rssUrl],
  );

  return usePolling(fetchFn, 120_000, !!rssUrl);
}
