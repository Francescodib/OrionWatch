import { fetchWithCorsFallback } from "../utils/cors";

const APOD_API = "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY";

export interface ApodData {
  title: string;
  url: string;
  explanation: string;
  date: string;
  mediaType: "image" | "video";
}

interface ApodRecord {
  title: string;
  url: string;
  explanation: string;
  date: string;
  media_type: string;
}

export async function fetchApod(signal?: AbortSignal): Promise<ApodData> {
  const { response } = await fetchWithCorsFallback(APOD_API, signal);
  const data = (await response.json()) as ApodRecord;

  return {
    title: data.title,
    url: data.url,
    explanation: data.explanation,
    date: data.date,
    mediaType: data.media_type === "video" ? "video" : "image",
  };
}
