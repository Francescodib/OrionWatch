import type { SpacecraftState, Milestone } from "@/data/targets/types";
import { Crosshair, Moon, Gauge, Zap, Radio, Activity, Route, ArrowRight } from "lucide-react";
import { Readout } from "./Readout";
import {
  formatDistance, formatSignalDelay, getMachNumber, getCurrentPhase,
  getMissionProgress, getCumulativeDistance, getGForce, formatEta,
} from "./telemetry-utils";

interface SidebarTelemetryProps {
  state: SpacecraftState;
  history: SpacecraftState[];
  showMoonDistance: boolean;
  milestones: Milestone[];
  launchDate: string;
  splashdownDate?: string;
}

export function SidebarTelemetry({
  state, history, showMoonDistance, milestones, launchDate, splashdownDate,
}: SidebarTelemetryProps) {
  const earthDist = formatDistance(state.distanceFromEarthKm);
  const moonDist = formatDistance(state.distanceFromMoonKm);
  const signal = formatSignalDelay(state.distanceFromEarthKm);
  const mach = getMachNumber(state.speedKmS);
  const phase = getCurrentPhase(milestones);
  const progress = getMissionProgress(launchDate, splashdownDate);
  const cumDist = getCumulativeDistance(history);
  const gForce = getGForce(history);

  return (
    <div className="space-y-3">
      {/* Phase banner */}
      <div className="bg-space-bg/60 border border-space-border/30 rounded px-2.5 py-1.5">
        <div className="text-[7px] font-heading uppercase tracking-[0.15em] text-text-muted mb-0.5">Phase</div>
        <div className="font-heading text-[10px] font-bold uppercase tracking-wider text-cyan truncate">
          {phase.current}
        </div>
        {phase.next && (
          <div className="text-[7px] font-mono text-text-muted mt-0.5 flex items-center gap-1">
            <ArrowRight size={7} className="text-amber shrink-0" />
            <span className="truncate">{phase.next.label}</span>
            <span className="text-amber ml-auto shrink-0 text-[7px]">
              {formatEta(new Date(phase.next.timestamp).getTime() - Date.now())}
            </span>
          </div>
        )}
      </div>

      {/* Primary */}
      <div>
        <Readout label="Dst Earth" value={earthDist.value} unit={earthDist.unit} icon={<Crosshair size={9} />} />
        {showMoonDistance && (
          <Readout label="Dst Moon" value={moonDist.value} unit={moonDist.unit} icon={<Moon size={9} />} />
        )}
        <Readout label="Velocity" value={state.speedKmS.toFixed(2)} unit="km/s" icon={<Gauge size={9} />} />
        <Readout label="Mach" value={mach} unit="" accent="green" icon={<Zap size={9} />} />
      </div>

      {/* Derived */}
      <div>
        <Readout label="Signal" value={signal.value} unit={signal.unit} accent="amber" icon={<Radio size={9} />} />
        <Readout label="G-Force" value={gForce} unit="g" icon={<Activity size={9} />} />
        {cumDist > 0 && (
          <Readout label="Path" value={formatDistance(cumDist).value} unit={formatDistance(cumDist).unit} accent="green" icon={<Route size={9} />} />
        )}
      </div>

      {/* Progress bar */}
      {progress !== null && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[7px] font-heading uppercase tracking-[0.12em] text-text-muted">Progress</span>
            <span className="font-mono text-[10px] font-bold text-cyan tabular-nums">{progress.toFixed(1)}%</span>
          </div>
          <div className="h-1 bg-space-bg/80 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan/60 to-cyan rounded-full transition-[width] duration-1000" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
