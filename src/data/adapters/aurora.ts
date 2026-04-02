import { fetchWithCorsFallback } from "../utils/cors";

const AURORA_URL = "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json";

export interface AuroraForecast {
  observationTime: string;
  forecastTime: string;
  maxIntensity: number;        // 0-100 scale
  northLatitude: number;       // estimated southernmost latitude for aurora visibility (north)
  southLatitude: number;       // estimated northernmost latitude for aurora visibility (south)
}

interface AuroraResponse {
  "Observation Time": string;
  "Forecast Time": string;
  coordinates: [number, number, number][];  // [lon, lat, intensity]
}

export async function fetchAuroraForecast(signal?: AbortSignal): Promise<AuroraForecast> {
  const { response } = await fetchWithCorsFallback(AURORA_URL, signal);
  const data = (await response.json()) as AuroraResponse;

  let maxIntensity = 0;
  let minNorthLat = 90;   // southernmost visible aurora in north
  let maxSouthLat = -90;  // northernmost visible aurora in south

  for (const [, lat, intensity] of data.coordinates) {
    if (intensity > maxIntensity) maxIntensity = intensity;

    // Aurora visible threshold: intensity > 10
    if (intensity > 10) {
      if (lat > 0 && lat < minNorthLat) minNorthLat = lat;
      if (lat < 0 && lat > maxSouthLat) maxSouthLat = lat;
    }
  }

  return {
    observationTime: data["Observation Time"],
    forecastTime: data["Forecast Time"],
    maxIntensity,
    northLatitude: minNorthLat === 90 ? 70 : minNorthLat,
    southLatitude: maxSouthLat === -90 ? -70 : maxSouthLat,
  };
}
