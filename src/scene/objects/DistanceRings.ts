import * as THREE from 'three';
import { eciToScene } from '../utils/coordinates';

interface RingDef {
  distanceKm: number;
  color: number;
  opacity: number;
  dashSize: number;
  gapSize: number;
  label: string;
}

const RING_DEFS: RingDef[] = [
  { distanceKm: 60_000,   color: 0x334455, opacity: 0.15, dashSize: 2, gapSize: 2, label: "60k km" },
  { distanceKm: 150_000,  color: 0x334455, opacity: 0.15, dashSize: 2, gapSize: 2, label: "150k km" },
  { distanceKm: 280_000,  color: 0x334455, opacity: 0.15, dashSize: 2, gapSize: 2, label: "280k km" },
  { distanceKm: 384_400,  color: 0x445566, opacity: 0.2,  dashSize: 2, gapSize: 1.5, label: "Moon orbit" },
  { distanceKm: 400_171,  color: 0xff6b35, opacity: 0.25, dashSize: 3, gapSize: 1, label: "Apollo 13 record" },
];

const SEGMENTS = 96;

export class DistanceRings {
  readonly group: THREE.Group;
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.LineDashedMaterial[] = [];

  /** Label data for overlay (populated after buildRings) */
  labels: { x: number; y: number; z: number; text: string; color: string }[] = [];

  constructor() {
    this.group = new THREE.Group();
  }

  buildRings(compressed: boolean): void {
    // Dispose old
    this.group.clear();
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.geometries = [];
    this.materials = [];
    this.labels = [];

    for (const def of RING_DEFS) {
      const points: THREE.Vector3[] = [];

      for (let i = 0; i <= SEGMENTS; i++) {
        const angle = (i / SEGMENTS) * Math.PI * 2;
        const xKm = def.distanceKm * Math.cos(angle);
        const zKm = def.distanceKm * Math.sin(angle);
        const [sx, sy, sz] = eciToScene([xKm, 0, zKm], compressed);
        points.push(new THREE.Vector3(sx, sy, sz));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineDashedMaterial({
        color: def.color,
        dashSize: def.dashSize,
        gapSize: def.gapSize,
        transparent: true,
        opacity: def.opacity,
        depthWrite: false,
      });

      const line = new THREE.Line(geometry, material);
      line.computeLineDistances();
      line.frustumCulled = false;

      this.group.add(line);
      this.geometries.push(geometry);
      this.materials.push(material);

      // Store label position (at angle=0, slightly above the ring)
      const [lx, ly, lz] = eciToScene([def.distanceKm, 0, 0], compressed);
      const colorHex = def.color === 0xff6b35 ? "#ff6b35" : "#556677";
      this.labels.push({ x: lx, y: ly + 0.5, z: lz, text: def.label, color: colorHex });
    }
  }

  dispose(): void {
    this.group.clear();
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.geometries = [];
    this.materials = [];
  }
}
