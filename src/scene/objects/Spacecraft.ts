import * as THREE from 'three';
import { eciToScene } from '../utils/coordinates';

/**
 * Spacecraft marker with:
 * - Elongated capsule oriented along velocity
 * - Large permanent targeting reticle (always visible even at wide zoom)
 * - Point light for glow
 * - Locate highlight pulse on demand
 */
export class SpacecraftObject {
  readonly group: THREE.Group;

  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.MeshStandardMaterial;
  private readonly geometry: THREE.CapsuleGeometry;
  private readonly light: THREE.PointLight;
  private previousPosition = new THREE.Vector3();
  private hasVelocity = false;

  // ---- Targeting reticle (always visible) ----
  private readonly innerRingGeo: THREE.RingGeometry;
  private readonly innerRingMat: THREE.MeshBasicMaterial;
  private readonly innerRingMesh: THREE.Mesh;
  private readonly outerRingGeo: THREE.RingGeometry;
  private readonly outerRingMat: THREE.MeshBasicMaterial;
  private readonly outerRingMesh: THREE.Mesh;

  // ---- Locate highlight (pulsing) ----
  private readonly highlightGeo: THREE.RingGeometry;
  private readonly highlightMat: THREE.MeshBasicMaterial;
  private readonly highlightMesh: THREE.Mesh;
  private highlightProgress = 0;
  private highlightActive = false;

  constructor() {
    this.geometry = new THREE.CapsuleGeometry(0.2, 0.6, 4, 8);
    this.material = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.6,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.x = Math.PI / 2;

    // Brighter, longer-range light
    this.light = new THREE.PointLight(0x00d4ff, 2, 20);

    // Inner reticle ring — compact, bright
    this.innerRingGeo = new THREE.RingGeometry(1.2, 1.4, 32);
    this.innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.innerRingMesh = new THREE.Mesh(this.innerRingGeo, this.innerRingMat);

    // Outer reticle ring — large, visible from afar
    this.outerRingGeo = new THREE.RingGeometry(2.8, 3.0, 48);
    this.outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.outerRingMesh = new THREE.Mesh(this.outerRingGeo, this.outerRingMat);

    // Locate highlight — very large pulsing ring
    this.highlightGeo = new THREE.RingGeometry(4.0, 5.0, 48);
    this.highlightMat = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.highlightMesh = new THREE.Mesh(this.highlightGeo, this.highlightMat);

    this.group = new THREE.Group();
    this.group.add(this.mesh);
    this.group.add(this.light);
    this.group.add(this.innerRingMesh);
    this.group.add(this.outerRingMesh);
    this.group.add(this.highlightMesh);
  }

  updatePosition(positionKm: [number, number, number], compressed: boolean): void {
    const [sx, sy, sz] = eciToScene(positionKm, compressed);
    const newPos = new THREE.Vector3(sx, sy, sz);

    const delta = new THREE.Vector3().subVectors(newPos, this.previousPosition);
    if (delta.lengthSq() > 0.001) {
      const target = new THREE.Vector3().addVectors(newPos, delta.normalize());
      const lookMatrix = new THREE.Matrix4().lookAt(newPos, target, new THREE.Vector3(0, 1, 0));
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);
      this.group.quaternion.slerp(targetQuat, 0.1);
      this.hasVelocity = true;
    }

    this.previousPosition.copy(newPos);
    this.group.position.copy(newPos);
  }

  highlight(): void {
    this.highlightActive = true;
    this.highlightProgress = 0;
  }

  update(camera?: THREE.Camera): void {
    if (!this.hasVelocity) {
      this.mesh.rotation.y += 0.01;
    }

    // Billboard: all rings face camera
    if (camera) {
      this.innerRingMesh.quaternion.copy(camera.quaternion);
      this.outerRingMesh.quaternion.copy(camera.quaternion);
      this.highlightMesh.quaternion.copy(camera.quaternion);
    }

    // Gentle pulse on rings
    const t = performance.now() * 0.002;
    this.innerRingMat.opacity = 0.4 + 0.2 * Math.sin(t);
    this.outerRingMat.opacity = 0.2 + 0.1 * Math.sin(t + 1);

    // Locate highlight animation
    if (this.highlightActive) {
      this.highlightProgress += 1 / 120;
      if (this.highlightProgress >= 1) {
        this.highlightActive = false;
        this.highlightProgress = 0;
        this.highlightMat.opacity = 0;
      } else {
        this.highlightMat.opacity = 0.8 * Math.sin(this.highlightProgress * Math.PI);
      }
    }
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.innerRingGeo.dispose();
    this.innerRingMat.dispose();
    this.outerRingGeo.dispose();
    this.outerRingMat.dispose();
    this.highlightGeo.dispose();
    this.highlightMat.dispose();
    this.light.dispose();
    this.group.clear();
  }
}
