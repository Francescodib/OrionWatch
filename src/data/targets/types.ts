export interface CrewMember {
  name: string;
  role: string;
  agency: string;
}

export interface Milestone {
  id: string;
  label: string;
  timestamp: string;
  type: "launch" | "burn" | "flyby" | "splashdown" | "other";
  completed: boolean;
}

export interface SceneConfig {
  showMoon: boolean;
  trajectoryPoints: number;
  compressedScale: boolean;
  cameraInitialPosition: [number, number, number];
}

export interface SpaceWeatherConfig {
  enabled: boolean;
}

export interface TelemetryConfig {
  source: "horizons" | "simulated" | "custom";

  horizons?: {
    commandId: string;
    center: string;
    stepSizeMinutes: number;
  };

  simulated?: {
    orbitRadiusKm: number;
    periodHours: number;
  };

  custom?: {
    fetchFn: () => Promise<SpacecraftState>;
    intervalMs: number;
  };
}

export interface MissionTarget {
  id: string;
  label: string;
  active: boolean;

  spacecraft: {
    name: string;
    crew: CrewMember[];
    launchDate: string;
    splashdownDate?: string;
  };

  telemetry: TelemetryConfig;
  spaceWeather: SpaceWeatherConfig;
  milestones: Milestone[];
  scene: SceneConfig;

  /** NASA Images API search query (e.g. "JWST", "Artemis II"). Empty = no images panel. */
  imageQuery?: string;
  /** RSS feed URL for the mission blog. Omit = no blog panel. */
  blogRssUrl?: string;
}

export interface SpacecraftState {
  timestamp: Date;
  positionKm: [number, number, number];
  velocityKmS: [number, number, number];
  distanceFromEarthKm: number;
  distanceFromMoonKm: number;
  speedKmS: number;
}

export interface SolarWindSample {
  timestamp: Date;
  bx: number;
  by: number;
  bz: number;
  bt: number;
  speed: number | null;
  density: number | null;
}

export interface KpIndexSample {
  timestamp: Date;
  kpIndex: number;
}

export interface NasaImage {
  nasaId: string;
  title: string;
  description: string;
  dateCreated: string;
  thumbUrl: string;
  fullUrl: string;
}

export interface BlogPost {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail: string | null;
}
