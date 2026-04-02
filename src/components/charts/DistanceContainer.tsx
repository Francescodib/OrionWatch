import { Suspense } from "react";
import { LineChart } from "lucide-react";
import { useTelemetryStore } from "@/store/useTelemetryStore";
import { useTargetStore } from "@/store/useTargetStore";
import { Panel } from "@/components/ui/Panel";
import { DistanceChart } from "@/components/lazy";

export function DistanceContainer() {
  const { activeTarget } = useTargetStore();
  const { history, trajectory, trajectoryLoading } = useTelemetryStore();

  const hasTrajectory = trajectory && (trajectory.past.length + trajectory.future.length) >= 2;
  const hasHistory = history.length >= 2;

  if (!hasTrajectory && !hasHistory) {
    return (
      <Panel
        title={trajectoryLoading ? "Mission Profile" : "Mission Profile"}
        icon={<LineChart size={14} />}
        status="idle"
      >
        <div className="h-[200px] flex items-center justify-center">
          <span className="text-text-muted text-xs font-mono">
            {trajectoryLoading ? "Loading trajectory..." : "Collecting data..."}
          </span>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Mission Profile" icon={<LineChart size={14} />} status="nominal">
      <Suspense fallback={<div className="h-[200px] bg-space-surface rounded" />}>
        <DistanceChart
          trajectory={trajectory}
          history={history}
          showMoon={activeTarget.scene.showMoon}
        />
      </Suspense>
    </Panel>
  );
}
