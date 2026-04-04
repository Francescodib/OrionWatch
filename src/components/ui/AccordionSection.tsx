import { type ReactNode, useCallback } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionSectionProps {
  title: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  badge?: string;
}

export function AccordionSection({
  title,
  icon,
  open,
  onToggle,
  children,
  badge,
}: AccordionSectionProps) {
  const handleToggle = useCallback(() => onToggle(), [onToggle]);

  return (
    <div className="border-b border-space-border/30">
      {/* Header — always visible */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-2.5 px-4 py-3 active:bg-cyan/5 transition-colors cursor-pointer"
      >
        <span className="text-text-muted/60 shrink-0">{icon}</span>
        <span className="font-heading text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary flex-1 text-left">
          {title}
        </span>
        {badge && (
          <span className="text-[9px] font-mono text-cyan/70 bg-cyan/10 px-1.5 py-0.5 rounded-sm">
            {badge}
          </span>
        )}
        <ChevronDown
          size={12}
          className={`text-text-muted/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Body — animated expand/collapse */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
