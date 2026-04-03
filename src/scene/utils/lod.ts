/**
 * Device-capability detection for Level-of-Detail decisions.
 *
 * Low-end devices get fewer geometry segments to keep the frame rate up.
 */

export type PerformanceTier = 'high' | 'low';

/**
 * Detect whether the current device is high-end or low-end.
 * A device with fewer than 4 logical CPU cores is classified as "low".
 */
export function detectPerformanceTier(): PerformanceTier {
  const cores = navigator.hardwareConcurrency ?? 2;
  return cores < 4 ? 'low' : 'high';
}

/** Sphere segment counts per tier. */
export const EARTH_SEGMENTS: Record<PerformanceTier, number> = {
  high: 64,
  low: 32,
};

export const MOON_SEGMENTS: Record<PerformanceTier, number> = {
  high: 32,
  low: 16,
};

/** Maximum trajectory points kept in the buffer. */
export const MAX_TRAJECTORY_POINTS = 6000;
