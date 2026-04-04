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
  { distanceKm: 60_000,   color: 0x445566, opacity: 0.25, dashSize: 2,   gapSize: 2,   label: "60k km" },
  { distanceKm: 150_000,  color: 0x445566, opacity: 0.25, dashSize: 2,   gapSize: 2,   label: "150k km" },
  { distanceKm: 280_000,  color: 0x445566, opacity: 0.25, dashSize: 2,   gapSize: 2,   label: "280k km" },
  { distanceKm: 384_400,  color: 0x556677, opacity: 0.3,  dashSize: 2.5, gapSize: 1.5, label: "Moon orbit" },
  { distanceKm: 400_171,  color: 0xff6b35, opacity: 0.35, dashSize: 3,   gapSize: 1,   label: "Apollo 13 record" },
];

const SEGMENTS = 128;

export class DistanceRings {
  readonly group: THREE.Group;
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.LineDashedMaterial[] = [];

  /** Normal of the orbital plane (set from Moon data). */
  private planeNormal = new THREE.Vector3(0, 1, 0);
  /** One axis in the plane. */
  private planeAxisX = new THREE.Vector3(1, 0, 0);
  /** Other axis in the plane. */
  private planeAxisY = new THREE.Vector3(0, 0, 1);

  /** Label data for overlay (populated after buildRings) */
  labels: { x: number; y: number; z: number; text: string; color: string }[] = [];

  constructor() {
    this.group = new THREE.Group();
  }

  /**
   * Set the orbital plane from two Moon positions (km).
   * The plane is defined by the cross product of the two position vectors.
   */
  setOrbitalPlaneFromMoonPositions(pos1Km: [number, number, number], pos2Km: [number, number, number]): void {
    const v1 = new THREE.Vector3(pos1Km[0], pos1Km[1], pos1Km[2]);
    const v2 = new THREE.Vector3(pos2Km[0], pos2Km[1], pos2Km[2]);

    // Normal = cross product of two position vectors
    this.planeNormal.crossVectors(v1, v2).normalize();

    // Build orthonormal basis in the plane
    this.planeAxisX.copy(v1).normalize();
    this.planeAxisY.crossVectors(this.planeNormal, this.planeAxisX).normalize();
  }

  buildRings(compressed: boolean): void {
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

        // Generate point on the orbital plane using the basis vectors
        const xKm = def.distanceKm * (this.planeAxisX.x * Math.cos(angle) + this.planeAxisY.x * Math.sin(angle));
        const yKm = def.distanceKm * (this.planeAxisX.y * Math.cos(angle) + this.planeAxisY.y * Math.sin(angle));
        const zKm = def.distanceKm * (this.planeAxisX.z * Math.cos(angle) + this.planeAxisY.z * Math.sin(angle));

        const [sx, sy, sz] = eciToScene([xKm, yKm, zKm], compressed);
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

      // Label at angle=0 on the ring
      const lxKm = def.distanceKm * this.planeAxisX.x;
      const lyKm = def.distanceKm * this.planeAxisX.y;
      const lzKm = def.distanceKm * this.planeAxisX.z;
      const [lx, ly, lz] = eciToScene([lxKm, lyKm, lzKm], compressed);
      const colorHex = def.color === 0xff6b35 ? "#ff6b35" : "#667788";
      this.labels.push({ x: lx, y: ly + 0.8, z: lz, text: def.label, color: colorHex });
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
