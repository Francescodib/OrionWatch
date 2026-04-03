import { useEffect, useRef, useState, useCallback } from 'react';
import type { SpacecraftState } from '@/data/targets/types';
import type { TrajectoryData } from '@/data/adapters/horizons';
import { SceneCore } from './SceneCore';
import { ZoomIn, ZoomOut, RotateCcw, Locate } from 'lucide-react';

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

  // ---- Spacecraft position ----
  useEffect(() => {
    if (sceneCoreRef.current && spacecraftState) {
      sceneCoreRef.current.updateSpacecraft(spacecraftState);
    }
  }, [spacecraftState]);

  // ---- Full mission trajectory ----
  useEffect(() => {
    if (sceneCoreRef.current && trajectory) {
      sceneCoreRef.current.updateFullTrajectory(trajectory.past, trajectory.future);
    } else if (sceneCoreRef.current && history.length >= 5) {
      sceneCoreRef.current.updateTrajectory(history);
    }
  }, [trajectory, history]);

  // ---- Zoom controls ----
  const handleZoomIn = useCallback(() => sceneCoreRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => sceneCoreRef.current?.zoomOut(), []);
  const handleReset = useCallback(() => {
    sceneCoreRef.current?.resetView(cameraPosition);
  }, [cameraPosition]);

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

      {/* Locate craft button */}
      <button
        onClick={handleReset}
        className="absolute bottom-3 right-3 z-10 px-2.5 py-1 bg-space-bg/80 backdrop-blur-sm border border-cyan/30 hover:border-cyan/60 text-[9px] font-mono text-cyan uppercase tracking-wider hover:bg-cyan/10 transition-colors rounded-sm cursor-pointer flex items-center gap-1"
      >
        <Locate size={10} />
        Locate Craft
      </button>

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
