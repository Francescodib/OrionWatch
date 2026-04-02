interface BadgeProps {
  variant: "live" | "historical" | "demo" | "nominal" | "warning";
  children: string;
}

const variants: Record<BadgeProps["variant"], string> = {
  live: "bg-green/15 text-green border-green/30",
  historical: "bg-cyan/15 text-cyan border-cyan/30",
  demo: "bg-text-muted/15 text-text-secondary border-text-muted/30",
  nominal: "bg-green/15 text-green border-green/30",
  warning: "bg-amber/15 text-amber border-amber/30",
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5
        text-[10px] font-mono uppercase tracking-wider
        border rounded ${variants[variant]}
      `}
    >
      {children}
    </span>
  );
}
