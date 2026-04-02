import type { SpacecraftState } from "../targets/types";
import { fetchWithCorsFallback, type CorsStrategy } from "../utils/cors";

const HORIZONS_API = "https://ssd.jpl.nasa.gov/api/horizons.api";

function q(s: string): string {
  return encodeURIComponent(`'${s}'`);
}

function buildHorizonsUrl(commandId: string, center: string, referenceDate?: Date): string {
  const ref = referenceDate ?? new Date();
  const start = new Date(ref.getTime() - 5 * 60 * 1000);
  const end = new Date(ref.getTime() + 5 * 60 * 1000);

  const fmt = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");

  // Horizons requires single-quoted values, properly URL-encoded
  const params = [
    `format=json`,
    `COMMAND=${q(commandId)}`,
    `EPHEM_TYPE=VECTORS`,
    `CENTER=${q(center)}`,
    `START_TIME=${q(fmt(start))}`,
    `STOP_TIME=${q(fmt(end))}`,
    `STEP_SIZE=${q("1 min")}`,
    `OUT_UNITS=${q("KM-S")}`,
    `VEC_TABLE=${q("2")}`,
    `VEC_LABELS=${q("YES")}`,
    `CSV_FORMAT=${q("NO")}`,
  ].join("&");

  return `${HORIZONS_API}?${params}`;
}

function approxMoonPositionKm(date: Date): [number, number, number] {
  const epoch = new Date("2000-01-06T00:00:00Z").getTime();
  const elapsed = (date.getTime() - epoch) / 1000;
  const period = 27.321661 * 86400;
  const angle = (2 * Math.PI * elapsed) / period;
  const r = 384400;
  return [r * Math.cos(angle), r * Math.sin(angle), 0];
}

function parseSoeBlock(result: string): SpacecraftState | null {
  const soeIdx = result.indexOf("$$SOE");
  const eoeIdx = result.indexOf("$$EOE");
  if (soeIdx === -1 || eoeIdx === -1) return null;

  const block = result.slice(soeIdx + 5, eoeIdx).trim();
  const lines = block.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  // Find the LAST set of vector data (closest to current time)
  let posLine: string | undefined;
  let velLine: string | undefined;

  for (let i = lines.length - 1; i >= 0; i--) {
    if (!velLine && /VX\s*=/.test(lines[i]!)) velLine = lines[i];
    if (!posLine && /X\s*=/.test(lines[i]!) && !/VX/.test(lines[i]!)) posLine = lines[i];
    if (posLine && velLine) break;
  }

  if (!posLine || !velLine) return null;

  const posMatch = posLine.match(
    /X\s*=\s*([-+\d.Ee]+)\s+Y\s*=\s*([-+\d.Ee]+)\s+Z\s*=\s*([-+\d.Ee]+)/i,
  );
  const velMatch = velLine.match(
    /VX\s*=\s*([-+\d.Ee]+)\s+VY\s*=\s*([-+\d.Ee]+)\s+VZ\s*=\s*([-+\d.Ee]+)/i,
  );
  if (!posMatch || !velMatch) return null;

  const x = parseFloat(posMatch[1]!);
  const y = parseFloat(posMatch[2]!);
  const z = parseFloat(posMatch[3]!);
  const vx = parseFloat(velMatch[1]!);
  const vy = parseFloat(velMatch[2]!);
  const vz = parseFloat(velMatch[3]!);

  const now = new Date();
  const posKm: [number, number, number] = [x, y, z];
  const velKmS: [number, number, number] = [vx, vy, vz];

  const distEarth = Math.sqrt(x * x + y * y + z * z);
  const moonPos = approxMoonPositionKm(now);
  const dx = x - moonPos[0];
  const dy = y - moonPos[1];
  const dz = z - moonPos[2];
  const distMoon = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

  return {
    timestamp: now,
    positionKm: posKm,
    velocityKmS: velKmS,
    distanceFromEarthKm: distEarth,
    distanceFromMoonKm: distMoon,
    speedKmS: speed,
  };
}

/**
 * Parse ALL state vectors from the $$SOE block (not just the last one).
 */
function parseAllSoeStates(result: string): SpacecraftState[] {
  const soeIdx = result.indexOf("$$SOE");
  const eoeIdx = result.indexOf("$$EOE");
  if (soeIdx === -1 || eoeIdx === -1) return [];

  const block = result.slice(soeIdx + 5, eoeIdx).trim();
  const lines = block.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  const states: SpacecraftState[] = [];
  let currentTimestamp: Date | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Timestamp line: "2461133.000000000 = A.D. 2026-Apr-02 12:00:00.0000 TDB"
    const tsMatch = line.match(/A\.D\.\s+(\d{4})-([A-Za-z]+)-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (tsMatch) {
      const months: Record<string, string> = {
        Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
        Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
      };
      const mo = months[tsMatch[2]!] ?? "01";
      currentTimestamp = new Date(`${tsMatch[1]}-${mo}-${tsMatch[3]}T${tsMatch[4]}:${tsMatch[5]}:${tsMatch[6]}Z`);
      continue;
    }

    // Position line: " X = ... Y = ... Z = ..."
    const posMatch = line.match(/X\s*=\s*([-+\d.Ee]+)\s+Y\s*=\s*([-+\d.Ee]+)\s+Z\s*=\s*([-+\d.Ee]+)/i);
    if (posMatch && !/VX/.test(line) && currentTimestamp) {
      const x = parseFloat(posMatch[1]!);
      const y = parseFloat(posMatch[2]!);
      const z = parseFloat(posMatch[3]!);

      // Next line should be velocity
      const nextLine = lines[i + 1];
      if (!nextLine) continue;
      const velMatch = nextLine.match(/VX\s*=\s*([-+\d.Ee]+)\s+VY\s*=\s*([-+\d.Ee]+)\s+VZ\s*=\s*([-+\d.Ee]+)/i);
      if (!velMatch) continue;

      const vx = parseFloat(velMatch[1]!);
      const vy = parseFloat(velMatch[2]!);
      const vz = parseFloat(velMatch[3]!);

      const distEarth = Math.sqrt(x * x + y * y + z * z);
      const moonPos = approxMoonPositionKm(currentTimestamp);
      const distMoon = Math.sqrt((x - moonPos[0]) ** 2 + (y - moonPos[1]) ** 2 + (z - moonPos[2]) ** 2);
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

      states.push({
        timestamp: currentTimestamp,
        positionKm: [x, y, z],
        velocityKmS: [vx, vy, vz],
        distanceFromEarthKm: distEarth,
        distanceFromMoonKm: distMoon,
        speedKmS: speed,
      });

      i++; // skip velocity line
    }
  }

  return states;
}

export interface TrajectoryData {
  past: SpacecraftState[];
  future: SpacecraftState[];
}

/**
 * Build a Horizons URL for a custom time range.
 */
function buildTrajectoryUrl(
  commandId: string,
  center: string,
  start: Date,
  end: Date,
  stepMinutes: number,
): string {
  const fmt = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");

  const params = [
    `format=json`,
    `COMMAND=${q(commandId)}`,
    `EPHEM_TYPE=VECTORS`,
    `CENTER=${q(center)}`,
    `START_TIME=${q(fmt(start))}`,
    `STOP_TIME=${q(fmt(end))}`,
    `STEP_SIZE=${q(`${stepMinutes} min`)}`,
    `OUT_UNITS=${q("KM-S")}`,
    `VEC_TABLE=${q("2")}`,
    `VEC_LABELS=${q("YES")}`,
    `CSV_FORMAT=${q("NO")}`,
  ].join("&");

  return `${HORIZONS_API}?${params}`;
}

function parseEphemerisDate(match: RegExpMatchArray): Date {
  const months: Record<string, string> = {
    JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
    JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
  };
  const mo = months[match[2]!.toUpperCase()] ?? "01";
  return new Date(`${match[1]}-${mo}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`);
}

/**
 * Fetch Horizons data for a time range, auto-adjusting "No ephemeris"
 * boundaries (up to 3 attempts).
 */
async function fetchHorizonsRange(
  commandId: string,
  center: string,
  start: Date,
  end: Date,
  stepMinutes: number,
  signal?: AbortSignal,
): Promise<SpacecraftState[]> {
  let currentStart = start;
  let currentEnd = end;

  for (let attempt = 0; attempt < 3; attempt++) {
    const url = buildTrajectoryUrl(commandId, center, currentStart, currentEnd, stepMinutes);
    const { response } = await fetchWithCorsFallback(url, signal);

    let json: { result?: string };
    try {
      json = (await response.json()) as { result?: string };
    } catch {
      throw new Error("Horizons trajectory response is not valid JSON");
    }

    if (!json.result) throw new Error("Horizons returned no result field");

    const priorMatch = json.result.match(/No ephemeris.*prior to.*?(\d{4})-([A-Z]{3})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/i);
    const afterMatch = json.result.match(/No ephemeris.*after.*?(\d{4})-([A-Z]{3})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/i);

    if (!priorMatch && !afterMatch) {
      // No boundary errors — parse whatever we got
      return parseAllSoeStates(json.result);
    }

    // Adjust boundaries
    if (priorMatch) {
      currentStart = new Date(parseEphemerisDate(priorMatch).getTime() + 2 * 60_000);
    }
    if (afterMatch) {
      currentEnd = new Date(parseEphemerisDate(afterMatch).getTime() - 2 * 60_000);
    }

    if (currentStart >= currentEnd) throw new Error("No valid ephemeris range");
    // Horizons SPK boundary adjustment — retry with tighter range
  }

  throw new Error("Could not find valid ephemeris range after 3 attempts");
}

/**
 * Fetch the full mission trajectory (launch → splashdown) in a single request.
 * Returns past and future segments split at the current time.
 */
export async function fetchHorizonsTrajectory(
  commandId: string,
  center: string,
  launchDate: string,
  endDate: string,
  signal?: AbortSignal,
): Promise<TrajectoryData> {
  const start = new Date(launchDate);
  const end = new Date(endDate);
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 3600);
  const stepMinutes = Math.max(15, Math.round((durationHours * 60) / 480));

  const allStates = await fetchHorizonsRange(commandId, center, start, end, stepMinutes, signal);
  if (allStates.length === 0) throw new Error("No trajectory data from Horizons");

  const now = new Date();
  const past = allStates.filter((s) => s.timestamp.getTime() <= now.getTime());
  const future = allStates.filter((s) => s.timestamp.getTime() > now.getTime());

  return { past, future };
}

export interface HorizonsResult {
  state: SpacecraftState;
  strategy: CorsStrategy;
}

export async function fetchHorizonsState(
  commandId: string,
  center: string,
  signal?: AbortSignal,
  referenceDate?: Date,
): Promise<HorizonsResult> {
  const url = buildHorizonsUrl(commandId, center, referenceDate);
  const { response, strategy } = await fetchWithCorsFallback(url, signal);

  let json: { result?: string };
  try {
    json = (await response.json()) as { result?: string };
  } catch {
    throw new Error("Horizons response is not valid JSON (proxy may be returning HTML)");
  }

  if (!json.result) {
    throw new Error("Horizons returned no result field");
  }

  // Check for Horizons-level errors in the result text
  if (json.result.includes("No ephemeris") || json.result.includes("Cannot find")) {
    // Extract the error line
    const errLine = json.result.split("\n").find((l) =>
      l.includes("No ephemeris") || l.includes("Cannot find") || l.includes("!$$SOF")
    );
    throw new Error(`Horizons error: ${errLine ?? "Target not available for this time range"}`);
  }

  const state = parseSoeBlock(json.result);
  if (!state) {
    // Try to find what Horizons actually returned for debugging
    const preview = json.result.slice(0, 200).replace(/\n/g, " ");
    throw new Error(`Cannot parse Horizons data. Response preview: ${preview}`);
  }

  return { state, strategy };
}
