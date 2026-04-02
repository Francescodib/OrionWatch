import { useTelemetryStore } from "@/store/useTelemetryStore";
import { useTargetStore } from "@/store/useTargetStore";
import { Panel } from "@/components/ui/Panel";
import { PanelSkeleton } from "@/components/ui/PanelSkeleton";
import { PanelError } from "@/components/ui/PanelError";
import { PositionMetrics } from "./PositionMetrics";

export function TelemetryContainer() {
  const { activeTarget } = useTargetStore();
  const { state, history, loading, error } = useTelemetryStore();

  if (loading && !state) {
    return <PanelSkeleton lines={6} />;
  }

  if (error && !state) {
    return <PanelError message={error} />;
  }

  if (!state) return <PanelSkeleton />;

  return (
    <Panel
      title="Telemetry"
      status={error ? "warning" : "nominal"}
    >
      <PositionMetrics
        state={state}
        history={history}
        showMoonDistance={activeTarget.scene.showMoon}
        milestones={activeTarget.milestones}
        launchDate={activeTarget.spacecraft.launchDate}
        splashdownDate={activeTarget.spacecraft.splashdownDate}
      />
    </Panel>
  );
}
