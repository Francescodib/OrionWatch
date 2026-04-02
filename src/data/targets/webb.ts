import type { MissionTarget } from "./types";

export const webb: MissionTarget = {
  id: "webb",
  label: "James Webb Space Telescope",
  active: true,

  spacecraft: {
    name: "JWST",
    crew: [],
    launchDate: "2021-12-25T12:20:00Z",
  },

  telemetry: {
    source: "horizons",
    horizons: {
      commandId: "-170",
      center: "500@399",
      stepSizeMinutes: 60,
    },
  },

  spaceWeather: { enabled: true },

  milestones: [
    {
      id: "launch",
      label: "Launch",
      timestamp: "2021-12-25T12:20:00Z",
      type: "launch",
      completed: true,
    },
    {
      id: "l2-arrival",
      label: "L2 Orbit Insertion",
      timestamp: "2022-01-24T19:00:00Z",
      type: "burn",
      completed: true,
    },
    {
      id: "first-light",
      label: "First Light",
      timestamp: "2022-07-12T00:00:00Z",
      type: "other",
      completed: true,
    },
  ],

  scene: {
    showMoon: false,
    trajectoryPoints: 100,
    compressedScale: false,
    cameraInitialPosition: [0, 50, 200],
  },

  imageQuery: "James Webb Space Telescope",
  blogRssUrl: "https://blogs.nasa.gov/webb/feed/",
};
