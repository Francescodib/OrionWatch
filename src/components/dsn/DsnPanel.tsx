import { useDsn } from "@/data/hooks/useDsn";
import { Panel } from "@/components/ui/Panel";
import { PanelSkeleton } from "@/components/ui/PanelSkeleton";
import type { DsnDish, DsnStation } from "@/data/adapters/dsn";
import { Satellite, ArrowDown, ArrowUp, Radio } from "lucide-react";

function formatDataRate(bps: number): string {
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} Mb/s`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(0)} kb/s`;
  if (bps > 0) return `${bps} b/s`;
  return "";
}

function DishIndicator({ dish }: { dish: DsnDish }) {
  const activeDown = dish.signals.filter((s) => s.direction === "down" && s.active);
  const activeUp = dish.signals.filter((s) => s.direction === "up" && s.active);
  const maxDownRate = Math.max(0, ...activeDown.map((s) => s.dataRate));
  const targetNames = dish.targets.map((t) => t.name).join(", ");

  return (
    <div className={`flex items-center gap-2 py-1.5 border-b border-space-border/15 last:border-0 ${dish.isActive ? "" : "opacity-40"}`}>
      {/* Antenna icon */}
      <div className="w-6 flex flex-col items-center shrink-0">
        <Satellite size={12} className={dish.isActive ? "text-green motion-safe:animate-pulse" : "text-text-muted/30"} />
        <div className="text-[6px] font-mono text-text-muted leading-none mt-0.5">{dish.name.replace("DSS", "")}</div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-mono font-bold text-text-primary truncate">
            {dish.name}
          </span>
          {targetNames && (
            <span className="text-[7px] font-mono text-cyan truncate">
              {targetNames}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {activeDown.length > 0 && (
            <span className="text-[7px] font-mono text-green flex items-center gap-0.5">
              <ArrowDown size={8} /> {formatDataRate(maxDownRate)}
            </span>
          )}
          {activeUp.length > 0 && (
            <span className="text-[7px] font-mono text-amber flex items-center gap-0.5">
              <ArrowUp size={8} /> UL
            </span>
          )}
          {!dish.isActive && (
            <span className="text-[7px] font-mono text-text-muted italic truncate">
              {dish.activity || "Idle"}
            </span>
          )}
        </div>
      </div>

      {/* Elevation */}
      <div className="text-[7px] font-mono text-text-muted tabular-nums shrink-0">
        {dish.elevation.toFixed(0)}°
      </div>
    </div>
  );
}

function StationBlock({ station }: { station: DsnStation }) {
  const activeDishes = station.dishes.filter((d) => d.isActive);
  const stationAbbr: Record<string, string> = {
    "Goldstone": "GDSCC",
    "Canberra": "CDSCC",
    "Madrid": "MDSCC",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] font-heading uppercase tracking-[0.12em] text-text-muted">
          {station.friendlyName}
          <span className="text-text-muted/40 ml-1">{stationAbbr[station.friendlyName] ?? ""}</span>
        </span>
        <span className="text-[7px] font-mono text-text-muted tabular-nums">
          {activeDishes.length}/{station.dishes.length}
        </span>
      </div>
      {station.dishes.length > 0 ? (
        station.dishes
          .sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0))
          .map((dish) => <DishIndicator key={dish.name} dish={dish} />)
      ) : (
        <p className="text-[7px] font-mono text-text-muted/40 py-1">No dishes reporting</p>
      )}
    </div>
  );
}

export function DsnPanel() {
  const { data, loading, error } = useDsn();

  if (loading && !data) return <PanelSkeleton lines={5} />;

  if (error && !data) {
    return (
      <Panel title="Deep Space Network" status="idle">
        <div className="py-3 flex flex-col items-center gap-2">
          <div className="w-5 h-5 rounded-full border border-text-muted/30 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-text-muted/40 motion-safe:animate-[pulse-glow_2s_ease-in-out_infinite]" />
          </div>
          <p className="text-text-muted text-[9px] font-mono uppercase tracking-wider">
            Awaiting DSN link
          </p>
        </div>
      </Panel>
    );
  }

  if (!data) return null;

  const totalActive = data.stations.reduce(
    (sum, s) => sum + s.dishes.filter((d) => d.isActive).length,
    0,
  );
  const totalDishes = data.stations.reduce((sum, s) => sum + s.dishes.length, 0);

  return (
    <Panel
      title="Deep Space Network"
      icon={<Radio size={14} />}
      status={totalActive > 0 ? "nominal" : "idle"}
    >
      <div className="space-y-3">
        {/* Summary */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[8px] font-heading uppercase tracking-wider text-text-muted">
            Active Antennas
          </span>
          <span className="font-mono text-[13px] font-bold text-cyan tabular-nums">
            {totalActive}<span className="text-text-muted text-[9px] font-normal">/{totalDishes}</span>
          </span>
        </div>

        {/* Stations */}
        {data.stations.map((station) => (
          <StationBlock key={station.name} station={station} />
        ))}

        <p className="text-[6px] font-mono text-text-muted/40 text-center">
          Data: NASA/JPL Deep Space Network
        </p>
      </div>
    </Panel>
  );
}
