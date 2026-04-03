interface RadiationEstimateProps {
  distanceFromEarthKm: number;
  kpIndex: number;
  /** Solar wind speed in km/s. Null if unavailable. */
  solarWindSpeed: number | null;
}

/**
 * Rough radiation dose rate estimate for crew safety awareness.
 *
 * Based on simplified empirical model:
 * - Base GCR rate ~0.5 mSv/day in deep space, ~0.3 mSv/day in LEO (with magnetosphere shielding)
 * - Increases with Kp (geomagnetic storms enhance radiation belts)
 * - Solar wind speed > 600 km/s indicates enhanced solar activity
 *
 * NOT for medical decisions — illustrative only.
 */
function estimateDoseRate(distKm: number, kp: number, windSpeed: number | null): number {
  // LEO: ~0.3-0.5 mSv/day, Deep space: ~0.5-1.0 mSv/day
  // Transition zone: Van Allen belts (1000-60000 km) can be 10x higher
  let baseRate: number;

  if (distKm < 2000) {
    // LEO — partially shielded by magnetosphere
    baseRate = 0.3;
  } else if (distKm < 60000) {
    // Van Allen belt transition — elevated
    const beltFactor = 1 + 4 * Math.sin((Math.PI * (distKm - 2000)) / (60000 - 2000));
    baseRate = 0.3 * beltFactor;
  } else {
    // Beyond magnetosphere — full GCR exposure
    baseRate = 0.7;
  }

  // Kp enhancement: storms increase radiation
  const kpFactor = 1 + (kp / 9) * 0.8;

  // Solar wind enhancement
  const windFactor = windSpeed && windSpeed > 500 ? 1 + ((windSpeed - 500) / 500) * 0.3 : 1;

  return baseRate * kpFactor * windFactor;
}

function getDoseLevel(msvDay: number): { label: string; color: string } {
  if (msvDay >= 2.0) return { label: "ELEVATED", color: "text-red" };
  if (msvDay >= 1.0) return { label: "MODERATE", color: "text-amber" };
  return { label: "NOMINAL", color: "text-green" };
}

export function RadiationEstimate({ distanceFromEarthKm, kpIndex, solarWindSpeed }: RadiationEstimateProps) {
  const doseRate = estimateDoseRate(distanceFromEarthKm, kpIndex, solarWindSpeed);
  const level = getDoseLevel(doseRate);

  // Cumulative estimate (simplified: current rate × mission day)
  const dailyMsv = doseRate;

  return (
    <div className="bg-space-bg/60 border border-space-border/30 rounded px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] font-heading uppercase tracking-[0.12em] text-text-muted">
          Radiation Est.
        </span>
        <span className={`text-[9px] font-mono font-bold ${level.color}`}>
          {level.label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-[14px] font-bold tabular-nums ${level.color}`}>
          {dailyMsv.toFixed(2)}
        </span>
        <span className="text-[9px] font-mono text-text-muted">mSv/day</span>
      </div>
      <p className="text-[9px] font-mono text-text-muted/40 mt-1">
        Estimate based on distance + Kp + solar wind. Not for medical use.
      </p>
    </div>
  );
}
