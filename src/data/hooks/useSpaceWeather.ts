import { useCallback } from "react";
import { usePolling } from "../utils/polling";
import { fetchSolarWind, fetchKpIndex } from "../adapters/noaa";
import { fetchSolarFlares, type SolarFlare } from "../adapters/solar-flares";
import type { SolarWindSample, KpIndexSample } from "../targets/types";

export interface SpaceWeatherData {
  solarWind: SolarWindSample[];
  kpIndex: KpIndexSample[];
  flares: SolarFlare[];
}

export function useSpaceWeather(enabled: boolean = true) {
  const fetchFn = useCallback(
    async (signal: AbortSignal): Promise<SpaceWeatherData> => {
      const [solarWind, kpIndex, flares] = await Promise.all([
        fetchSolarWind(signal),
        fetchKpIndex(signal),
        fetchSolarFlares(signal).catch(() => [] as SolarFlare[]), // flares optional
      ]);
      return { solarWind, kpIndex, flares };
    },
    [],
  );

  return usePolling(fetchFn, 60_000, enabled);
}
