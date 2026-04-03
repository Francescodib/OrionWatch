import * as THREE from 'three';
import { eciToScene } from '../utils/coordinates';
import { MAX_TRAJECTORY_POINTS } from '../utils/lod';

/** Gradient: deep blue (oldest) → full cyan (newest). */
const COLOR_NEW = new THREE.Color(0x00d4ff);
const COLOR_OLD = new THREE.Color(0x0a3050);

/** Earth surface in scene units (just above visual radius). */
const EARTH_SURFACE_SU = 6.5;

/** Minimum distance from Earth center — clamp interpolated points.
 *  Set above the visual Earth+atmosphere radius (~6.8 su) to prevent
 *  the spline from dipping through the globe. */
const EARTH_CLAMP_RADIUS = 8.5;

/**
 * Smooth trajectory using centripetal Catmull-Rom, then clamp any
 * interpolated points that dip inside Earth outward to the surface.
 */
function smoothPoints(raw: THREE.Vector3[], maxOutput: number): THREE.Vector3[] {
  if (raw.length < 4) return raw;

  const curve = new THREE.CatmullRomCurve3(raw, false, 'centripetal', 0.5);
  const divisions = Math.min(maxOutput, raw.length * 4);
  const points = curve.getPoints(divisions);

  // Clamp points inside Earth outward to surface
  for (const p of points) {
    const r = p.length();
    if (r > 0.1 && r < EARTH_CLAMP_RADIUS) {
      p.multiplyScalar(EARTH_CLAMP_RADIUS / r);
    }
  }

  // Smooth out any kinks created by clamping (moving average on clamped region)
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 1; i < points.length - 1; i++) {
      const r = points[i]!.length();
      // Only smooth points near the clamp radius (within 20% margin)
      if (r < EARTH_CLAMP_RADIUS * 1.2) {
        const prev = points[i - 1]!;
        const next = points[i + 1]!;
        const smoothed = new THREE.Vector3().addVectors(prev, next).multiplyScalar(0.5);
        // Re-clamp after averaging
        const sr = smoothed.length();
        if (sr > 0.1 && sr < EARTH_CLAMP_RADIUS) {
          smoothed.multiplyScalar(EARTH_CLAMP_RADIUS / sr);
        }
        points[i]!.lerp(smoothed, 0.5);
      }
    }
  }

  return points;
}

/**
 * Add a synthetic departure segment from Earth's surface to the
 * first real data point. JPL Horizons has no data before ICPS
 * separation (~28k km altitude), so without this the trajectory
 * appears to start in mid-space.
 */
function addDepartureSegment(points: THREE.Vector3[]): THREE.Vector3[] {
  if (points.length === 0) return points;

  const first = points[0]!;
  const dir = first.clone().normalize();

  // Insert 2 intermediate points from surface to first real point
  const surfacePoint = dir.clone().multiplyScalar(EARTH_SURFACE_SU);
  const midPoint = dir.clone().multiplyScalar((EARTH_SURFACE_SU + first.length()) / 2);

  return [surfacePoint, midPoint, ...points];
}

export class TrajectoryLine {
  readonly line: THREE.Line;

  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.LineBasicMaterial;
  private positions: Float32Array;
  private colors: Float32Array;
  private pointCount = 0;

  constructor() {
    this.positions = new Float32Array(MAX_TRAJECTORY_POINTS * 3);
    this.colors = new Float32Array(MAX_TRAJECTORY_POINTS * 3);

    this.geometry = new THREE.BufferGeometry();

    const posAttr = new THREE.BufferAttribute(this.positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', posAttr);

    const colorAttr = new THREE.BufferAttribute(this.colors, 3);
    colorAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('color', colorAttr);

    this.geometry.setDrawRange(0, 0);

    this.material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });

    this.line = new THREE.Line(this.geometry, this.material);
    this.line.frustumCulled = false;
  }

  private updateColors(): void {
    const tmp = new THREE.Color();
    for (let i = 0; i < this.pointCount; i++) {
      const t = this.pointCount > 1 ? i / (this.pointCount - 1) : 1;
      tmp.lerpColors(COLOR_OLD, COLOR_NEW, t);
      const offset = i * 3;
      this.colors[offset] = tmp.r;
      this.colors[offset + 1] = tmp.g;
      this.colors[offset + 2] = tmp.b;
    }
    const attr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    attr.needsUpdate = true;
  }

  addPoint(positionKm: [number, number, number], compressed: boolean): void {
    const [sx, sy, sz] = eciToScene(positionKm, compressed);

    if (this.pointCount >= MAX_TRAJECTORY_POINTS) {
      this.positions.copyWithin(0, 3);
      this.colors.copyWithin(0, 3);
      this.pointCount = MAX_TRAJECTORY_POINTS - 1;
    }

    const offset = this.pointCount * 3;
    this.positions[offset] = sx;
    this.positions[offset + 1] = sy;
    this.positions[offset + 2] = sz;
    this.pointCount++;

    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
    this.updateColors();
    this.geometry.setDrawRange(0, this.pointCount);
  }

  setPoints(historyKm: [number, number, number][], compressed: boolean): void {
    this.pointCount = 0;

    const rawPoints: THREE.Vector3[] = [];
    for (const pt of historyKm) {
      const [sx, sy, sz] = eciToScene(pt, compressed);
      rawPoints.push(new THREE.Vector3(sx, sy, sz));
    }

    // Add synthetic departure from Earth surface
    const withDeparture = addDepartureSegment(rawPoints);

    // Smooth with centripetal Catmull-Rom
    const smoothed = withDeparture.length >= 4
      ? smoothPoints(withDeparture, MAX_TRAJECTORY_POINTS)
      : withDeparture;

    const count = Math.min(smoothed.length, MAX_TRAJECTORY_POINTS);
    if (count * 3 > this.positions.length) {
      this.positions = new Float32Array(count * 3);
      this.colors = new Float32Array(count * 3);
      const posAttr = new THREE.BufferAttribute(this.positions, 3);
      posAttr.setUsage(THREE.DynamicDrawUsage);
      this.geometry.setAttribute('position', posAttr);
      const colorAttr = new THREE.BufferAttribute(this.colors, 3);
      colorAttr.setUsage(THREE.DynamicDrawUsage);
      this.geometry.setAttribute('color', colorAttr);
    }

    for (let i = 0; i < count; i++) {
      const p = smoothed[i]!;
      const offset = i * 3;
      this.positions[offset] = p.x;
      this.positions[offset + 1] = p.y;
      this.positions[offset + 2] = p.z;
    }

    this.pointCount = count;
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
    this.updateColors();
    this.geometry.setDrawRange(0, this.pointCount);
  }

  clear(): void {
    this.pointCount = 0;
    this.positions.fill(0);
    this.colors.fill(0);
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
    const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    colorAttr.needsUpdate = true;
    this.geometry.setDrawRange(0, 0);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
