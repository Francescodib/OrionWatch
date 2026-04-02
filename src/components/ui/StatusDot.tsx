interface StatusDotProps {
  status: "nominal" | "warning" | "error" | "idle";
  size?: "sm" | "md";
}

const colors: Record<StatusDotProps["status"], string> = {
  nominal: "bg-green shadow-[0_0_6px_rgba(127,255,0,0.5)]",
  warning: "bg-amber shadow-[0_0_6px_rgba(255,107,53,0.5)]",
  error: "bg-red shadow-[0_0_6px_rgba(255,51,51,0.5)]",
  idle: "bg-text-muted",
};

export function StatusDot({ status, size = "sm" }: StatusDotProps) {
  const dim = size === "sm" ? "w-2 h-2" : "w-3 h-3";

  return (
    <span
      className={`
        inline-block rounded-full ${dim} ${colors[status]}
        ${status !== "idle" ? "motion-safe:animate-[pulse-glow_2s_ease-in-out_infinite]" : ""}
      `}
      role="status"
      aria-label={status}
    />
  );
}
