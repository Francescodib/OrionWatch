import type { MissionTarget } from "./types";
import { artemis2 } from "./artemis-2";
import { artemis1 } from "./artemis-1";
import { voyager1 } from "./voyager-1";
import { webb } from "./webb";
import { iss } from "./iss";
import { demo } from "./demo";

export const ALL_TARGETS: MissionTarget[] = [
  artemis2,
  artemis1,
  webb,
  voyager1,
  iss,
  demo,
];

export const DEFAULT_TARGET_ID = "artemis-2";
export const FALLBACK_TARGET_ID = "demo";

export function getTargetById(id: string): MissionTarget | undefined {
  return ALL_TARGETS.find((t) => t.id === id);
}
