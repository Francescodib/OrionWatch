import { Suspense } from "react";
import { Globe } from "lucide-react";
import { useTelemetryStore } from "@/store/useTelemetryStore";
import { useTargetStore } from "@/store/useTargetStore";
import { Panel } from "@/components/ui/Panel";
import { ThreeScene } from "@/components/lazy";

export function SceneContainer() {
  const { activeTarget } = useTargetStore();
  const { state, history, trajectory } = useTelemetryStore();

  return (
    <Panel title="3D View" icon={<Globe size={14} />} status={state ? "nominal" : "idle"} flush className="h-full">
      <Suspense
        fallback={
          <div className="w-full h-full min-h-[200px] bg-space-surface flex items-center justify-center">
            <span className="text-text-muted text-xs font-mono motion-safe:animate-[pulse-glow_2s_ease-in-out_infinite]">
              Initializing scene...
            </span>
          </div>
        }
      >
        <div className="h-full">
          <ThreeScene
            spacecraftState={state}
            history={history}
            trajectory={trajectory}
            showMoon={activeTarget.scene.showMoon}
            compressed={activeTarget.scene.compressedScale}
            cameraPosition={activeTarget.scene.cameraInitialPosition}
          />
        </div>
      </Suspense>
    </Panel>
  );
}
