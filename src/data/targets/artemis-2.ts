import type { MissionTarget } from "./types";

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
    source: "horizons",
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
