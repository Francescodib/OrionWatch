/**
 * NASA AROW (Artemis Real-time Orbit Website) data adapter.
 *
 * Fetches live telemetry from a Google Cloud Storage bucket that NASA
 * Mission Control updates every ~60 seconds during active missions.
 * GCS supports CORS natively — no proxy needed.
 *
 * Data format: ECI J2000 geocentric coordinates in FEET.
 * Parameters:
 *   P2003/P2004/P2005 = X/Y/Z position (feet)
 *   P2009/P2010/P2011 = VX/VY/VZ velocity (feet/second)
 */

import type { SpacecraftState } from "../targets/types";

const GCS_API = "https://storage.googleapis.com/storage/v1/b/p-2-cen1/o";
const GCS_DOWNLOAD = "https://storage.googleapis.com/download/storage/v1/b/p-2-cen1/o";

/** AROW mission prefix for Artemis II. */
const AROW_PREFIX = "October/1/October";

const FT_TO_KM = 0.0003048;
const FTS_TO_KMS = 0.0003048;

interface ArowParameter {
  Number: string;
  Value: string;
  Time: string;
  Status: string;
}

interface ArowFile {
  [key: string]: ArowParameter | { Date: string; Activity: string; Type: number };
}

function parseArowTime(timeStr: string): Date {
  // Format: "2026:093:10:05:51.027" → year:dayOfYear:HH:MM:SS.ms
  const [year, doy, hours, minutes, secMs] = timeStr.split(":");
  const [sec, ms] = (secMs ?? "0").split(".");

  const date = new Date(Date.UTC(parseInt(year!), 0, 1));
  date.setUTCDate(parseInt(doy!));
  date.setUTCHours(parseInt(hours!), parseInt(minutes!), parseInt(sec!), parseInt((ms ?? "0").slice(0, 3)));
  return date;
}

function approxMoonPositionKm(date: Date): [number, number, number] {
  const epoch = new Date("2000-01-06T00:00:00Z").getTime();
  const elapsed = (date.getTime() - epoch) / 1000;
  const period = 27.321661 * 86400;
  const angle = (2 * Math.PI * elapsed) / period;
  const r = 384400;
  return [r * Math.cos(angle), r * Math.sin(angle), 0];
}

function getParam(data: ArowFile, num: string): number {
  const key = `Parameter_${num}`;
  const param = data[key] as ArowParameter | undefined;
  if (!param || param.Status !== "Good") return NaN;
  return parseFloat(param.Value);
}

export async function fetchArowState(signal?: AbortSignal): Promise<SpacecraftState> {
  // Step 1: List files to get the latest one
  const listUrl = `${GCS_API}?prefix=${encodeURIComponent(AROW_PREFIX)}&maxResults=1`;
  const listResp = await fetch(listUrl, { signal });
  if (!listResp.ok) throw new Error(`AROW list failed: ${listResp.status}`);

  const listing = (await listResp.json()) as { items?: { name: string }[] };
  if (!listing.items || listing.items.length === 0) {
    throw new Error("No AROW data files found");
  }

  const fileName = listing.items[0]!.name;

  // Step 2: Download the file content
  const downloadUrl = `${GCS_DOWNLOAD}/${encodeURIComponent(fileName)}?alt=media`;
  const dataResp = await fetch(downloadUrl, { signal });
  if (!dataResp.ok) throw new Error(`AROW download failed: ${dataResp.status}`);

  const data = (await dataResp.json()) as ArowFile;

  // Step 3: Extract position (feet → km) and velocity (ft/s → km/s)
  const xFt = getParam(data, "2003");
  const yFt = getParam(data, "2004");
  const zFt = getParam(data, "2005");
  const vxFts = getParam(data, "2009");
  const vyFts = getParam(data, "2010");
  const vzFts = getParam(data, "2011");

  if ([xFt, yFt, zFt, vxFts, vyFts, vzFts].some(isNaN)) {
    throw new Error("AROW data has invalid parameters");
  }

  const x = xFt * FT_TO_KM;
  const y = yFt * FT_TO_KM;
  const z = zFt * FT_TO_KM;
  const vx = vxFts * FTS_TO_KMS;
  const vy = vyFts * FTS_TO_KMS;
  const vz = vzFts * FTS_TO_KMS;

  // Step 4: Compute derived values
  const distEarth = Math.sqrt(x * x + y * y + z * z);
  const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

  // Parse timestamp from the position parameter
  const timeParam = data["Parameter_2003"] as ArowParameter;
  const timestamp = parseArowTime(timeParam.Time);

  const moonPos = approxMoonPositionKm(timestamp);
  const distMoon = Math.sqrt(
    (x - moonPos[0]) ** 2 + (y - moonPos[1]) ** 2 + (z - moonPos[2]) ** 2,
  );

  return {
    timestamp,
    positionKm: [x, y, z],
    velocityKmS: [vx, vy, vz],
    distanceFromEarthKm: distEarth,
    distanceFromMoonKm: distMoon,
    speedKmS: speed,
  };
}
