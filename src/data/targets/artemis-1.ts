import type { MissionTarget } from "./types";

export const artemis1: MissionTarget = {
  id: "artemis-1",
  label: "Artemis I — Historical",
  active: false,

  spacecraft: {
    name: "Orion (Artemis I)",
    crew: [],
    launchDate: "2022-11-16T06:47:44Z",
    splashdownDate: "2022-12-11T17:40:00Z",
  },

  telemetry: {
    source: "horizons",
    horizons: {
      commandId: "-1023",
      center: "500@399",
      stepSizeMinutes: 60,
    },
  },

  spaceWeather: { enabled: true },

  milestones: [
    {
      id: "launch",
      label: "Launch",
      timestamp: "2022-11-16T06:47:44Z",
      type: "launch",
      completed: true,
    },
    {
      id: "lunar-flyby",
      label: "Lunar Flyby",
      timestamp: "2022-11-21T12:44:00Z",
      type: "flyby",
      completed: true,
    },
    {
      id: "dro-entry",
      label: "DRO Entry",
      timestamp: "2022-11-25T21:52:00Z",
      type: "burn",
      completed: true,
    },
    {
      id: "splashdown",
      label: "Splashdown",
      timestamp: "2022-12-11T17:40:00Z",
      type: "splashdown",
      completed: true,
    },
  ],

  scene: {
    showMoon: true,
    trajectoryPoints: 200,
    compressedScale: true,
    cameraInitialPosition: [0, 60, 140],
  },

  imageQuery: "Artemis I Orion",
  blogRssUrl: "https://blogs.nasa.gov/artemis/feed/",
};
