import type { MissionTarget } from "./types";

export const voyager1: MissionTarget = {
  id: "voyager-1",
  label: "Voyager 1",
  active: true,

  spacecraft: {
    name: "Voyager 1",
    crew: [],
    launchDate: "1977-09-05T12:56:00Z",
  },

  telemetry: {
    source: "horizons",
    horizons: {
      commandId: "-31",
      center: "500@10",
      stepSizeMinutes: 60,
    },
  },

  spaceWeather: { enabled: false },

  milestones: [
    {
      id: "launch",
      label: "Launch",
      timestamp: "1977-09-05T12:56:00Z",
      type: "launch",
      completed: true,
    },
    {
      id: "jupiter-flyby",
      label: "Jupiter Flyby",
      timestamp: "1979-03-05T00:00:00Z",
      type: "flyby",
      completed: true,
    },
    {
      id: "saturn-flyby",
      label: "Saturn Flyby",
      timestamp: "1980-11-12T00:00:00Z",
      type: "flyby",
      completed: true,
    },
    {
      id: "interstellar",
      label: "Interstellar Space",
      timestamp: "2012-08-25T00:00:00Z",
      type: "other",
      completed: true,
    },
  ],

  scene: {
    showMoon: false,
    trajectoryPoints: 50,
    compressedScale: false,
    cameraInitialPosition: [0, 50, 150],
  },

  imageQuery: "Voyager 1",
};
