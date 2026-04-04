import * as THREE from 'three';
import { detectPerformanceTier, MOON_SEGMENTS } from '../utils/lod';
import { eciToScene } from '../utils/coordinates';

/**
 * Simplified analytical Moon orbit for the 3D scene.
 *
 * Uses a circular approximation with real orbital period.
 * Good enough for a dashboard visualisation -- not ephemeris-grade.
 */
const MOON_ORBIT_RADIUS_KM = 384_400;
const MOON_ORBITAL_PERIOD_MS = 27.32 * 24 * 60 * 60 * 1000; // ~27.32 days in ms

/** Arbitrary epoch aligned to J2000 for the Moon's position. */
const MOON_EPOCH = new Date('2000-01-06T00:00:00Z').getTime();

export class MoonObject {
  readonly group: THREE.Group;
  /** Orbit ring is added to the scene root, not the moon group (it stays at origin). */
  readonly orbitRing: THREE.Line;

  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.MeshPhongMaterial;
  private readonly geometry: THREE.SphereGeometry;
  private readonly orbitGeometry: THREE.BufferGeometry;
  private readonly orbitMaterial: THREE.LineDashedMaterial;

  /** Radius in scene units (1 unit = 1 000 km). */
  static readonly RADIUS = 1.737;

  constructor() {
    const tier = detectPerformanceTier();
    const segments = MOON_SEGMENTS[tier];

    this.geometry = new THREE.SphereGeometry(MoonObject.RADIUS, segments, segments);
    this.material = new THREE.MeshPhongMaterial({
      color: 0x888888,
      shininess: 5,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.group = new THREE.Group();
    this.group.add(this.mesh);

    // ---- Orbit ring ----
    this.orbitGeometry = new THREE.BufferGeometry();
    this.orbitMaterial = new THREE.LineDashedMaterial({
      color: 0x445566,
      dashSize: 2,
      gapSize: 1.5,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.orbitRing = new THREE.Line(this.orbitGeometry, this.orbitMaterial);
    this.orbitRing.frustumCulled = false;
  }

  /**
   * Asynchronously load the Moon texture.  Gray fallback until loaded.
   */
  loadTexture(): void {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("");
    loader.load(
      `${import.meta.env.BASE_URL || "/"}textures/moon_2k.jpg`,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        this.material.map = texture;
        this.material.color.set(0xffffff);
        this.material.needsUpdate = true;
      },
      undefined,
      () => {
        // Texture load failed -- keep fallback colour.
      },
    );
  }

  /**
   * Build or rebuild the orbit ring geometry for the current compression mode.
   */
  buildOrbitRing(compressed: boolean): void {
    const SEGMENTS = 128;
    const inclination = 5.14 * (Math.PI / 180);
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= SEGMENTS; i++) {
      const a = (i / SEGMENTS) * Math.PI * 2;
      const xKm = MOON_ORBIT_RADIUS_KM * Math.cos(a);
      const yKm = MOON_ORBIT_RADIUS_KM * Math.sin(a) * Math.cos(inclination);
      const zKm = MOON_ORBIT_RADIUS_KM * Math.sin(a) * Math.sin(inclination);
      const [sx, sy, sz] = eciToScene([xKm, yKm, zKm], compressed);
      points.push(new THREE.Vector3(sx, sy, sz));
    }

    this.orbitGeometry.setFromPoints(points);
    this.orbitRing.computeLineDistances(); // required for dashed material
  }

  /**
   * Update the Moon's position based on a simple circular orbit.
   *
   * The orbit is inclined ~5.14 deg to the ecliptic.  We approximate this
   * with a slight tilt on the Z axis in ECI-like coordinates.
   */
  updatePosition(date: Date, compressed: boolean): void {
    const elapsed = date.getTime() - MOON_EPOCH;
    const angle = ((elapsed % MOON_ORBITAL_PERIOD_MS) / MOON_ORBITAL_PERIOD_MS) * Math.PI * 2;

    // Slight inclination (~5 deg) so the orbit isn't perfectly flat
    const inclination = 5.14 * (Math.PI / 180);

    const xKm = MOON_ORBIT_RADIUS_KM * Math.cos(angle);
    const yKm = MOON_ORBIT_RADIUS_KM * Math.sin(angle) * Math.cos(inclination);
    const zKm = MOON_ORBIT_RADIUS_KM * Math.sin(angle) * Math.sin(inclination);

    const [sx, sy, sz] = eciToScene([xKm, yKm, zKm], compressed);
    this.group.position.set(sx, sy, sz);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.map?.dispose();
    this.material.dispose();
    this.orbitGeometry.dispose();
    this.orbitMaterial.dispose();
    this.group.clear();
  }
}
