import { create } from "zustand";
import type { SpacecraftState } from "@/data/targets/types";
import type { CorsStrategy } from "@/data/utils/cors";
import type { TrajectoryData } from "@/data/adapters/horizons";

interface TelemetryStore {
  state: SpacecraftState | null;
  history: SpacecraftState[];
  loading: boolean;
  error: string | null;
  corsStrategy: CorsStrategy | null;
  /** Full mission trajectory split into past/future segments. */
  trajectory: TrajectoryData | null;
  trajectoryLoading: boolean;
  setState: (s: SpacecraftState, strategy?: CorsStrategy) => void;
  setError: (e: string) => void;
  setLoading: (l: boolean) => void;
  setTrajectory: (t: TrajectoryData) => void;
  setTrajectoryLoading: (l: boolean) => void;
  reset: () => void;
}

const MAX_HISTORY = 60;

export const useTelemetryStore = create<TelemetryStore>((set) => ({
  state: null,
  history: [],
  loading: true,
  error: null,
  corsStrategy: null,
  trajectory: null,
  trajectoryLoading: false,

  setState: (newState, strategy) =>
    set((prev) => {
      const history = [...prev.history, newState];
      if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
      }
      return {
        state: newState,
        history,
        loading: false,
        error: null,
        corsStrategy: strategy ?? prev.corsStrategy,
      };
    }),

  setError: (error) => set({ error, loading: false }),
  setLoading: (loading) => set({ loading }),
  setTrajectory: (trajectory) => set({ trajectory, trajectoryLoading: false }),
  setTrajectoryLoading: (trajectoryLoading) => set({ trajectoryLoading }),
  reset: () => set({ state: null, history: [], loading: true, error: null, trajectory: null, trajectoryLoading: false }),
}));
