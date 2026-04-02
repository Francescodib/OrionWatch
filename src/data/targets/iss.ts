import type { MissionTarget, SpacecraftState } from "./types";
import { fetchWithCorsFallback } from "@/data/utils/cors";

const TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE";

async function fetchISSPosition(): Promise<SpacecraftState> {
  const [satModule, tleResult] = await Promise.all([
    import("satellite.js"),
    fetchWithCorsFallback(TLE_URL),
  ]);

  const { twoline2satrec, propagate } = satModule;
  const tleText = await tleResult.response.text();
  const lines = tleText.trim().split("\n");
  if (lines.length < 3) throw new Error("Invalid TLE data");

  const satrec = twoline2satrec(lines[1]!.trim(), lines[2]!.trim());
  const now = new Date();
  const result = propagate(satrec, now);

  if (
    typeof result.position === "boolean" ||
    typeof result.velocity === "boolean"
  ) {
    throw new Error("SGP4 propagation failed");
  }

  const pos = result.position;
  const vel = result.velocity;
  const distEarth = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);

  return {
    timestamp: now,
    positionKm: [pos.x, pos.y, pos.z],
    velocityKmS: [vel.x, vel.y, vel.z],
    distanceFromEarthKm: distEarth,
    distanceFromMoonKm: 384400 - distEarth,
    speedKmS: Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2),
  };
}

export const iss: MissionTarget = {
  id: "iss",
  label: "ISS — International Space Station",
  active: true,

  spacecraft: {
    name: "ISS",
    crew: [],
    launchDate: "1998-11-20T06:40:00Z",
  },

  telemetry: {
    source: "custom",
    custom: {
      fetchFn: fetchISSPosition,
      intervalMs: 10_000,
    },
  },

  spaceWeather: { enabled: true },

  milestones: [
    {
      id: "first-module",
      label: "Zarya Launch",
      timestamp: "1998-11-20T06:40:00Z",
      type: "launch",
      completed: true,
    },
    {
      id: "first-crew",
      label: "Expedition 1",
      timestamp: "2000-11-02T00:00:00Z",
      type: "other",
      completed: true,
    },
  ],

  scene: {
    showMoon: false,
    trajectoryPoints: 100,
    compressedScale: true,
    cameraInitialPosition: [0, 10, 15],
  },

  imageQuery: "International Space Station",
};
