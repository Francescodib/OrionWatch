import type { BlogPost } from "../targets/types";

const RSS2JSON_API = "https://api.rss2json.com/v1/api.json";

interface Rss2JsonItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail?: string;
  enclosure?: { link?: string };
}

interface Rss2JsonResponse {
  status: string;
  items: Rss2JsonItem[];
}

export async function fetchMissionBlog(
  rssUrl: string,
  signal?: AbortSignal,
): Promise<BlogPost[]> {
  const params = new URLSearchParams({
    rss_url: rssUrl,
    count: "10",
  });

  const response = await fetch(`${RSS2JSON_API}?${params}`, { signal });
  if (!response.ok) throw new Error(`RSS2JSON: ${response.status}`);

  const json = (await response.json()) as Rss2JsonResponse;
  if (json.status !== "ok") throw new Error("RSS2JSON status not ok");

  return json.items.map((item) => ({
    title: item.title,
    link: item.link,
    pubDate: item.pubDate,
    description: item.description.replace(/<[^>]*>/g, "").slice(0, 200),
    thumbnail: item.thumbnail || item.enclosure?.link || null,
  }));
}
