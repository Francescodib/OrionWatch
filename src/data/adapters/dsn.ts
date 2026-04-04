import { fetchWithCorsFallback } from "../utils/cors";

const DSN_URL = "https://eyes.nasa.gov/dsn/data/dsn.xml";

export interface DsnDish {
  name: string;           // e.g. "DSS24"
  station: string;        // "Goldstone" | "Canberra" | "Madrid"
  azimuth: number;
  elevation: number;
  activity: string;
  targets: DsnTarget[];
  signals: DsnSignal[];
  isActive: boolean;
}

export interface DsnTarget {
  name: string;           // spacecraft name e.g. "MRO"
  id: number;
  uplegRange: number;     // km
  downlegRange: number;   // km
  rtlt: number;           // round-trip light time in seconds
}

export interface DsnSignal {
  direction: "up" | "down";
  active: boolean;
  type: string;
  dataRate: number;
  band: string;
  power: number;
  spacecraft: string;
}

export interface DsnStation {
  name: string;           // e.g. "gdscc"
  friendlyName: string;   // e.g. "Goldstone"
  dishes: DsnDish[];
}

export interface DsnData {
  stations: DsnStation[];
  timestamp: Date;
}

export async function fetchDsnStatus(signal?: AbortSignal): Promise<DsnData> {
  const { response } = await fetchWithCorsFallback(DSN_URL, signal);
  const text = await response.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/xml");

  const stations: DsnStation[] = [];

  // DSN XML uses flat siblings: <station/>, <dish/>, <dish/>, <station/>, <dish/>...
  // Each dish belongs to the preceding station element.
  const children = [...doc.documentElement.children];
  let currentStation: DsnStation | null = null;

  for (const el of children) {
    if (el.tagName === "station") {
      currentStation = {
        name: el.getAttribute("name") ?? "",
        friendlyName: el.getAttribute("friendlyName") ?? el.getAttribute("name") ?? "",
        dishes: [],
      };
      stations.push(currentStation);
    } else if (el.tagName === "dish" && currentStation) {
      const targets: DsnTarget[] = [];
      const signals: DsnSignal[] = [];

      el.querySelectorAll("target").forEach((tEl) => {
        targets.push({
          name: tEl.getAttribute("name") ?? "",
          id: parseInt(tEl.getAttribute("id") ?? "0"),
          uplegRange: parseFloat(tEl.getAttribute("uplegRange") ?? "-1"),
          downlegRange: parseFloat(tEl.getAttribute("downlegRange") ?? "-1"),
          rtlt: parseFloat(tEl.getAttribute("rtlt") ?? "-1"),
        });
      });

      el.querySelectorAll("upSignal").forEach((sEl) => {
        signals.push({
          direction: "up",
          active: sEl.getAttribute("active") === "true",
          type: sEl.getAttribute("signalType") ?? "",
          dataRate: parseFloat(sEl.getAttribute("dataRate") ?? "0"),
          band: sEl.getAttribute("band") ?? "",
          power: parseFloat(sEl.getAttribute("power") ?? "0"),
          spacecraft: sEl.getAttribute("spacecraft") ?? "",
        });
      });

      el.querySelectorAll("downSignal").forEach((sEl) => {
        signals.push({
          direction: "down",
          active: sEl.getAttribute("active") === "true",
          type: sEl.getAttribute("signalType") ?? "",
          dataRate: parseFloat(sEl.getAttribute("dataRate") ?? "0"),
          band: sEl.getAttribute("band") ?? "",
          power: parseFloat(sEl.getAttribute("power") ?? "0"),
          spacecraft: sEl.getAttribute("spacecraft") ?? "",
        });
      });

      const hasActiveSignal = signals.some((s) => s.active);

      currentStation.dishes.push({
        name: el.getAttribute("name") ?? "",
        station: currentStation.friendlyName,
        azimuth: parseFloat(el.getAttribute("azimuthAngle") ?? "0"),
        elevation: parseFloat(el.getAttribute("elevationAngle") ?? "0"),
        activity: el.getAttribute("activity") ?? "",
        targets: targets.filter((t) => t.name !== "DSN"),
        signals,
        isActive: hasActiveSignal,
      });
    }
  }

  return { stations, timestamp: new Date() };
}
