import type { ReactNode } from "react";
import { StatusDot } from "./StatusDot";

interface PanelProps {
  title: string;
  children: ReactNode;
  status?: "nominal" | "warning" | "error" | "idle";
  icon?: ReactNode;
  className?: string;
  compact?: boolean;
  /** Remove internal padding — caller controls layout entirely. */
  flush?: boolean;
}

export function Panel({
  title,
  children,
  status,
  icon,
  className = "",
  compact = false,
  flush = false,
}: PanelProps) {
  return (
    <div
      className={`
        relative bg-space-panel/80 backdrop-blur-sm overflow-hidden
        motion-safe:animate-[fade-in_0.3s_ease-out]
        ${className}
      `}
    >
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />

      {/* Corner brackets */}
      <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyan/30 pointer-events-none z-10" />
      <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan/30 pointer-events-none z-10" />
      <span className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyan/30 pointer-events-none z-10" />
      <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan/30 pointer-events-none z-10" />

      <div className={flush ? "flex flex-col h-full" : compact ? "p-3" : "p-4"}>
        {/* Header */}
        <div className={`flex items-center gap-2 shrink-0 ${flush ? "px-4 pt-3 pb-2" : "mb-3"}`}>
          {status && <StatusDot status={status} />}
          {icon && <span className="text-text-muted/60 shrink-0">{icon}</span>}
          <h3 className="font-heading text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">
            {title}
          </h3>
        </div>
        {flush ? <div className="flex-1 min-h-0">{children}</div> : children}
      </div>
    </div>
  );
}
