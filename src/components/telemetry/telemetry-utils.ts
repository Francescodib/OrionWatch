import type { SpacecraftState, Milestone } from "@/data/targets/types";

export function formatDistance(km: number): { value: string; unit: string } {
  if (!Number.isFinite(km)) return { value: "—", unit: "" };
  if (km >= 1e9) return { value: (km / 1e9).toFixed(2), unit: "B km" };
  if (km >= 1e6) return { value: (km / 1e6).toFixed(2), unit: "M km" };
  return { value: Math.round(km).toLocaleString("en-US"), unit: "km" };
}

export function formatSignalDelay(distKm: number): { value: string; unit: string } {
  if (!Number.isFinite(distKm)) return { value: "—", unit: "" };
  const sec = distKm / 299792.458;
  if (sec >= 3600) return { value: (sec / 3600).toFixed(1), unit: "hr" };
  if (sec >= 60) return { value: (sec / 60).toFixed(1), unit: "min" };
  if (sec >= 1) return { value: sec.toFixed(2), unit: "sec" };
  return { value: (sec * 1000).toFixed(0), unit: "ms" };
}

export function getMachNumber(speedKmS: number): string {
  if (!Number.isFinite(speedKmS)) return "—";
  const mach = (speedKmS * 1000) / 343;
  if (mach >= 100) return Math.round(mach).toLocaleString("en-US");
  if (mach >= 10) return mach.toFixed(1);
  return mach.toFixed(2);
}

export function getCurrentPhase(milestones: Milestone[]): { current: string; next?: Milestone } {
  if (milestones.length === 0) return { current: "ACTIVE" };
  const now = Date.now();
  let lastIdx = -1;
  for (let i = 0; i < milestones.length; i++) {
    if (milestones[i]!.completed || new Date(milestones[i]!.timestamp).getTime() <= now) {
      lastIdx = i;
    }
  }
  if (lastIdx === -1) return { current: "PRE-LAUNCH", next: milestones[0] };
  if (lastIdx === milestones.length - 1) return { current: milestones[lastIdx]!.label };
  const next = milestones[lastIdx + 1]!;
  return { current: milestones[lastIdx]!.label, next };
}

export function getMissionProgress(launch: string, splashdown?: string): number | null {
  if (!splashdown) return null;
  const launchMs = new Date(launch).getTime();
  const splashMs = new Date(splashdown).getTime();
  const now = Date.now();
  const total = splashMs - launchMs;
  if (total <= 0) return null;
  return Math.min(100, Math.max(0, ((now - launchMs) / total) * 100));
}

export function getCumulativeDistance(history: SpacecraftState[]): number {
  let total = 0;
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1]!.positionKm;
    const curr = history[i]!.positionKm;
    const dx = curr[0] - prev[0];
    const dy = curr[1] - prev[1];
    const dz = curr[2] - prev[2];
    total += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return total;
}

export function getGForce(history: SpacecraftState[]): string {
  if (history.length < 2) return "< 0.001";
  const prev = history[history.length - 2]!;
  const curr = history[history.length - 1]!;
  const dt = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000;
  if (dt <= 0) return "< 0.001";
  const dv = Math.abs(curr.speedKmS - prev.speedKmS);
  const g = (dv * 1000) / dt / 9.81;
  if (g < 0.001) return "< 0.001";
  if (g < 0.1) return g.toFixed(3);
  return g.toFixed(2);
}

export function formatEta(ms: number): string {
  if (ms <= 0) return "NOW";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  return `${h}h ${m}m`;
}
