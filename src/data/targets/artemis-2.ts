import type { MissionTarget, SpacecraftState } from "./types";
import { fetchArowState } from "@/data/adapters/arow";
import { fetchHorizonsState } from "@/data/adapters/horizons";

/**
 * Fetch Artemis II state: try NASA AROW first (CORS-native, live Mission
 * Control data), fall back to JPL Horizons via CORS proxy chain.
 */
async function fetchArtemis2State(): Promise<SpacecraftState> {
  try {
    return await fetchArowState();
  } catch {
    // AROW unavailable — fall back to Horizons
    const result = await fetchHorizonsState("-1024", "500@399");
    return result.state;
  }
}

export const artemis2: MissionTarget = {
  id: "artemis-2",
  label: "Artemis II — Orion",
  active: true,

  spacecraft: {
    name: "Orion (Integrity)",
    crew: [
      { name: "Reid Wiseman", role: "Commander", agency: "NASA" },
      { name: "Victor Glover", role: "Pilot", agency: "NASA" },
      { name: "Christina Koch", role: "Mission Specialist", agency: "NASA" },
      { name: "Jeremy Hansen", role: "Mission Specialist", agency: "CSA" },
    ],
    launchDate: "2026-04-01T22:35:12Z",
    splashdownDate: "2026-04-11T00:17:00Z",
  },

  telemetry: {
    source: "custom",
    custom: {
      fetchFn: fetchArtemis2State,
      intervalMs: 30_000, // 30s — AROW updates every ~60s
    },
    // Keep Horizons config for trajectory fetch (full mission path)
    horizons: {
      commandId: "-1024",
      center: "500@399",
      stepSizeMinutes: 1,
    },
  },

  spaceWeather: { enabled: true },

  milestones: [
    {
      id: "launch",
      label: "Launch",
      timestamp: "2026-04-01T22:35:12Z",
      type: "launch",
      completed: true,
    },
    {
      id: "icps-sep",
      label: "ICPS Separation",
      timestamp: "2026-04-02T01:59:30Z",
      type: "burn",
      completed: true,
    },
    {
      id: "tli",
      label: "Trans-Lunar Injection",
      timestamp: "2026-04-02T02:30:00Z",
      type: "burn",
      completed: false,
    },
    {
      id: "lunar-flyby",
      label: "Lunar Flyby",
      timestamp: "2026-04-06T23:06:00Z",
      type: "flyby",
      completed: false,
    },
    {
      id: "return-burn",
      label: "Return Powered Flyby",
      timestamp: "2026-04-07T00:00:00Z",
      type: "burn",
      completed: false,
    },
    {
      id: "splashdown",
      label: "Splashdown",
      timestamp: "2026-04-11T00:17:00Z",
      type: "splashdown",
      completed: false,
    },
  ],

  scene: {
    showMoon: true,
    trajectoryPoints: 200,
    compressedScale: true,
    cameraInitialPosition: [0, 60, 140],
  },

  imageQuery: "Artemis II",
  blogRssUrl: "https://blogs.nasa.gov/artemis/feed/",
};
