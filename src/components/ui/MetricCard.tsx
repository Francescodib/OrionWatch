import { useEffect, useRef, useState } from "react";

interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  precision?: number;
  status?: "nominal" | "warning" | "error";
}

function useAnimatedValue(target: number, duration = 400): number {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>(0);
  const startRef = useRef({ value: target, time: 0 });
  const prevTarget = useRef(target);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(target);
      return;
    }

    startRef.current = { value: prevTarget.current, time: performance.now() };
    prevTarget.current = target;

    function animate(now: number) {
      const elapsed = now - startRef.current.time;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(
        startRef.current.value + (target - startRef.current.value) * eased,
      );
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}

const statusColors: Record<string, string> = {
  nominal: "text-cyan",
  warning: "text-amber",
  error: "text-red",
};

export function MetricCard({
  label,
  value,
  unit,
  precision = 0,
  status = "nominal",
}: MetricCardProps) {
  const animated = useAnimatedValue(value);

  const formatted =
    precision === 0
      ? Math.round(animated).toLocaleString("en-US")
      : animated.toLocaleString("en-US", {
          minimumFractionDigits: precision,
          maximumFractionDigits: precision,
        });

  return (
    <div className="bg-space-surface border border-space-border rounded-lg p-3">
      <div className="text-[10px] font-heading uppercase tracking-widest text-text-muted mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`font-mono text-2xl font-bold tabular-nums ${statusColors[status] ?? "text-cyan"}`}
        >
          {formatted}
        </span>
        <span className="text-xs text-text-muted uppercase">{unit}</span>
      </div>
    </div>
  );
}
