/**
 * Telemetry Recorder — persists spacecraft state to localStorage
 * during the live mission. After the mission ends, this data can
 * be played back chronologically.
 *
 * Storage format: array of { t: epoch_ms, p: [x,y,z], v: [vx,vy,vz] }
 * compressed to minimize storage footprint.
 *
 * Max storage: ~5MB (localStorage limit). At 1 record per 30s for 10
 * days = ~28,800 records × ~80 bytes = ~2.3MB — fits comfortably.
 */

import type { SpacecraftState } from "../targets/types";

const STORAGE_KEY = "orionwatch_telemetry_log";
const MAX_RECORDS = 30_000;

interface CompactRecord {
  t: number;          // epoch ms
  p: [number, number, number]; // position km
  v: [number, number, number]; // velocity km/s
  de: number;         // distance from Earth km
  dm: number;         // distance from Moon km
}

export function recordState(state: SpacecraftState): void {
  try {
    const record: CompactRecord = {
      t: state.timestamp.getTime(),
      p: state.positionKm,
      v: state.velocityKmS,
      de: state.distanceFromEarthKm,
      dm: state.distanceFromMoonKm,
    };

    const raw = localStorage.getItem(STORAGE_KEY);
    const records: CompactRecord[] = raw ? JSON.parse(raw) : [];

    // Deduplicate — skip if last record is within 20s
    const last = records[records.length - 1];
    if (last && Math.abs(record.t - last.t) < 20_000) return;

    records.push(record);

    // Trim oldest if over limit
    if (records.length > MAX_RECORDS) {
      records.splice(0, records.length - MAX_RECORDS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

export function getRecordedStates(): SpacecraftState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const records: CompactRecord[] = JSON.parse(raw);
    return records.map((r) => ({
      timestamp: new Date(r.t),
      positionKm: r.p,
      velocityKmS: r.v,
      distanceFromEarthKm: r.de,
      distanceFromMoonKm: r.dm,
      speedKmS: Math.sqrt(r.v[0] ** 2 + r.v[1] ** 2 + r.v[2] ** 2),
    }));
  } catch {
    return [];
  }
}

export function getRecordCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    return JSON.parse(raw).length;
  } catch {
    return 0;
  }
}

export function clearRecordedStates(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}
