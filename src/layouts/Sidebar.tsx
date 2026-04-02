import { useTargetStore } from "@/store/useTargetStore";
import { useTelemetryStore } from "@/store/useTelemetryStore";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useSpaceWeather } from "@/data/hooks/useSpaceWeather";
import { TargetSwitcher } from "@/components/mission/TargetSwitcher";
import { CrewCard } from "@/components/mission/CrewCard";
import { SidebarTelemetry } from "@/components/telemetry/SidebarTelemetry";
import { OrbitalElements } from "@/components/telemetry/OrbitalElements";
import { GroundTrack } from "@/components/telemetry/GroundTrack";
import { SpeedComparison } from "@/components/telemetry/SpeedComparison";
import { RadiationEstimate } from "@/components/telemetry/RadiationEstimate";
import { ChevronLeft, ChevronRight, Orbit, MapPin, Gauge, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

function SidebarSection({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon && <span className="text-text-muted/50">{icon}</span>}
        <span className="text-[8px] font-heading uppercase tracking-[0.15em] text-text-muted/60">{title}</span>
      </div>
      {children}
    </div>
  );
}

function SidebarDivider() {
  return <div className="border-t border-space-border/30" />;
}

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
        bg-space-surface/60 backdrop-blur-sm border-r border-space-border
        flex flex-col shrink-0 transition-[width] duration-200
        ${sidebarOpen ? "w-64" : "w-10"}
      `}
    >
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="h-10 flex items-center justify-center text-text-muted hover:text-cyan transition-colors cursor-pointer border-b border-space-border"
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {sidebarOpen && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <TargetSwitcher />

          {hasCrew && (
            <CrewCard
              crew={activeTarget.spacecraft.crew}
              spacecraftName={activeTarget.spacecraft.name}
            />
          )}

          <SidebarDivider />

          {/* Telemetry readouts */}
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

          <SidebarDivider />

          {/* Secondary data */}
          {state && (
            <>
              <SidebarSection title="Orbital" icon={<Orbit size={10} />}>
                <OrbitalElements state={state} />
              </SidebarSection>

              <SidebarSection title="Position" icon={<MapPin size={10} />}>
                <GroundTrack state={state} />
              </SidebarSection>

              <SidebarSection title="Speed" icon={<Gauge size={10} />}>
                <SpeedComparison speedKmS={state.speedKmS} />
              </SidebarSection>

              {hasCrew && weatherEnabled && (
                <SidebarSection title="Radiation" icon={<ShieldAlert size={10} />}>
                  <WeatherAwareRadiation distanceFromEarthKm={state.distanceFromEarthKm} />
                </SidebarSection>
              )}
            </>
          )}

          {/* Attribution */}
          <div className="mt-auto pt-3 border-t border-space-border/30">
            <p className="text-[6px] text-text-muted/50 font-mono leading-relaxed uppercase tracking-wider">
              Data: NASA/JPL, NOAA/SWPC
              <br />
              Textures: Solar System Scope (CC-BY 4.0)
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
