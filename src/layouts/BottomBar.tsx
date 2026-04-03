import { useTargetStore } from "@/store/useTargetStore";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Database, Link2 } from "lucide-react";

export function BottomBar() {
  const { activeTarget } = useTargetStore();
  const { corsStrategy } = useDashboardStore();

  return (
    <footer className="h-7 bg-space-surface border-t border-space-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4 text-[9px] font-mono text-text-muted">
        <span>TARGET: {activeTarget.id.toUpperCase()}</span>
        <span className="flex items-center gap-1">
          <Database size={9} />
          SOURCE:{" "}
          {activeTarget.telemetry.source === "horizons"
            ? `JPL HORIZONS ${activeTarget.telemetry.horizons?.commandId ?? ""}`
            : activeTarget.id === "artemis-2"
              ? "NASA AROW"
              : activeTarget.telemetry.source.toUpperCase()}
        </span>
      </div>
      <div className="flex items-center gap-4 text-[9px] font-mono text-text-muted">
        {corsStrategy && <span className="flex items-center gap-1"><Link2 size={9} />LINK: {corsStrategy.toUpperCase()}</span>}
        <span>ORIONWATCH v1.0</span>
      </div>
    </footer>
  );
}
