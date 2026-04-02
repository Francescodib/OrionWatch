import { useEffect, useState } from "react";

interface MissionTimerProps {
  launchDate: string;
}

function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  const days = Math.floor(abs / 86_400_000);
  const hours = Math.floor((abs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  const seconds = Math.floor((abs % 60_000) / 1_000);

  const prefix = ms >= 0 ? "T+" : "T-";
  const dd = String(days).padStart(3, "0");
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${prefix}${dd}:${hh}:${mm}:${ss}`;
}

export function MissionTimer({ launchDate }: MissionTimerProps) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const launch = new Date(launchDate).getTime();
    let rafId: number;

    function tick() {
      setElapsed(formatDuration(Date.now() - launch));
      rafId = requestAnimationFrame(tick);
    }

    tick();
    return () => cancelAnimationFrame(rafId);
  }, [launchDate]);

  return (
    <span className="font-mono text-lg text-cyan tabular-nums tracking-tight">
      {elapsed}
    </span>
  );
}
