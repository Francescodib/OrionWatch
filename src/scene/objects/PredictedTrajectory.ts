import * as THREE from 'three';
import { eciToScene } from '../utils/coordinates';
import { MAX_TRAJECTORY_POINTS } from '../utils/lod';

const EARTH_SURFACE_SU = 6.5;
const EARTH_CLAMP_RADIUS = 8.5;

function smoothPoints(raw: THREE.Vector3[], maxOutput: number): THREE.Vector3[] {
  if (raw.length < 4) return raw;
  const curve = new THREE.CatmullRomCurve3(raw, false, 'centripetal', 0.5);
  const divisions = Math.min(maxOutput, raw.length * 4);
  const points = curve.getPoints(divisions);

  for (const p of points) {
    const r = p.length();
    if (r > 0.1 && r < EARTH_CLAMP_RADIUS) {
      p.multiplyScalar(EARTH_CLAMP_RADIUS / r);
    }
  }

  for (let pass = 0; pass < 3; pass++) {
    for (let i = 1; i < points.length - 1; i++) {
      const r = points[i]!.length();
      if (r < EARTH_CLAMP_RADIUS * 1.2) {
        const prev = points[i - 1]!;
        const next = points[i + 1]!;
        const smoothed = new THREE.Vector3().addVectors(prev, next).multiplyScalar(0.5);
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
 * Add a synthetic arrival segment from the last real data point
 * down to Earth's surface (for the return/splashdown leg).
 */
function addArrivalSegment(points: THREE.Vector3[]): THREE.Vector3[] {
  if (points.length === 0) return points;

  const last = points[points.length - 1]!;
  const dir = last.clone().normalize();

  const midPoint = dir.clone().multiplyScalar((EARTH_SURFACE_SU + last.length()) / 2);
  const surfacePoint = dir.clone().multiplyScalar(EARTH_SURFACE_SU);

  return [...points, midPoint, surfacePoint];
}

export class PredictedTrajectoryLine {
  readonly line: THREE.Line;

  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.LineDashedMaterial;
  private positions: Float32Array;
  private pointCount = 0;

  constructor() {
    this.positions = new Float32Array(MAX_TRAJECTORY_POINTS * 3);

    this.geometry = new THREE.BufferGeometry();
    const attribute = new THREE.BufferAttribute(this.positions, 3);
    attribute.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', attribute);
    this.geometry.setDrawRange(0, 0);

    this.material = new THREE.LineDashedMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      dashSize: 0.8,
      gapSize: 0.4,
    });

    this.line = new THREE.Line(this.geometry, this.material);
    this.line.frustumCulled = false;
  }

  setPoints(historyKm: [number, number, number][], compressed: boolean): void {
    this.pointCount = 0;

    const rawPoints: THREE.Vector3[] = [];
    for (const pt of historyKm) {
      const [sx, sy, sz] = eciToScene(pt, compressed);
      rawPoints.push(new THREE.Vector3(sx, sy, sz));
    }

    // Add synthetic arrival to Earth surface (splashdown)
    const withArrival = addArrivalSegment(rawPoints);

    const smoothed = withArrival.length >= 4
      ? smoothPoints(withArrival, MAX_TRAJECTORY_POINTS)
      : withArrival;

    const count = Math.min(smoothed.length, MAX_TRAJECTORY_POINTS);
    if (count * 3 > this.positions.length) {
      this.positions = new Float32Array(count * 3);
      const attr = new THREE.BufferAttribute(this.positions, 3);
      attr.setUsage(THREE.DynamicDrawUsage);
      this.geometry.setAttribute('position', attr);
    }

    for (let i = 0; i < count; i++) {
      const p = smoothed[i]!;
      const offset = i * 3;
      this.positions[offset] = p.x;
      this.positions[offset + 1] = p.y;
      this.positions[offset + 2] = p.z;
    }

    this.pointCount = count;
    const attr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    attr.needsUpdate = true;
    this.geometry.setDrawRange(0, this.pointCount);
    this.line.computeLineDistances();
  }

  clear(): void {
    this.pointCount = 0;
    this.positions.fill(0);
    const attr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    attr.needsUpdate = true;
    this.geometry.setDrawRange(0, 0);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
