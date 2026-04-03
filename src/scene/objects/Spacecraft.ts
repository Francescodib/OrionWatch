import * as THREE from 'three';
import { eciToScene } from '../utils/coordinates';

/**
 * Spacecraft marker with:
 * - Elongated capsule oriented along velocity
 * - Permanent cockpit-style ring (always visible, yellow)
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

  // ---- Cockpit ring (always visible) ----
  private readonly ringGeometry: THREE.RingGeometry;
  private readonly ringMaterial: THREE.MeshBasicMaterial;
  private readonly ringMesh: THREE.Mesh;

  // ---- Locate highlight (pulsing outer ring) ----
  private readonly highlightGeometry: THREE.RingGeometry;
  private readonly highlightMaterial: THREE.MeshBasicMaterial;
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

    this.light = new THREE.PointLight(0x00d4ff, 1, 5);

    // Permanent cockpit ring — thin, always visible
    this.ringGeometry = new THREE.RingGeometry(0.6, 0.7, 32);
    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.ringMesh = new THREE.Mesh(this.ringGeometry, this.ringMaterial);

    // Locate highlight — larger, pulsing
    this.highlightGeometry = new THREE.RingGeometry(1.0, 1.3, 32);
    this.highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.highlightMesh = new THREE.Mesh(this.highlightGeometry, this.highlightMaterial);

    this.group = new THREE.Group();
    this.group.add(this.mesh);
    this.group.add(this.light);
    this.group.add(this.ringMesh);
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

    // Billboard: both rings face camera
    if (camera) {
      this.ringMesh.quaternion.copy(camera.quaternion);
      this.highlightMesh.quaternion.copy(camera.quaternion);
    }

    // Cockpit ring gentle pulse
    this.ringMaterial.opacity = 0.3 + 0.15 * Math.sin(performance.now() * 0.002);

    // Locate highlight animation
    if (this.highlightActive) {
      this.highlightProgress += 1 / 120;
      if (this.highlightProgress >= 1) {
        this.highlightActive = false;
        this.highlightProgress = 0;
        this.highlightMaterial.opacity = 0;
      } else {
        this.highlightMaterial.opacity = 0.8 * Math.sin(this.highlightProgress * Math.PI);
      }
    }
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.ringGeometry.dispose();
    this.ringMaterial.dispose();
    this.highlightGeometry.dispose();
    this.highlightMaterial.dispose();
    this.light.dispose();
    this.group.clear();
  }
}
