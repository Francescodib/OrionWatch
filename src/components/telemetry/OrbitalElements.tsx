import type { SpacecraftState } from "@/data/targets/types";

interface OrbitalElementsProps {
  state: SpacecraftState;
}

const MU_EARTH = 398600.4418; // km³/s² — Earth gravitational parameter

function computeElements(state: SpacecraftState) {
  const [x, y, z] = state.positionKm;
  const [vx, vy, vz] = state.velocityKmS;

  const r = Math.sqrt(x * x + y * y + z * z);
  const v = Math.sqrt(vx * vx + vy * vy + vz * vz);

  // Specific orbital energy
  const energy = (v * v) / 2 - MU_EARTH / r;

  // Semi-major axis
  const sma = -MU_EARTH / (2 * energy);

  // Angular momentum vector h = r × v
  const hx = y * vz - z * vy;
  const hy = z * vx - x * vz;
  const hz = x * vy - y * vx;
  const h = Math.sqrt(hx * hx + hy * hy + hz * hz);

  // Eccentricity vector
  const ex = (vy * hz - vz * hy) / MU_EARTH - x / r;
  const ey = (vz * hx - vx * hz) / MU_EARTH - y / r;
  const ez = (vx * hy - vy * hx) / MU_EARTH - z / r;
  const ecc = Math.sqrt(ex * ex + ey * ey + ez * ez);

  // Inclination
  const inc = Math.acos(hz / h) * (180 / Math.PI);

  // Orbital period (only for elliptic orbits)
  const period = sma > 0 ? 2 * Math.PI * Math.sqrt((sma * sma * sma) / MU_EARTH) : null;

  // Apoapsis and periapsis
  const periapsis = sma > 0 ? sma * (1 - ecc) : r; // current radius for hyperbolic
  const apoapsis = ecc < 1 && sma > 0 ? sma * (1 + ecc) : null;

  // Altitude (above Earth surface, 6371 km radius)
  const altitude = r - 6371;
  const periAlt = periapsis - 6371;
  const apoAlt = apoapsis ? apoapsis - 6371 : null;

  return {
    sma: Math.abs(sma),
    ecc,
    inc,
    period,
    altitude,
    periAlt,
    apoAlt,
    orbitType: ecc >= 1 ? "HYPERBOLIC" : ecc > 0.01 ? "ELLIPTIC" : "CIRCULAR",
  };
}

function formatKm(km: number): string {
  if (!Number.isFinite(km)) return "—";
  if (Math.abs(km) >= 1e6) return `${(km / 1e6).toFixed(1)}M`;
  if (Math.abs(km) >= 1e3) return `${(km / 1e3).toFixed(0)}k`;
  return Math.round(km).toLocaleString("en-US");
}

function formatPeriod(sec: number | null): string {
  if (sec == null || !Number.isFinite(sec)) return "—";
  const h = sec / 3600;
  if (h >= 24) return `${(h / 24).toFixed(1)}d`;
  if (h >= 1) return `${h.toFixed(1)}h`;
  return `${(sec / 60).toFixed(0)}m`;
}

export function OrbitalElements({ state }: OrbitalElementsProps) {
  const el = computeElements(state);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-heading uppercase tracking-[0.12em] text-text-muted">Orbit Type</span>
        <span className="text-[9px] font-mono font-bold text-cyan">{el.orbitType}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <Row label="Altitude" value={`${formatKm(el.altitude)} km`} />
        <Row label="Inclination" value={`${el.inc.toFixed(1)}°`} />
        <Row label="Eccentricity" value={el.ecc.toFixed(4)} />
        <Row label="Period" value={formatPeriod(el.period)} />
        <Row label="Periapsis" value={`${formatKm(el.periAlt)} km`} />
        <Row label="Apoapsis" value={el.apoAlt != null ? `${formatKm(el.apoAlt)} km` : "∞"} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span className="text-[7px] font-mono text-text-muted uppercase">{label}</span>
      <span className="text-[9px] font-mono font-bold text-text-primary tabular-nums">{value}</span>
    </div>
  );
}
