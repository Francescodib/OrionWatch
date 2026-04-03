import type { SpacecraftState } from "@/data/targets/types";

interface GroundTrackProps {
  state: SpacecraftState;
}

/**
 * Convert ECI position to geographic lat/lon.
 * Uses Earth's rotation (GMST) for longitude.
 */
function eciToGeo(posKm: [number, number, number], date: Date): { lat: number; lon: number; alt: number } {
  const [x, y, z] = posKm;
  const r = Math.sqrt(x * x + y * y + z * z);
  const lat = Math.asin(z / r) * (180 / Math.PI);

  // Greenwich Mean Sidereal Time (simplified)
  const J2000 = new Date("2000-01-01T12:00:00Z").getTime();
  const centuries = (date.getTime() - J2000) / (86400000 * 36525);
  const gmstDeg = (280.46061837 + 360.98564736629 * ((date.getTime() - J2000) / 86400000) + 0.000387933 * centuries * centuries) % 360;

  const eciLon = Math.atan2(y, x) * (180 / Math.PI);
  let lon = eciLon - gmstDeg;

  // Normalize to [-180, 180]
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;

  const alt = r - 6371; // km above sea level

  return { lat, lon, alt };
}

function formatCoord(deg: number, posLabel: string, negLabel: string): string {
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  return `${d}°${m.toString().padStart(2, "0")}'${deg >= 0 ? posLabel : negLabel}`;
}

function getRegion(lat: number, lon: number): string {
  // Very rough region identification
  if (lat > 60) return lon > 0 ? "Arctic / N. Europe" : "Arctic / N. America";
  if (lat < -60) return "Antarctica";
  if (lat > 20 && lat < 50 && lon > -130 && lon < -60) return "North America";
  if (lat > 35 && lat < 70 && lon > -10 && lon < 40) return "Europe";
  if (lat > 0 && lat < 55 && lon > 60 && lon < 150) return "Asia";
  if (lat > -40 && lat < 0 && lon > 110 && lon < 160) return "Australia";
  if (lat > -35 && lat < 15 && lon > -80 && lon < -35) return "South America";
  if (lat > -35 && lat < 35 && lon > -20 && lon < 55) return "Africa";
  // Check if over ocean
  if (lon > -180 && lon < -100 && lat > -60 && lat < 60) return "Pacific Ocean";
  if (lon > -80 && lon < 0 && lat > -60 && lat < 60) return "Atlantic Ocean";
  if (lon > 40 && lon < 110 && lat > -60 && lat < 30) return "Indian Ocean";
  return "Open Ocean";
}

export function GroundTrack({ state }: GroundTrackProps) {
  const geo = eciToGeo(state.positionKm, state.timestamp);
  const region = getRegion(geo.lat, geo.lon);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-heading uppercase tracking-[0.12em] text-text-muted">Sub-Spacecraft Point</span>
        <span className="text-[9px] font-mono text-cyan">{region}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="text-[9px] font-mono text-text-muted uppercase">Lat</div>
          <div className="text-[10px] font-mono font-bold text-text-primary tabular-nums">
            {formatCoord(geo.lat, "N", "S")}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-mono text-text-muted uppercase">Lon</div>
          <div className="text-[10px] font-mono font-bold text-text-primary tabular-nums">
            {formatCoord(geo.lon, "E", "W")}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-mono text-text-muted uppercase">Alt</div>
          <div className="text-[10px] font-mono font-bold text-text-primary tabular-nums">
            {geo.alt >= 1e6 ? `${(geo.alt / 1e6).toFixed(1)}M` : geo.alt >= 1000 ? `${(geo.alt / 1000).toFixed(0)}k` : Math.round(geo.alt).toLocaleString()} km
          </div>
        </div>
      </div>

      {/* Angular sizes */}
      <AngularSizes distEarthKm={state.distanceFromEarthKm} distMoonKm={state.distanceFromMoonKm} />
    </div>
  );
}

function AngularSizes({ distEarthKm, distMoonKm }: { distEarthKm: number; distMoonKm: number }) {
  // Angular diameter = 2 * arctan(radius / distance) → degrees
  const earthAngDeg = 2 * Math.atan(6371 / distEarthKm) * (180 / Math.PI);
  const moonAngDeg = 2 * Math.atan(1737 / distMoonKm) * (180 / Math.PI);

  // From Earth surface, Moon is ~0.5°
  const earthAngStr = earthAngDeg >= 1 ? `${earthAngDeg.toFixed(1)}°` : `${(earthAngDeg * 60).toFixed(1)}'`;
  const moonAngStr = moonAngDeg >= 1 ? `${moonAngDeg.toFixed(1)}°` : `${(moonAngDeg * 60).toFixed(1)}'`;

  return (
    <div className="flex items-center gap-4 pt-1 border-t border-space-border/15">
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-mono text-text-muted uppercase">Earth</span>
        <span className="text-[9px] font-mono font-bold text-cyan tabular-nums">{earthAngStr}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-mono text-text-muted uppercase">Moon</span>
        <span className="text-[9px] font-mono font-bold text-text-primary tabular-nums">{moonAngStr}</span>
      </div>
      <span className="text-[9px] font-mono text-text-muted/40 ml-auto">angular size</span>
    </div>
  );
}
