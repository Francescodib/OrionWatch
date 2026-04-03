import { useEffect, useRef } from "react";
import { useTargetStore } from "@/store/useTargetStore";
import { useTelemetryStore } from "@/store/useTelemetryStore";
import { useDashboardStore } from "@/store/useDashboardStore";
import { fetchHorizonsState, fetchHorizonsTrajectory } from "@/data/adapters/horizons";
import { fetchFullTrajectory } from "@/data/adapters/telemetry-history";
import type { SpacecraftState } from "@/data/targets/types";

/**
 * Single polling instance for telemetry data.
 * Mount this ONCE at the top of the app.
 * All consumers read from useTelemetryStore.
 */
export function TelemetryProvider() {
  const { activeTarget, fallbackToDemo } = useTargetStore();
  const { setState, setError, setLoading, setTrajectory, setTrajectoryLoading, reset } = useTelemetryStore();
  const { showToast, setCorsStrategy } = useDashboardStore();
  const failCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const controllerRef = useRef<AbortController | undefined>(undefined);
  const trajectoryControllerRef = useRef<AbortController | undefined>(undefined);
  // Guard: prevents stale polls from writing data after target switch
  const targetIdRef = useRef(activeTarget.id);

  // ---- Real-time polling ----
  useEffect(() => {
    targetIdRef.current = activeTarget.id;
    reset();
    setLoading(true);
    failCountRef.current = 0;

    const telemetry = activeTarget.telemetry;
    const expectedTargetId = activeTarget.id;

    // For historical missions (inactive with splashdown in the past), use a fixed reference date
    const isHistorical = !activeTarget.active && activeTarget.spacecraft.splashdownDate &&
      new Date(activeTarget.spacecraft.splashdownDate).getTime() < Date.now();
    const historicalRef = isHistorical && activeTarget.spacecraft.splashdownDate
      ? new Date(new Date(activeTarget.spacecraft.splashdownDate).getTime() - 3600_000) // 1hr before splashdown
      : undefined;

    async function poll() {
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;

      try {
        // Bail out if the target changed while we were waiting in setTimeout
        if (targetIdRef.current !== expectedTargetId) return;

        if (telemetry.source === "horizons" && telemetry.horizons) {
          const { commandId, center } = telemetry.horizons;
          const result = await fetchHorizonsState(commandId, center, signal, historicalRef);
          if (targetIdRef.current !== expectedTargetId) return;
          setState(result.state, result.strategy);
          setCorsStrategy(result.strategy);
          failCountRef.current = 0;
        } else if (telemetry.source === "simulated" && telemetry.simulated) {
          const { orbitRadiusKm, periodHours } = telemetry.simulated;
          const now = new Date();
          const elapsed = now.getTime() / 1000;
          const angle = (2 * Math.PI * elapsed) / (periodHours * 3600);

          const x = orbitRadiusKm * Math.cos(angle);
          const y = orbitRadiusKm * Math.sin(angle);
          const z = orbitRadiusKm * 0.05 * Math.sin(angle * 3);

          const speed = (2 * Math.PI * orbitRadiusKm) / (periodHours * 3600);
          const distEarth = Math.sqrt(x * x + y * y + z * z);
          const moonAngle = (elapsed / (27.32 * 86400)) * 2 * Math.PI;
          const moonX = 384400 * Math.cos(moonAngle);
          const moonY = 384400 * Math.sin(moonAngle);
          const distMoon = Math.sqrt((x - moonX) ** 2 + (y - moonY) ** 2 + z * z);

          if (targetIdRef.current !== expectedTargetId) return;
          setState({
            timestamp: now,
            positionKm: [x, y, z],
            velocityKmS: [-speed * Math.sin(angle), speed * Math.cos(angle), speed * 0.05 * Math.cos(angle * 3)],
            distanceFromEarthKm: distEarth,
            distanceFromMoonKm: distMoon,
            speedKmS: speed,
          });
          failCountRef.current = 0;
        } else if (telemetry.source === "custom" && telemetry.custom) {
          const state = await telemetry.custom.fetchFn();
          if (targetIdRef.current !== expectedTargetId) return;
          setState(state);
          setCorsStrategy("direct");
          failCountRef.current = 0;
        }
      } catch (err) {
        if (signal.aborted) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        failCountRef.current += 1;

        if (failCountRef.current >= 3 && activeTarget.id !== "demo") {
          fallbackToDemo();
          showToast("Connection lost — switched to demo mode");
          return;
        }
      }

      // Historical missions: stop after first success (data won't change)
      if (isHistorical && failCountRef.current === 0) return;

      const interval = telemetry.source === "simulated"
        ? 5_000
        : telemetry.source === "custom"
          ? (telemetry.custom?.intervalMs ?? 10_000)
          : 60_000;

      intervalRef.current = setTimeout(poll, interval);
    }

    poll();

    return () => {
      controllerRef.current?.abort();
      clearTimeout(intervalRef.current);
    };
  }, [activeTarget.id]);

  // ---- Full trajectory fetch (once per target) ----
  // Priority: 1) Local trajectory-full.json (complete mission, no CORS)
  //           2) JPL Horizons (needs CORS proxy, may fail)
  //           3) Simulated (offline demo)
  useEffect(() => {
    const telemetry = activeTarget.telemetry;
    const { launchDate, splashdownDate } = activeTarget.spacecraft;

    if (splashdownDate) {
      setTrajectoryLoading(true);
      trajectoryControllerRef.current = new AbortController();
      const signal = trajectoryControllerRef.current.signal;

      // Load full mission trajectory from local static JSON
      fetchFullTrajectory(signal)
        .then((allStates) => {
          if (signal.aborted || targetIdRef.current !== activeTarget.id) return;

          if (allStates.length >= 10) {
            const now = new Date();
            const past = allStates.filter((s) => s.timestamp.getTime() <= now.getTime());
            const future = allStates.filter((s) => s.timestamp.getTime() > now.getTime());
            setTrajectory({ past, future });
            return;
          }

          // Local file missing/empty — fall back to Horizons
          if (!telemetry.horizons) return;
          return fetchHorizonsTrajectory(
            telemetry.horizons.commandId,
            telemetry.horizons.center,
            launchDate,
            splashdownDate,
            signal,
          ).then((data) => {
            if (!signal.aborted && targetIdRef.current === activeTarget.id) {
              setTrajectory(data);
            }
          });
        })
        .catch(() => {
          if (!signal.aborted && targetIdRef.current === activeTarget.id) {
            setTrajectoryLoading(false);
          }
        });
    } else if (telemetry.source === "simulated" && telemetry.simulated) {
      // Generate simulated trajectory analytically
      const { orbitRadiusKm, periodHours } = telemetry.simulated;
      const now = new Date();
      const past: SpacecraftState[] = [];
      const future: SpacecraftState[] = [];

      for (let i = -120; i <= 120; i++) {
        const t = new Date(now.getTime() + i * 60_000);
        const elapsed = t.getTime() / 1000;
        const angle = (2 * Math.PI * elapsed) / (periodHours * 3600);
        const x = orbitRadiusKm * Math.cos(angle);
        const y = orbitRadiusKm * Math.sin(angle);
        const z = orbitRadiusKm * 0.05 * Math.sin(angle * 3);
        const speed = (2 * Math.PI * orbitRadiusKm) / (periodHours * 3600);
        const distEarth = Math.sqrt(x * x + y * y + z * z);

        const s: SpacecraftState = {
          timestamp: t,
          positionKm: [x, y, z],
          velocityKmS: [-speed * Math.sin(angle), speed * Math.cos(angle), 0],
          distanceFromEarthKm: distEarth,
          distanceFromMoonKm: 0,
          speedKmS: speed,
        };

        if (t.getTime() <= now.getTime()) past.push(s);
        else future.push(s);
      }

      setTrajectory({ past, future });
    }

    return () => {
      trajectoryControllerRef.current?.abort();
    };
  }, [activeTarget.id]);

  return null;
}
