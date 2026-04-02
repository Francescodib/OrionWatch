import { useCallback, useRef } from "react";
import { usePolling } from "../utils/polling";
import type { SpacecraftState, TelemetryConfig } from "../targets/types";

const MAX_HISTORY = 60;

interface SimulatedData {
  state: SpacecraftState;
  history: SpacecraftState[];
}

export function useSimulated(telemetry: TelemetryConfig | null) {
  const historyRef = useRef<SpacecraftState[]>([]);

  const fetchFn = useCallback(
    async (_signal: AbortSignal): Promise<SimulatedData> => {
      if (!telemetry?.simulated) throw new Error("No simulated config");

      const { orbitRadiusKm, periodHours } = telemetry.simulated;
      const now = new Date();
      const elapsed = now.getTime() / 1000;
      const angle = (2 * Math.PI * elapsed) / (periodHours * 3600);

      const x = orbitRadiusKm * Math.cos(angle);
      const y = orbitRadiusKm * Math.sin(angle);
      const z = orbitRadiusKm * 0.05 * Math.sin(angle * 3);

      const speed = (2 * Math.PI * orbitRadiusKm) / (periodHours * 3600);
      const vx = -speed * Math.sin(angle);
      const vy = speed * Math.cos(angle);
      const vz = speed * 0.05 * Math.cos(angle * 3);

      const distEarth = Math.sqrt(x * x + y * y + z * z);
      const moonX = 384400 * Math.cos((elapsed / (27.32 * 86400)) * 2 * Math.PI);
      const moonY = 384400 * Math.sin((elapsed / (27.32 * 86400)) * 2 * Math.PI);
      const distMoon = Math.sqrt(
        (x - moonX) ** 2 + (y - moonY) ** 2 + z * z,
      );

      const state: SpacecraftState = {
        timestamp: now,
        positionKm: [x, y, z],
        velocityKmS: [vx, vy, vz],
        distanceFromEarthKm: distEarth,
        distanceFromMoonKm: distMoon,
        speedKmS: speed,
      };

      const history = [...historyRef.current, state];
      if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
      }
      historyRef.current = history;

      return { state, history };
    },
    [telemetry?.simulated?.orbitRadiusKm, telemetry?.simulated?.periodHours],
  );

  const enabled = telemetry?.source === "simulated" && !!telemetry.simulated;

  return usePolling(fetchFn, 5_000, enabled);
}
