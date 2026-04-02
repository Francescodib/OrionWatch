import { useEffect, useState } from "react";
import type { Milestone } from "@/data/targets/types";
import { Rocket, Flame, Moon, Waves, CircleDot } from "lucide-react";

interface MilestoneTimelineProps {
  milestones: Milestone[];
}

const typeTextColors: Record<Milestone["type"], string> = {
  launch: "text-green",
  burn: "text-amber",
  flyby: "text-cyan",
  splashdown: "text-cyan",
  other: "text-text-muted",
};

const typeIcons: Record<Milestone["type"], typeof Rocket> = {
  launch: Rocket,
  burn: Flame,
  flyby: Moon,
  splashdown: Waves,
  other: CircleDot,
};

function formatEta(ms: number): string {
  if (ms <= 0) return "COMPLETE";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  const [now, setNow] = useState(Date.now());

  // Tick every 30 seconds to update ETAs
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (milestones.length === 0) return null;

  // Find progress position (0 to 1)
  const activeIdx = milestones.findIndex(
    (m) => !m.completed && new Date(m.timestamp).getTime() > now,
  );

  // Calculate progress % along the timeline
  let progressPct = 100;
  if (activeIdx > 0) {
    const prevTime = new Date(milestones[activeIdx - 1]!.timestamp).getTime();
    const nextTime = new Date(milestones[activeIdx]!.timestamp).getTime();
    const segmentPct = ((now - prevTime) / (nextTime - prevTime)) * (100 / (milestones.length - 1));
    progressPct = ((activeIdx - 1) / (milestones.length - 1)) * 100 + segmentPct;
    progressPct = Math.min(100, Math.max(0, progressPct));
  } else if (activeIdx === 0) {
    progressPct = 0;
  }

  return (
    <div className="space-y-2">
      {/* Progress track */}
      <div className="relative flex items-center justify-between px-2 py-1">
        {/* Background line */}
        <div className="absolute left-2 right-2 h-px bg-space-border top-1/2" />
        {/* Progress fill */}
        <div
          className="absolute left-2 h-px bg-gradient-to-r from-cyan/80 to-cyan/40 top-1/2 transition-[width] duration-1000"
          style={{ width: `${progressPct}%` }}
        />

        {milestones.map((m, i) => {
          const isPast = m.completed || new Date(m.timestamp).getTime() <= now;
          const isActive = i === activeIdx;

          return (
            <div
              key={m.id}
              className="relative flex flex-col items-center z-10"
            >
              {/* Type icon marker */}
              {(() => {
                const Icon = typeIcons[m.type];
                return (
                  <div className={`
                    ${isPast ? typeTextColors[m.type] : ""}
                    ${isActive ? `${typeTextColors[m.type]} motion-safe:animate-[pulse-glow_2s_ease-in-out_infinite]` : ""}
                    ${!isPast && !isActive ? "text-text-muted/40" : ""}
                  `}>
                    <Icon size={14} />
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Labels with ETA */}
      <div className="flex justify-between px-0">
        {milestones.map((m) => {
          const isPast = m.completed || new Date(m.timestamp).getTime() <= now;
          const msUntil = new Date(m.timestamp).getTime() - now;

          return (
            <div key={m.id} className="flex flex-col items-center max-w-[90px]">
              <span
                className={`text-[8px] font-mono uppercase text-center leading-tight tracking-wider
                  ${isPast ? "text-text-secondary" : "text-text-muted"}`}
              >
                {m.label}
              </span>
              <span className={`text-[7px] font-mono mt-0.5 ${isPast ? "text-green/60" : "text-amber/60"}`}>
                {isPast ? (
                  new Date(m.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                ) : (
                  `ETA ${formatEta(msUntil)}`
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
