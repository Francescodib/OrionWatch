import * as THREE from 'three';
import { eciToScene } from '../utils/coordinates';
import { MAX_TRAJECTORY_POINTS } from '../utils/lod';

// Cyan color (newest) → dark blue (oldest)
const COLOR_NEW = new THREE.Color(0x00d4ff);
const COLOR_OLD = new THREE.Color(0x141e32);

/**
 * Trajectory trail drawn as a single Line with vertex colors that
 * fade from bright cyan (newest) to dark (oldest).
 */
export class TrajectoryLine {
  readonly line: THREE.Line;

  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.LineBasicMaterial;
  private readonly positions: Float32Array;
  private readonly colors: Float32Array;
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
