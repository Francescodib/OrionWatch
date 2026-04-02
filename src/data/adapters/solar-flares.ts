import { fetchWithCorsFallback } from "../utils/cors";

const FLARE_URL =
  "https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json";

export interface SolarFlare {
  beginTime: Date;
  maxTime: Date;
  endTime: Date | null;
  currentClass: string;   // e.g. "B9.0"
  maxClass: string;       // e.g. "C1.2"
  isActive: boolean;
}

/** Flare class severity: A < B < C < M < X */
export function flareLevel(cls: string): "quiet" | "minor" | "moderate" | "strong" | "extreme" {
  if (!cls) return "quiet";
  const letter = cls[0]?.toUpperCase();
  if (letter === "X") return "extreme";
  if (letter === "M") return "strong";
  if (letter === "C") return "moderate";
  if (letter === "B") return "minor";
  return "quiet";
}

interface NoaaFlareRecord {
  begin_time: string;
  max_time: string;
  end_time: string | null;
  current_class: string;
  max_class: string;
}

export async function fetchSolarFlares(
  signal?: AbortSignal,
): Promise<SolarFlare[]> {
  const { response } = await fetchWithCorsFallback(FLARE_URL, signal);
  const records = (await response.json()) as NoaaFlareRecord[];

  return records.map((r) => ({
    beginTime: new Date(r.begin_time),
    maxTime: new Date(r.max_time),
    endTime: r.end_time ? new Date(r.end_time) : null,
    currentClass: r.current_class,
    maxClass: r.max_class,
    isActive: !r.end_time,
  }));
}
