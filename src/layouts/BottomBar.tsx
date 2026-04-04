import { useState, useCallback } from "react";
import { useTargetStore } from "@/store/useTargetStore";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Database, Link2, Info, X, ExternalLink, Code2 } from "lucide-react";

function AcknowledgmentsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-space-panel/95 backdrop-blur-md border border-cyan/20 shadow-[0_0_40px_rgba(0,212,255,0.08)] motion-safe:animate-[fade-in_0.2s_ease-out] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />

        {/* Corner brackets */}
        <span className="absolute top-0 left-0 w-5 h-5 border-t border-l border-cyan/30 pointer-events-none" />
        <span className="absolute top-0 right-0 w-5 h-5 border-t border-r border-cyan/30 pointer-events-none" />
        <span className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-cyan/30 pointer-events-none" />
        <span className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-cyan/30 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-space-border/30">
          <h2 className="font-heading text-[11px] font-bold uppercase tracking-[0.15em] text-text-secondary">
            Acknowledgments
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-cyan transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Author */}
          <div>
            <h3 className="text-[9px] font-heading uppercase tracking-[0.12em] text-text-muted mb-2">Author</h3>
            <p className="text-[12px] font-mono text-text-primary">Francesco di Biase</p>
            <div className="flex items-center gap-3 mt-1.5">
              <a href="https://www.francescodibiase.com" target="_blank" rel="noopener noreferrer"
                className="text-[10px] font-mono text-cyan hover:text-white transition-colors flex items-center gap-1">
                <ExternalLink size={9} /> francescodibiase.com
              </a>
              <a href="https://github.com/Francescodib/OrionWatch" target="_blank" rel="noopener noreferrer"
                className="text-[10px] font-mono text-cyan hover:text-white transition-colors flex items-center gap-1">
                <Code2 size={9} /> GitHub
              </a>
            </div>
          </div>

          {/* Data Sources */}
          <div>
            <h3 className="text-[9px] font-heading uppercase tracking-[0.12em] text-text-muted mb-2">Data Sources</h3>
            <div className="space-y-1.5">
              {[
                { name: "NASA AROW", desc: "Artemis Real-time Operations Window — live telemetry", url: "https://arow.nasa.gov/" },
                { name: "JPL Horizons", desc: "Spacecraft & celestial body ephemeris", url: "https://ssd.jpl.nasa.gov/horizons/" },
                { name: "NOAA SWPC", desc: "Solar wind, Kp index, solar flares, aurora forecast", url: "https://www.swpc.noaa.gov/" },
                { name: "NASA DSN Now", desc: "Deep Space Network antenna status", url: "https://eyes.nasa.gov/dsn/dsn.html" },
                { name: "NASA EPIC/DSCOVR", desc: "Earth imagery from Lagrange point L1", url: "https://epic.gsfc.nasa.gov/" },
                { name: "NASA APOD", desc: "Astronomy Picture of the Day", url: "https://apod.nasa.gov/" },
                { name: "NASA Images API", desc: "Mission photography archive", url: "https://images.nasa.gov/" },
                { name: "NASA NEO API", desc: "Near Earth Object tracking", url: "https://api.nasa.gov/" },
                { name: "CelesTrak", desc: "TLE orbital data for ISS", url: "https://celestrak.org/" },
                { name: "NASA Artemis Blog", desc: "Mission updates via RSS", url: "https://blogs.nasa.gov/artemis/" },
              ].map((src) => (
                <div key={src.name} className="flex items-baseline gap-2">
                  <a href={src.url} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] font-mono text-cyan hover:text-white transition-colors shrink-0">
                    {src.name}
                  </a>
                  <span className="text-[9px] font-mono text-text-muted truncate">{src.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Textures */}
          <div>
            <h3 className="text-[9px] font-heading uppercase tracking-[0.12em] text-text-muted mb-2">Assets</h3>
            <p className="text-[10px] font-mono text-text-muted">
              Earth and Moon textures courtesy of{" "}
              <a href="https://visibleearth.nasa.gov/" target="_blank" rel="noopener noreferrer"
                className="text-cyan hover:text-white transition-colors">NASA Visible Earth</a>.
            </p>
          </div>

          {/* Tech */}
          <div>
            <h3 className="text-[9px] font-heading uppercase tracking-[0.12em] text-text-muted mb-2">Built With</h3>
            <p className="text-[10px] font-mono text-text-muted">
              React 19 · Three.js · Recharts · Zustand · Tailwind CSS · Vite · TypeScript
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-space-border/30 text-center">
          <span className="text-[9px] font-mono text-text-muted/50 uppercase tracking-wider">
            OrionWatch v1.0 — MIT License
          </span>
        </div>
      </div>
    </div>
  );
}

export function BottomBar() {
  const { activeTarget } = useTargetStore();
  const { corsStrategy } = useDashboardStore();
  const [showAck, setShowAck] = useState(false);

  const toggleAck = useCallback(() => setShowAck((v) => !v), []);

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
    <>
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
          <button
            onClick={toggleAck}
            className="flex items-center gap-1 text-text-muted hover:text-cyan transition-colors cursor-pointer"
          >
            <Info size={9} />
            <span className="hidden sm:inline">ACKNOWLEDGMENTS</span>
          </button>
        </div>
      </footer>

      {showAck && <AcknowledgmentsModal onClose={toggleAck} />}
    </>
  );
}