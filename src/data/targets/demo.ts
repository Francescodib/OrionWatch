import type { MissionTarget } from "./types";

export const demo: MissionTarget = {
  id: "demo",
  label: "Demo — Offline Mode",
  active: false,

  spacecraft: {
    name: "Demo Spacecraft",
    crew: [
      { name: "Demo Commander", role: "Commander", agency: "Demo" },
      { name: "Demo Pilot", role: "Pilot", agency: "Demo" },
    ],
    launchDate: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },

  telemetry: {
    source: "simulated",
    simulated: {
      orbitRadiusKm: 300_000,
      periodHours: 240,
    },
  },

  spaceWeather: { enabled: false },

  milestones: [
    {
      id: "launch",
      label: "Launch",
      timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      type: "launch",
      completed: true,
    },
    {
      id: "tli",
      label: "Trans-Lunar Injection",
      timestamp: new Date(Date.now() - 44 * 3600 * 1000).toISOString(),
      type: "burn",
      completed: true,
    },
    {
      id: "flyby",
      label: "Lunar Flyby",
      timestamp: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      type: "flyby",
      completed: false,
    },
    {
      id: "splashdown",
      label: "Splashdown",
      timestamp: new Date(Date.now() + 168 * 3600 * 1000).toISOString(),
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
};
