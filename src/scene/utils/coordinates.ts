/**
 * Coordinate conversion utilities for the 3D scene.
 *
 * Convention:
 *   1 scene unit = 1 000 km
 *   Earth is at the origin.
 *
 * When `compressed` is true, distances beyond Earth's radius are
 * scaled by a compression factor so that the Moon (384 400 km) sits
 * at roughly 60 scene units instead of 384.
 */

const EARTH_RADIUS_KM = 6_371;
const KM_PER_SCENE_UNIT = 1_000;

/**
 * Compression factor applied to the radial component beyond Earth's
 * surface.  With 0.25 the Moon's 384 400 km translates to
 *   6.371 + (384.4 - 6.371) * 0.25  ~  100.9 scene units
 * which gives the trajectory loop more room to breathe.
 */
const COMPRESSION_FACTOR = 0.25;

/**
 * Convert ECI J2000 position (km) to Three.js scene coordinates.
 *
 * @param positionKm  [x, y, z] in km, Earth-centred inertial frame
 * @param compressed  Whether to apply radial compression for readability
 * @returns           [x, y, z] in scene units
 */
export function eciToScene(
  positionKm: [number, number, number],
  compressed: boolean,
): [number, number, number] {
  const [xKm, yKm, zKm] = positionKm;

  if (!compressed) {
    return [
      xKm / KM_PER_SCENE_UNIT,
      yKm / KM_PER_SCENE_UNIT,
      zKm / KM_PER_SCENE_UNIT,
    ];
  }

  // Radial distance from Earth centre
  const r = Math.sqrt(xKm * xKm + yKm * yKm + zKm * zKm);

  if (r < 1) {
    // Avoid division by zero for origin positions
    return [0, 0, 0];
  }

  const earthRadiusScene = EARTH_RADIUS_KM / KM_PER_SCENE_UNIT;

  let rScene: number;
  if (r <= EARTH_RADIUS_KM) {
    // Inside Earth (shouldn't happen, but handle gracefully)
    rScene = r / KM_PER_SCENE_UNIT;
  } else {
    // Beyond Earth's surface: compress the excess
    const excessKm = r - EARTH_RADIUS_KM;
    rScene = earthRadiusScene + (excessKm / KM_PER_SCENE_UNIT) * COMPRESSION_FACTOR;
  }

  // Preserve direction, apply new magnitude
  const scale = rScene / (r / KM_PER_SCENE_UNIT);
  return [
    (xKm / KM_PER_SCENE_UNIT) * scale,
    (yKm / KM_PER_SCENE_UNIT) * scale,
    (zKm / KM_PER_SCENE_UNIT) * scale,
  ];
}
