import { Suspense } from "react";
import { useSpaceWeather } from "@/data/hooks/useSpaceWeather";
import { useAurora } from "@/data/hooks/useExtraData";
import { Panel } from "@/components/ui/Panel";
import { PanelSkeleton } from "@/components/ui/PanelSkeleton";
import { SolarWindChart, KpIndexChart } from "@/components/lazy";
import { flareLevel } from "@/data/adapters/solar-flares";
import { Sun, AlertTriangle, Sparkles } from "lucide-react";

interface SpaceWeatherPanelProps {
  enabled: boolean;
}

export function SpaceWeatherPanel({ enabled }: SpaceWeatherPanelProps) {
  const { data, error, loading } = useSpaceWeather(enabled);

  if (!enabled) {
    return (
      <Panel title="Space Weather" status="idle">
        <p className="text-text-muted text-xs font-mono">
          Not available for this target
        </p>
      </Panel>
    );
  }

  if (loading && !data) return <PanelSkeleton lines={3} />;

  // Graceful degradation: show waiting state instead of ugly error
  if (error && !data) {
    return (
      <Panel title="Space Weather" status="idle">
        <div className="py-4 flex flex-col items-center gap-2">
          <div className="w-6 h-6 rounded-full border border-text-muted/30 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-text-muted/40 motion-safe:animate-[pulse-glow_2s_ease-in-out_infinite]" />
          </div>
          <p className="text-text-muted text-[10px] font-mono uppercase tracking-wider">
            Awaiting NOAA link
          </p>
        </div>
      </Panel>
    );
  }

  if (!data) return null;

  const latestKp = data.kpIndex.at(-1)?.kpIndex ?? 0;
  const latestWind = data.solarWind.at(-1);
  const windSpeed = latestWind?.speed;
  const windDensity = latestWind?.density;

  return (
    <Panel
      title="Space Weather"
      icon={<Sun size={14} />}
      status={latestKp >= 6 ? "error" : latestKp >= 4 ? "warning" : "nominal"}
    >
      <div className="space-y-4">
        {/* Quick-glance readouts */}
        {(windSpeed != null || windDensity != null) && (
          <div className="flex gap-4 px-1">
            {windSpeed != null && (
              <div>
                <div className="text-[7px] font-heading uppercase tracking-[0.12em] text-text-muted">Solar Wind</div>
                <div className="font-mono text-[12px] font-bold text-cyan tabular-nums">
                  {Math.round(windSpeed)} <span className="text-[8px] text-text-muted font-normal">km/s</span>
                </div>
              </div>
            )}
            {windDensity != null && (
              <div>
                <div className="text-[7px] font-heading uppercase tracking-[0.12em] text-text-muted">Proton Density</div>
                <div className="font-mono text-[12px] font-bold text-green tabular-nums">
                  {windDensity.toFixed(1)} <span className="text-[8px] text-text-muted font-normal">p/cm³</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Solar flare alerts */}
        {data.flares.length > 0 && (() => {
          const latest = data.flares[0]!;
          const level = flareLevel(latest.maxClass);
          const colors: Record<string, string> = {
            quiet: "border-text-muted/20 text-text-muted",
            minor: "border-green/30 text-green",
            moderate: "border-amber/30 text-amber",
            strong: "border-red/30 text-red",
            extreme: "border-red/50 text-red",
          };
          return (
            <div className={`border rounded px-2 py-1.5 ${colors[level]}`}>
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-heading uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle size={10} />
                  {latest.isActive ? "Active Flare" : "Recent Flare"}
                </span>
                <span className="text-[10px] font-mono font-bold tabular-nums">
                  {latest.maxClass}
                </span>
              </div>
              <div className="text-[7px] font-mono text-text-muted mt-0.5">
                Peak: {latest.maxTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} UTC
                {latest.endTime ? ` — Ended ${latest.endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : " — Ongoing"}
              </div>
            </div>
          );
        })()}

        <div>
          <h4 className="text-[9px] font-heading uppercase tracking-widest text-text-muted mb-1">
            Interplanetary Magnetic Field
          </h4>
          <Suspense fallback={<div className="h-[160px] bg-space-surface rounded" />}>
            <SolarWindChart data={data.solarWind} />
          </Suspense>
        </div>
        <div>
          <h4 className="text-[9px] font-heading uppercase tracking-widest text-text-muted mb-1">
            Planetary K-Index
          </h4>
          <Suspense fallback={<div className="h-[120px] bg-space-surface rounded" />}>
            <KpIndexChart data={data.kpIndex} />
          </Suspense>
        </div>

        {/* Aurora forecast */}
        <AuroraSection />
      </div>
    </Panel>
  );
}

function AuroraSection() {
  const { data } = useAurora();
  if (!data) return null;

  const intensity = data.maxIntensity;
  const level = intensity >= 50 ? "Strong" : intensity >= 20 ? "Moderate" : intensity >= 5 ? "Minor" : "None";
  const color = intensity >= 50 ? "text-green" : intensity >= 20 ? "text-cyan" : intensity >= 5 ? "text-cyan/60" : "text-text-muted";

  return (
    <div className="bg-space-bg/60 border border-space-border/20 rounded px-2 py-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] font-heading uppercase tracking-[0.12em] text-text-muted flex items-center gap-1"><Sparkles size={10} />Aurora Forecast</span>
        <span className={`text-[9px] font-mono font-bold ${color}`}>{level}</span>
      </div>
      <div className="flex items-center gap-3">
        <div>
          <span className="text-[7px] font-mono text-text-muted">Visible above</span>
          <div className="text-[9px] font-mono font-bold text-text-primary tabular-nums">
            {Math.abs(data.northLatitude).toFixed(0)}°N / {Math.abs(data.southLatitude).toFixed(0)}°S
          </div>
        </div>
        <div className="flex-1 h-2 bg-space-bg/80 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green/40 to-green"
            style={{ width: `${Math.min(100, intensity)}%` }}
          />
        </div>
        <span className="text-[8px] font-mono text-text-muted tabular-nums">{intensity}%</span>
      </div>
    </div>
  );
}
