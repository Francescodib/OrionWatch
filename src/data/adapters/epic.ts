import { fetchWithCorsFallback } from "../utils/cors";

const EPIC_API = "https://epic.gsfc.nasa.gov/api/natural";

export interface EpicImage {
  date: string;
  imageUrl: string;
  caption: string;
}

interface EpicRecord {
  date: string;
  image: string;
  caption: string;
}

export async function fetchEpicImage(signal?: AbortSignal): Promise<EpicImage | null> {
  const { response } = await fetchWithCorsFallback(EPIC_API, signal);
  const records = (await response.json()) as EpicRecord[];
  if (records.length === 0) return null;

  const latest = records[0]!;
  // Date format: "2026-03-25 00:13:03" → extract year/month/day
  const [datePart] = latest.date.split(" ");
  const [year, month, day] = datePart!.split("-");

  const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/thumbs/${latest.image}.jpg`;

  return {
    date: latest.date,
    imageUrl,
    caption: latest.caption,
  };
}
