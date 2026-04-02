import type { SolarWindSample, KpIndexSample } from "../targets/types";
import { fetchWithCorsFallback } from "../utils/cors";

// NOAA SWPC endpoints — use 1-day range for richer charts
const SOLAR_WIND_MAG_URL =
  "https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json";
const SOLAR_WIND_PLASMA_URL =
  "https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json";
const KP_INDEX_URL =
  "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json";

// ── Solar Wind (mag + plasma) ───────────────────────────────────

/**
 * Solar wind mag endpoint returns array-of-arrays:
 *   [["time_tag","bx_gsm","by_gsm","bz_gsm","lon_gsm","lat_gsm","bt"], ...]
 * Values are strings.
 */
type MagRow = [string, string, string, string, string, string, string];

/**
 * Plasma endpoint returns array-of-arrays:
 *   [["time_tag","density","speed","temperature"], ...]
 */
type PlasmaRow = [string, string, string, string];

interface NoaaKpRecord {
  time_tag: string;
  kp_index: number;
}

export async function fetchSolarWind(
  signal?: AbortSignal,
): Promise<SolarWindSample[]> {
  // Fetch both mag and plasma in parallel for a richer dataset
  const [magResult, plasmaResult] = await Promise.all([
    fetchWithCorsFallback(SOLAR_WIND_MAG_URL, signal),
    fetchWithCorsFallback(SOLAR_WIND_PLASMA_URL, signal).catch(() => null),
  ]);

  const magRows = (await magResult.response.json()) as MagRow[];
  // Skip header row; downsample to ~120 points for chart performance
  const allMag = magRows.slice(1);
  const step = Math.max(1, Math.floor(allMag.length / 120));
  const magData = allMag.filter((_, i) => i % step === 0 || i === allMag.length - 1);

  // Build a plasma lookup map (time_tag → { speed, density })
  const plasmaMap = new Map<string, { speed: number; density: number }>();
  if (plasmaResult) {
    try {
      const plasmaRows = (await plasmaResult.response.json()) as PlasmaRow[];
      for (let i = 1; i < plasmaRows.length; i++) {
        const row = plasmaRows[i]!;
        const speed = parseFloat(row[2]);
        const density = parseFloat(row[1]);
        if (!isNaN(speed) && !isNaN(density)) {
          plasmaMap.set(row[0], { speed, density });
        }
      }
    } catch {
      // Plasma is optional — ignore parse errors
    }
  }

  return magData
    .filter((row) => row[6] !== null && row[6] !== "")
    .map((row) => {
      const plasma = plasmaMap.get(row[0]);
      return {
        timestamp: new Date(row[0] + "Z"),
        bx: parseFloat(row[1]) || 0,
        by: parseFloat(row[2]) || 0,
        bz: parseFloat(row[3]) || 0,
        bt: parseFloat(row[6]) || 0,
        speed: plasma?.speed ?? null,
        density: plasma?.density ?? null,
      };
    });
}

// ── Kp Index ────────────────────────────────────────────────────

export async function fetchKpIndex(
  signal?: AbortSignal,
): Promise<KpIndexSample[]> {
  const { response } = await fetchWithCorsFallback(KP_INDEX_URL, signal);
  if (!response.ok) throw new Error(`NOAA Kp: ${response.status}`);

  const records = (await response.json()) as NoaaKpRecord[];

  return records.slice(-60).map((r) => ({
    timestamp: new Date(r.time_tag),
    kpIndex: r.kp_index,
  }));
}
