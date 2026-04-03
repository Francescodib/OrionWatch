import { CircleDot } from "lucide-react";
import { useNeo } from "@/data/hooks/useExtraData";
import { Panel } from "@/components/ui/Panel";

function formatDist(km: number): string {
  if (km >= 1e6) return `${(km / 1e6).toFixed(1)}M km`;
  if (km >= 1e3) return `${(km / 1e3).toFixed(0)}k km`;
  return `${Math.round(km)} km`;
}

export function NeoPanel() {
  const { data, loading } = useNeo();

  if ((loading && !data) || !data) return null;

  return (
    <Panel
      title="Near Earth Objects"
      icon={<CircleDot size={14} />}
      status={data.hazardousCount > 0 ? "warning" : "nominal"}
      compact
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-heading uppercase tracking-[0.12em] text-text-muted">Today</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[14px] font-bold text-cyan tabular-nums">{data.count}</span>
            <span className="text-[9px] font-mono text-text-muted">objects</span>
          </div>
        </div>

        {data.hazardousCount > 0 && (
          <div className="flex items-center gap-1.5 text-amber">
            <span className="text-[9px]">&#9888;</span>
            <span className="text-[9px] font-mono font-bold">{data.hazardousCount} potentially hazardous</span>
          </div>
        )}

        <div className="bg-space-bg/60 border border-space-border/20 rounded px-2 py-1.5">
          <div className="text-[9px] font-mono text-text-muted uppercase mb-0.5">Closest Approach</div>
          <div className="text-[9px] font-mono font-bold text-text-primary truncate">{data.closestName}</div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[9px] font-mono text-cyan tabular-nums">{formatDist(data.closestDistanceKm)}</span>
            <span className="text-[9px] font-mono text-text-muted tabular-nums">{data.closestSpeedKmS.toFixed(1)} km/s</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
