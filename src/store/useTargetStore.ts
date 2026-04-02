import { create } from "zustand";
import type { MissionTarget } from "@/data/targets/types";
import {
  ALL_TARGETS,
  DEFAULT_TARGET_ID,
  FALLBACK_TARGET_ID,
  getTargetById,
} from "@/data/targets";
import { useTelemetryStore } from "./useTelemetryStore";

interface TargetStore {
  activeTarget: MissionTarget;
  setActiveTarget: (id: string) => void;
  fallbackToDemo: () => void;
}

export const useTargetStore = create<TargetStore>((set) => ({
  activeTarget:
    getTargetById(DEFAULT_TARGET_ID) ?? getTargetById(FALLBACK_TARGET_ID)!,

  setActiveTarget: (id: string) => {
    const target = getTargetById(id);
    if (target) {
      // Reset telemetry synchronously BEFORE changing target,
      // so remounted components never see stale data from the old target.
      useTelemetryStore.getState().reset();
      set({ activeTarget: target });
    }
  },

  fallbackToDemo: () => {
    const demo = getTargetById(FALLBACK_TARGET_ID);
    if (demo) {
      useTelemetryStore.getState().reset();
      set({ activeTarget: demo });
    }
  },
}));

export { ALL_TARGETS };
