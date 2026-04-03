/**
 * Loads telemetry data from local static JSON files.
 *
 * Two files:
 * - /data/trajectory-full.json — complete mission trajectory from Horizons
 *   (generated once by cron/backfill-trajectory.php). Used for the 3D
 *   trajectory line, Mission Profile chart, and playback animation.
 *
 * - /data/telemetry-history.json — incremental AROW recordings
 *   (cron/record-telemetry.php every 60s). Higher resolution for the
 *   portion of the mission that has already elapsed.
 */

import type { SpacecraftState } from "../targets/types";

interface CompactRecord {
  t: number;
  p: [number, number, number];
  v: [number, number, number];
  de: number;
  dm: number;
  s: number;
}

function recordsToStates(records: CompactRecord[]): SpacecraftState[] {
  return records.map((r) => ({
    timestamp: new Date(r.t),
    positionKm: r.p,
    velocityKmS: r.v,
    distanceFromEarthKm: r.de,
    distanceFromMoonKm: r.dm,
    speedKmS: r.s,
  }));
}

/**
 * Load the full mission trajectory (past + future).
 * This is the primary data source for 3D trajectory and Mission Profile.
 */
export async function fetchFullTrajectory(
  signal?: AbortSignal,
): Promise<SpacecraftState[]> {
  const base = import.meta.env.BASE_URL || "/";
  const url = `${base}data/trajectory-full.json?_=${Math.floor(Date.now() / 3600000)}`;
  const resp = await fetch(url, { signal });
  if (!resp.ok) return [];
  const records = (await resp.json()) as CompactRecord[];
  return recordsToStates(records);
}

/**
 * Load the incremental AROW telemetry history (past only, high resolution).
 * Used to supplement the trajectory data with real mission control readings.
 */
export async function fetchTelemetryHistory(
  signal?: AbortSignal,
): Promise<SpacecraftState[]> {
  const base = import.meta.env.BASE_URL || "/";
  const url = `${base}data/telemetry-history.json?_=${Date.now()}`;
  const resp = await fetch(url, { signal });
  if (!resp.ok) return [];
  const records = (await resp.json()) as CompactRecord[];
  return recordsToStates(records);
}
