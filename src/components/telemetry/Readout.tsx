import type { ReactNode } from "react";

export interface ReadoutProps {
  label: string;
  value: string;
  unit: string;
  accent?: "cyan" | "amber" | "green";
  icon?: ReactNode;
}

const colorMap = { cyan: "text-cyan", amber: "text-amber", green: "text-green" };

export function Readout({ label, value, unit, accent = "cyan", icon }: ReadoutProps) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-space-border/20 last:border-0">
      <span className="text-[10px] sm:text-[9px] font-heading uppercase tracking-[0.12em] text-text-muted flex items-center gap-1.5">
        {icon ? <span className={colorMap[accent]} style={{ display: "flex" }}>{icon}</span> : <span className={`w-1 h-1 rounded-full bg-current ${colorMap[accent]} opacity-40`} />}
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-[14px] sm:text-[13px] font-bold tabular-nums ${colorMap[accent]}`}>
          {value}
        </span>
        {unit && (
          <span className="text-[10px] sm:text-[9px] font-mono text-text-muted uppercase">{unit}</span>
        )}
      </div>
    </div>
  );
}
