import { useEffect, useRef, useState, useCallback } from 'react';
import type { SpacecraftState } from '@/data/targets/types';
import type { TrajectoryData } from '@/data/adapters/horizons';
import { SceneCore } from './SceneCore';
import { usePlaybackStore } from '@/store/usePlaybackStore';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { ZoomIn, ZoomOut, RotateCcw, Locate, Crosshair } from 'lucide-react';

interface SceneLabel {
  x: number;
  y: number;
  text: string;
  color: string;
  visible: boolean;
}

export interface ThreeSceneProps {
  spacecraftState: SpacecraftState | null;
  history: SpacecraftState[];
  trajectory: TrajectoryData | null;
  showMoon: boolean;
  compressed: boolean;
  cameraPosition?: [number, number, number];
}

/**
 * Linearly interpolate a SpacecraftState at a given epoch from a sorted list of states.
 */
function interpolateState(
  states: SpacecraftState[],
  epochMs: number,
): SpacecraftState | null {
  if (states.length === 0) return null;
  if (states.length === 1) return states[0]!;

  // Clamp to range
  const first = states[0]!;
  const last = states[states.length - 1]!;
  if (epochMs <= first.timestamp.getTime()) return first;
  if (epochMs >= last.timestamp.getTime()) return last;

  // Binary search for the bracketing interval
  let lo = 0;
  let hi = states.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >>> 1;
    if (states[mid]!.timestamp.getTime() <= epochMs) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const a = states[lo]!;
  const b = states[hi]!;
  const tA = a.timestamp.getTime();
  const tB = b.timestamp.getTime();
  const frac = tB !== tA ? (epochMs - tA) / (tB - tA) : 0;

  const lerp = (x: number, y: number) => x + (y - x) * frac;

  return {
    timestamp: new Date(epochMs),
    positionKm: [
      lerp(a.positionKm[0], b.positionKm[0]),
      lerp(a.positionKm[1], b.positionKm[1]),
      lerp(a.positionKm[2], b.positionKm[2]),
    ],
    velocityKmS: [
      lerp(a.velocityKmS[0], b.velocityKmS[0]),
      lerp(a.velocityKmS[1], b.velocityKmS[1]),
      lerp(a.velocityKmS[2], b.velocityKmS[2]),
    ],
    distanceFromEarthKm: lerp(a.distanceFromEarthKm, b.distanceFromEarthKm),
    distanceFromMoonKm: lerp(a.distanceFromMoonKm, b.distanceFromMoonKm),
    speedKmS: lerp(a.speedKmS, b.speedKmS),
  };
}

function ThreeScene({
  spacecraftState,
  history,
  trajectory,
  showMoon,
  compressed,
  cameraPosition,
}: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneCoreRef = useRef<SceneCore | null>(null);
  const [labels, setLabels] = useState<SceneLabel[]>([]);

  // ---- Mount / unmount ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const core = new SceneCore(container);
    sceneCoreRef.current = core;

    return () => {
      core.dispose();
      sceneCoreRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Overlay labels (updated each frame via callback) ----
  useEffect(() => {
    const core = sceneCoreRef.current;
    if (!core) return;

    let frameCount = 0;
    const updateLabels = () => {
      // Update every 3 frames to reduce React renders
      if (++frameCount % 3 !== 0) return;

      const ringLabels = core.getDistanceRingLabels();
      const newLabels: SceneLabel[] = [];

      // Earth label
      const earth = core.projectToScreen(0, 8, 0);
      newLabels.push({ ...earth, text: "EARTH", color: "#556677" });

      // Ring labels
      for (const rl of ringLabels) {
        const proj = core.projectToScreen(rl.x, rl.y, rl.z);
        newLabels.push({ ...proj, text: rl.text, color: rl.color });
      }

      setLabels(newLabels);
    };

    core.registerFrameCallback(updateLabels);
    return () => core.unregisterFrameCallback(updateLabels);
  }, []);

  // ---- Camera position ----
  useEffect(() => {
    if (sceneCoreRef.current && cameraPosition) {
      sceneCoreRef.current.setCameraPosition(cameraPosition);
    }
  }, [cameraPosition]);

  // ---- Compressed scale ----
  useEffect(() => {
    sceneCoreRef.current?.setCompressed(compressed);
  }, [compressed]);

  // ---- Moon visibility ----
  useEffect(() => {
    sceneCoreRef.current?.setShowMoon(showMoon);
  }, [showMoon]);

  // ---- Spacecraft position (in live mode, interpolate from trajectory for visual consistency) ----
  useEffect(() => {
    const core = sceneCoreRef.current;
    if (!core) return;

    const { playbackTime } = usePlaybackStore.getState();
    // Only update from live data when in LIVE mode (not playback)
    if (playbackTime !== null) return; // playback loop handles this

    if (trajectory) {
      // Interpolate from trajectory for visual alignment with the path
      const allPoints = [...trajectory.past, ...trajectory.future];
      if (allPoints.length >= 2) {
        const interpolated = interpolateState(allPoints, Date.now());
        if (interpolated) {
          core.updateSpacecraft(interpolated);
          return;
        }
      }
    }

    // Fallback: use live AROW data directly
    if (spacecraftState) {
      core.updateSpacecraft(spacecraftState);
    }
  }, [spacecraftState, trajectory]);

  // ---- Full mission trajectory ----
  useEffect(() => {
    if (sceneCoreRef.current && trajectory) {
      sceneCoreRef.current.updateFullTrajectory(trajectory.past, trajectory.future);
    } else if (sceneCoreRef.current && history.length >= 5) {
      sceneCoreRef.current.updateTrajectory(history);
    }
  }, [trajectory, history]);

  // ---- Playback RAF loop ----
  const playbackRafRef = useRef<number | null>(null);
  const lastPlaybackFrameRef = useRef<number>(0);

  useEffect(() => {
    function playbackLoop(now: number) {
      const delta = lastPlaybackFrameRef.current ? now - lastPlaybackFrameRef.current : 16;
      lastPlaybackFrameRef.current = now;

      const store = usePlaybackStore.getState();
      if (store.isPlaying) {
        store.tick(delta);
      }

      const { playbackTime } = usePlaybackStore.getState();
      const core = sceneCoreRef.current;

      if (core) {
        // Use playback time or current time for interpolation
        const t = playbackTime ?? Date.now();
        const allPoints = trajectory
          ? [...trajectory.past, ...trajectory.future]
          : history;

        if (allPoints.length >= 2) {
          const interpolated = interpolateState(allPoints, t);
          if (interpolated) {
            core.updateSpacecraft(interpolated);
            // During playback, feed interpolated state to sidebar telemetry
            if (playbackTime !== null) {
              useTelemetryStore.getState().setState(interpolated);
            }
          }
        }

        // Update moon and sun
        const date = new Date(t);
        core.updateMoonTime(date);
        core.updateSunTime(date);
      }

      playbackRafRef.current = requestAnimationFrame(playbackLoop);
    }

    // Only start the loop — it checks isPlaying and playbackTime internally
    lastPlaybackFrameRef.current = 0;
    playbackRafRef.current = requestAnimationFrame(playbackLoop);

    return () => {
      if (playbackRafRef.current !== null) {
        cancelAnimationFrame(playbackRafRef.current);
        playbackRafRef.current = null;
      }
    };
  }, [trajectory, history]);

  // ---- Tracking state ----
  const [isTracking, setIsTracking] = useState(false);

  const handleToggleTracking = useCallback(() => {
    const core = sceneCoreRef.current;
    if (!core) return;
    const next = !core.isTracking();
    core.setTracking(next);
    setIsTracking(next);
  }, []);

  // ---- Zoom controls ----
  const handleZoomIn = useCallback(() => sceneCoreRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => sceneCoreRef.current?.zoomOut(), []);
  const handleReset = useCallback(() => {
    sceneCoreRef.current?.resetView(cameraPosition);
  }, [cameraPosition]);
  const handleLocateCraft = useCallback(() => {
    sceneCoreRef.current?.locateCraft();
  }, []);

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <div
        ref={containerRef}
        className="w-full h-full rounded overflow-hidden"
      />

      {/* CSS overlay labels projected from 3D */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
        {labels.map((label) =>
          label.visible ? (
            <span
              key={label.text}
              className="absolute text-[9px] font-mono uppercase tracking-wider px-1 rounded-sm bg-space-bg/40 whitespace-nowrap"
              style={{
                left: label.x,
                top: label.y,
                color: label.color,
                transform: "translate(-50%, -100%)",
              }}
            >
              {label.text}
            </span>
          ) : null,
        )}
      </div>

      {/* Zoom controls overlay */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
        <SceneButton onClick={handleZoomIn} label="Zoom in"><ZoomIn size={14} /></SceneButton>
        <SceneButton onClick={handleZoomOut} label="Zoom out"><ZoomOut size={14} /></SceneButton>
        <SceneButton onClick={handleReset} label="Reset view"><RotateCcw size={14} /></SceneButton>
      </div>

      {/* Craft controls */}
      <div className="absolute bottom-10 right-3 z-10 flex gap-1.5">
        <button
          onClick={handleToggleTracking}
          className={`px-3 py-1.5 backdrop-blur-sm border text-[10px] font-mono uppercase tracking-wider transition-colors rounded cursor-pointer flex items-center gap-1.5 ${
            isTracking
              ? "bg-amber/15 border-amber/50 text-amber shadow-[0_0_8px_rgba(255,107,53,0.2)]"
              : "bg-space-bg/90 border-space-border hover:border-amber/40 text-text-muted hover:text-amber"
          }`}
        >
          <Crosshair size={12} />
          {isTracking ? "Tracking" : "Track"}
        </button>
        <button
          onClick={handleLocateCraft}
          className="px-3 py-1.5 bg-space-bg/90 backdrop-blur-sm border border-cyan/40 hover:border-cyan/70 text-[10px] font-mono text-cyan uppercase tracking-wider hover:bg-cyan/10 transition-colors rounded cursor-pointer flex items-center gap-1.5 shadow-[0_0_8px_rgba(0,212,255,0.15)]"
        >
          <Locate size={12} />
          Locate
        </button>
      </div>

      {/* Orbit hint */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
        <span className="text-[9px] font-mono text-text-muted/40 tracking-wider uppercase">
          drag to orbit
        </span>
      </div>
    </div>
  );
}

function SceneButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-7 h-7 flex items-center justify-center bg-space-bg/70 backdrop-blur-sm border border-space-border hover:border-cyan/40 text-text-muted hover:text-cyan transition-colors rounded-sm cursor-pointer"
    >
      {children}
    </button>
  );
}

export default ThreeScene;
