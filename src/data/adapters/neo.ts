import { fetchWithCorsFallback } from "../utils/cors";

const NEO_API = "https://api.nasa.gov/neo/rest/v1/feed/today?api_key=DEMO_KEY";

export interface NeoSummary {
  date: string;
  count: number;
  hazardousCount: number;
  closestName: string;
  closestDistanceKm: number;
  closestSpeedKmS: number;
}

interface NeoRecord {
  name: string;
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: {
    miss_distance: { kilometers: string };
    relative_velocity: { kilometers_per_second: string };
  }[];
}

interface NeoResponse {
  element_count: number;
  near_earth_objects: Record<string, NeoRecord[]>;
}

export async function fetchNeoSummary(signal?: AbortSignal): Promise<NeoSummary | null> {
  const { response } = await fetchWithCorsFallback(NEO_API, signal);
  const data = (await response.json()) as NeoResponse;

  const dates = Object.keys(data.near_earth_objects);
  if (dates.length === 0) return null;

  const date = dates[0]!;
  const neos = data.near_earth_objects[date]!;

  const hazardous = neos.filter((n) => n.is_potentially_hazardous_asteroid);

  // Find closest approach
  let closestDist = Infinity;
  let closestNeo: NeoRecord | null = null;
  for (const neo of neos) {
    const approach = neo.close_approach_data[0];
    if (approach) {
      const dist = parseFloat(approach.miss_distance.kilometers);
      if (dist < closestDist) {
        closestDist = dist;
        closestNeo = neo;
      }
    }
  }

  const closestApproach = closestNeo?.close_approach_data[0];

  return {
    date,
    count: data.element_count,
    hazardousCount: hazardous.length,
    closestName: closestNeo?.name ?? "—",
    closestDistanceKm: closestDist === Infinity ? 0 : closestDist,
    closestSpeedKmS: closestApproach
      ? parseFloat(closestApproach.relative_velocity.kilometers_per_second)
      : 0,
  };
}
