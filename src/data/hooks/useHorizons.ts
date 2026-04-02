import { useCallback, useRef } from "react";
import { usePolling } from "../utils/polling";
import { fetchHorizonsState } from "../adapters/horizons";
import type { SpacecraftState, TelemetryConfig } from "../targets/types";
import type { CorsStrategy } from "../utils/cors";

const MAX_HISTORY = 60;

interface HorizonsData {
  state: SpacecraftState;
  history: SpacecraftState[];
  corsStrategy: CorsStrategy;
}

export function useHorizons(telemetry: TelemetryConfig | null) {
  const historyRef = useRef<SpacecraftState[]>([]);
  const strategyRef = useRef<CorsStrategy>("direct");

  const fetchFn = useCallback(
    async (signal: AbortSignal): Promise<HorizonsData> => {
      if (!telemetry?.horizons) {
        throw new Error("No Horizons config");
      }

      const { commandId, center } = telemetry.horizons;
      const result = await fetchHorizonsState(commandId, center, signal);

      strategyRef.current = result.strategy;

      const history = [...historyRef.current, result.state];
      if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
      }
      historyRef.current = history;

      return {
        state: result.state,
        history,
        corsStrategy: result.strategy,
      };
    },
    [telemetry?.horizons?.commandId, telemetry?.horizons?.center],
  );

  const enabled = telemetry?.source === "horizons" && !!telemetry.horizons;
  const pollInterval = telemetry?.horizons?.stepSizeMinutes
    ? telemetry.horizons.stepSizeMinutes * 60 * 1000
    : 60_000;

  return usePolling(fetchFn, pollInterval, enabled);
}
