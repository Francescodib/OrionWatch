import * as THREE from 'three';
import { eciToScene } from '../utils/coordinates';
import { MAX_TRAJECTORY_POINTS } from '../utils/lod';

/**
 * Predicted (future) trajectory rendered as a dashed line.
 * Same buffer strategy as TrajectoryLine but with dashed material.
 */
export class PredictedTrajectoryLine {
  readonly line: THREE.Line;

  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.LineDashedMaterial;
  private readonly positions: Float32Array;
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

    const count = Math.min(historyKm.length, MAX_TRAJECTORY_POINTS);
    for (let i = 0; i < count; i++) {
      const pt = historyKm[i]!;
      const [sx, sy, sz] = eciToScene(pt, compressed);
      const offset = i * 3;
      this.positions[offset] = sx;
      this.positions[offset + 1] = sy;
      this.positions[offset + 2] = sz;
    }

    this.pointCount = count;
    const attr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    attr.needsUpdate = true;
    this.geometry.setDrawRange(0, this.pointCount);

    // Required for dashed material to work correctly
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
