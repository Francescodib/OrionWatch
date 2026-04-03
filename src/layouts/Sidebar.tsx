import { useTargetStore } from "@/store/useTargetStore";
import { useTelemetryStore } from "@/store/useTelemetryStore";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useSpaceWeather } from "@/data/hooks/useSpaceWeather";
// import { TargetSwitcher } from "@/components/mission/TargetSwitcher";
import { CrewCard } from "@/components/mission/CrewCard";
import { SidebarTelemetry } from "@/components/telemetry/SidebarTelemetry";
import { OrbitalElements } from "@/components/telemetry/OrbitalElements";
import { GroundTrack } from "@/components/telemetry/GroundTrack";
import { SpeedComparison } from "@/components/telemetry/SpeedComparison";
import { RadiationEstimate } from "@/components/telemetry/RadiationEstimate";
import { Panel } from "@/components/ui/Panel";
import { ChevronLeft, ChevronRight, Orbit, MapPin, Gauge, ShieldAlert, Activity } from "lucide-react";

export function Sidebar() {
  const { activeTarget } = useTargetStore();
  const { sidebarOpen, toggleSidebar } = useDashboardStore();
  const state = useTelemetryStore((s) => s.state);
  const history = useTelemetryStore((s) => s.history);

  const hasCrew = activeTarget.spacecraft.crew.length > 0;
  const weatherEnabled = activeTarget.spaceWeather.enabled;

  return (
    <aside
      className={`
        fixed inset-x-0 bottom-0 z-40 max-h-[70vh] rounded-t-xl transition-transform duration-300
        ${sidebarOpen ? "translate-y-0" : "translate-y-full"}
        sm:static sm:inset-auto sm:z-auto sm:max-h-none sm:rounded-none sm:translate-y-0 sm:transition-[width] sm:duration-200
        bg-space-surface/95 sm:bg-space-surface/60 backdrop-blur-md sm:backdrop-blur-sm
        border-t sm:border-t-0 border-r border-space-border
        flex flex-col shrink-0
        ${sidebarOpen ? "sm:w-64" : "sm:w-10"}
      `}
    >
      {/* Mobile drag handle */}
      <div className="sm:hidden flex justify-center py-2 shrink-0">
        <div className="w-10 h-1 rounded-full bg-text-muted/30" />
      </div>

      {/* Toggle button (desktop only) */}
      <button
        onClick={toggleSidebar}
        className="hidden sm:flex h-10 items-center justify-center text-text-muted hover:text-cyan transition-colors cursor-pointer border-b border-space-border"
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {sidebarOpen && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {/* Crew */}
          {hasCrew && (
            <CrewCard
              crew={activeTarget.spacecraft.crew}
              spacecraftName={activeTarget.spacecraft.name}
            />
          )}

          {/* Telemetry */}
          <Panel title="Telemetry" icon={<Activity size={12} />} status={state ? "nominal" : "idle"} compact>
            {state ? (
              <SidebarTelemetry
                state={state}
                history={history}
                showMoonDistance={activeTarget.scene.showMoon}
                milestones={activeTarget.milestones}
                launchDate={activeTarget.spacecraft.launchDate}
                splashdownDate={activeTarget.spacecraft.splashdownDate}
              />
            ) : (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-4 bg-space-bg/60 rounded animate-pulse" />
                ))}
              </div>
            )}
          </Panel>

          {/* Secondary data panels */}
          {state && (
            <>
              <Panel title="Orbital" icon={<Orbit size={12} />} status="nominal" compact>
                <OrbitalElements state={state} />
              </Panel>

              <Panel title="Position" icon={<MapPin size={12} />} status="nominal" compact>
                <GroundTrack state={state} />
              </Panel>

              <Panel title="Speed" icon={<Gauge size={12} />} status="nominal" compact>
                <SpeedComparison speedKmS={state.speedKmS} />
              </Panel>

              {hasCrew && weatherEnabled && (
                <Panel title="Radiation" icon={<ShieldAlert size={12} />} status="nominal" compact>
                  <WeatherAwareRadiation distanceFromEarthKm={state.distanceFromEarthKm} />
                </Panel>
              )}
            </>
          )}

          {/* Attribution */}
          <div className="pt-2">
            <p className="text-[9px] text-text-muted/40 font-mono leading-relaxed uppercase tracking-wider text-center">
              NASA/JPL · NOAA/SWPC
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

function WeatherAwareRadiation({ distanceFromEarthKm }: { distanceFromEarthKm: number }) {
  const { data } = useSpaceWeather(true);
  const kp = data?.kpIndex.at(-1)?.kpIndex ?? 0;
  const windSpeed = data?.solarWind.at(-1)?.speed ?? null;

  return (
    <RadiationEstimate
      distanceFromEarthKm={distanceFromEarthKm}
      kpIndex={kp}
      solarWindSpeed={windSpeed}
    />
  );
}
