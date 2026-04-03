interface SpeedComparisonProps {
  speedKmS: number;
}

const REFERENCES = [
  { label: "Sound", kmS: 0.343, color: "bg-text-muted/40" },
  { label: "Bullet", kmS: 1.2, color: "bg-text-muted/60" },
  { label: "ISS", kmS: 7.66, color: "bg-green/60" },
  { label: "Escape vel.", kmS: 11.2, color: "bg-amber/60" },
  { label: "Current", kmS: 0, color: "bg-cyan" },
];

export function SpeedComparison({ speedKmS }: SpeedComparisonProps) {
  // Scale: max reference is escape velocity or current speed, whichever is higher
  const maxSpeed = Math.max(11.2, speedKmS * 1.15);

  const items = REFERENCES.map((ref) => ({
    ...ref,
    kmS: ref.label === "Current" ? speedKmS : ref.kmS,
  })).sort((a, b) => a.kmS - b.kmS);

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const pct = Math.min(100, (item.kmS / maxSpeed) * 100);
        const isCurrent = item.label === "Current";

        return (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`text-[9px] font-mono w-[52px] text-right shrink-0 ${isCurrent ? "text-cyan font-bold" : "text-text-muted"}`}>
              {item.label}
            </span>
            <div className="flex-1 h-1.5 bg-space-bg/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${item.color} ${isCurrent ? "motion-safe:animate-pulse" : ""}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-[9px] font-mono tabular-nums w-[44px] shrink-0 ${isCurrent ? "text-cyan font-bold" : "text-text-muted"}`}>
              {item.kmS.toFixed(1)}
            </span>
          </div>
        );
      })}
      <p className="text-[9px] font-mono text-text-muted/40 text-right">km/s</p>
    </div>
  );
}
