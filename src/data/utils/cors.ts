export type CorsStrategy = "direct" | "proxy" | "corsproxy" | "failed";

interface FetchResult {
  response: Response;
  strategy: CorsStrategy;
}

const PROXY_URL = import.meta.env.VITE_HORIZONS_PROXY_URL || "";

async function fetchWithTimeout(
  url: string,
  signal?: AbortSignal,
  timeoutMs = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  // If parent signal aborts, forward it
  signal?.addEventListener("abort", () => controller.abort(), { once: true });

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchWithCorsFallback(
  url: string,
  signal?: AbortSignal,
): Promise<FetchResult> {
  // Tier 1: direct fetch (short timeout — if CORS blocks, fails quickly)
  try {
    const response = await fetchWithTimeout(url, signal, 4000);
    if (response.ok) {
      return { response, strategy: "direct" };
    }
  } catch {
    // CORS or network error — try next tier
  }

  // Tier 2: Cloudflare Worker proxy (if configured)
  if (PROXY_URL) {
    try {
      const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
      const response = await fetchWithTimeout(proxyUrl, signal, 8000);
      if (response.ok) return { response, strategy: "proxy" };
    } catch {
      // proxy failed — try next tier
    }
  }

  // Tier 3: public CORS proxies
  const proxies = [
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  ];

  for (const makeUrl of proxies) {
    try {
      const response = await fetchWithTimeout(makeUrl(url), signal, 10000);
      if (response.ok) {
        return { response, strategy: "corsproxy" };
      }
    } catch {
      // try next proxy
    }
  }

  throw new Error(`All CORS strategies failed for: ${url}`);
}
