import { useTargetStore } from "@/store/useTargetStore";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Database, Link2 } from "lucide-react";

export function BottomBar() {
  const { activeTarget } = useTargetStore();
  const { corsStrategy } = useDashboardStore();

  // Helper per mantenere il JSX pulito e leggibile
  const getSourceText = () => {
    if (!activeTarget?.telemetry) return "UNKNOWN";

    if (activeTarget.telemetry.source === "horizons") {
      return `JPL HORIZONS ${activeTarget.telemetry.horizons?.commandId ?? ""}`;
    }
    if (activeTarget.id === "artemis-2") {
      return "NASA AROW";
    }
    return activeTarget.telemetry.source.toUpperCase();
  };

  return (
    <footer className="h-6 sm:h-7 bg-space-surface border-t border-space-border flex items-center justify-between px-2 sm:px-4 shrink-0">

      {/* left side */}
      <div className="flex items-center gap-4 text-[9px] font-mono text-text-muted">
        <span>TARGET: {activeTarget?.id?.toUpperCase() || "NONE"}</span>
        <span className="hidden sm:flex items-center gap-1">
          <Database size={9} />
          SOURCE: {getSourceText()}
        </span>
      </div>

      {/* right side */}
      <div className="flex items-center gap-4 text-[9px] font-mono text-text-muted">
        {corsStrategy && (
          <span className="hidden sm:flex items-center gap-1">
            <Link2 size={9} />
            LINK: {corsStrategy.toUpperCase()}
          </span>
        )}
        <span>ORIONWATCH v1.0</span>
        <span>A project by        <a
          href="https://francescodibiase.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-white transition-colors">
          Francescodibiase.com
        </a>
        </span>
      </div>

    </footer >
  );
}