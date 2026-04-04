import { useTargetStore } from "@/store/useTargetStore";
import { useDashboardStore } from "@/store/useDashboardStore";
import { MissionTimer } from "@/components/telemetry/MissionTimer";
import { StatusDot } from "@/components/ui/StatusDot";
import { Satellite, Wifi, WifiOff } from "lucide-react";

export function TopBar() {
  const { activeTarget } = useTargetStore();
  const { corsStrategy } = useDashboardStore();

  return (
    <header className="h-10 bg-space-surface/80 backdrop-blur-sm border-b border-space-border flex items-center justify-between px-4 shrink-0 relative">
      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan/20 to-transparent" />

      {/* Left: branding + target */}
      <div className="flex items-center gap-3">
        <Satellite size={14} className="text-cyan" />
        <h1 className="font-heading text-sm font-bold tracking-[0.2em] text-cyan uppercase">
          OrionWatch
        </h1>
        <span className="text-cyan/20 text-xs hidden sm:block">|</span>
        <span className="text-text-secondary text-[11px] font-heading hidden sm:block truncate max-w-[200px]">
          {activeTarget.label}
        </span>
      </div>

      {/* Center: mission timer */}
      <MissionTimer launchDate={activeTarget.spacecraft.launchDate} />

      {/* Right: connection status */}
      <div className="flex items-center gap-2">
        {corsStrategy === "failed" ? (
          <WifiOff size={12} className="text-red" />
        ) : (
          <Wifi size={12} className="text-green" />
        )}
        <StatusDot status={corsStrategy === "failed" ? "error" : "nominal"} />
        <span className="text-[9px] font-mono text-text-muted hidden md:block tracking-wider">
          {corsStrategy ? corsStrategy.toUpperCase() : "INIT"}
        </span>
      </div>
    </header>
  );
}
