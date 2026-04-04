/**
 * Real Moon positions from JPL Horizons (body 301, geocentric).
 * Pre-computed for the Artemis II mission period at 30-min intervals.
 */

interface MoonRecord {
  t: number;           // epoch ms
  p: [number, number, number]; // position km (Ecliptic J2000)
}

let cachedData: MoonRecord[] | null = null;

export async function fetchMoonTrajectory(
  signal?: AbortSignal,
): Promise<MoonRecord[]> {
  if (cachedData) return cachedData;

  const base = import.meta.env.BASE_URL || "/";
  const url = `${base}data/moon-trajectory.json?_=${Math.floor(Date.now() / 3600000)}`;
  const resp = await fetch(url, { signal });
  if (!resp.ok) return [];
  cachedData = (await resp.json()) as MoonRecord[];
  return cachedData;
}

/**
 * Interpolate Moon position at a given epoch from the trajectory data.
 */
export function interpolateMoonPosition(
  data: MoonRecord[],
  epochMs: number,
): [number, number, number] | null {
  if (data.length < 2) return null;

  const first = data[0]!;
  const last = data[data.length - 1]!;
  if (epochMs <= first.t) return first.p;
  if (epochMs >= last.t) return last.p;

  // Binary search
  let lo = 0;
  let hi = data.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >>> 1;
    if (data[mid]!.t <= epochMs) lo = mid;
    else hi = mid;
  }

  const a = data[lo]!;
  const b = data[hi]!;
  const frac = (epochMs - a.t) / (b.t - a.t);

  return [
    a.p[0] + (b.p[0] - a.p[0]) * frac,
    a.p[1] + (b.p[1] - a.p[1]) * frac,
    a.p[2] + (b.p[2] - a.p[2]) * frac,
  ];
}
