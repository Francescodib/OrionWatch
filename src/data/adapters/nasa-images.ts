import type { NasaImage } from "../targets/types";

const NASA_IMAGES_API = "https://images-api.nasa.gov/search";

interface NasaApiItem {
  data: Array<{
    nasa_id: string;
    title: string;
    description?: string;
    date_created: string;
  }>;
  links?: Array<{
    href: string;
    rel: string;
  }>;
}

interface NasaApiResponse {
  collection: {
    items: NasaApiItem[];
  };
}

export async function fetchNasaImages(
  query: string,
  signal?: AbortSignal,
): Promise<NasaImage[]> {
  const params = new URLSearchParams({
    q: query,
    media_type: "image",
    page_size: "12",
  });

  const response = await fetch(`${NASA_IMAGES_API}?${params}`, { signal });
  if (!response.ok) throw new Error(`NASA Images: ${response.status}`);

  const json = (await response.json()) as NasaApiResponse;

  return json.collection.items
    .filter((item) => item.data[0] && item.links?.[0])
    .map((item) => {
      const data = item.data[0]!;
      const thumb = item.links![0]!.href;
      return {
        nasaId: data.nasa_id,
        title: data.title,
        description: data.description ?? "",
        dateCreated: data.date_created,
        thumbUrl: thumb,
        fullUrl: thumb.replace("~thumb", "~medium"),
      };
    });
}
