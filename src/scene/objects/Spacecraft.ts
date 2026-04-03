import * as THREE from 'three';
import { eciToScene } from '../utils/coordinates';

/**
 * Spacecraft marker rendered as an elongated capsule oriented along
 * the velocity vector, with a point light for glow and a highlight ring.
 */
export class SpacecraftObject {
  readonly group: THREE.Group;

  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.MeshStandardMaterial;
  private readonly geometry: THREE.CapsuleGeometry;
  private readonly light: THREE.PointLight;
  private previousPosition = new THREE.Vector3();
  private hasVelocity = false;

  // ---- Highlight ring ----
  private readonly ringGeometry: THREE.RingGeometry;
  private readonly ringMaterial: THREE.MeshBasicMaterial;
  private readonly ringMesh: THREE.Mesh;
  private highlightProgress = 0; // 0 = inactive, >0 = animating (0..1 range over 2s)
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
    // Orient capsule so it points forward (along Z by default)
    this.mesh.rotation.x = Math.PI / 2;

    this.light = new THREE.PointLight(0x00d4ff, 1, 5);

    // Highlight ring — billboard that faces camera
    this.ringGeometry = new THREE.RingGeometry(0.8, 1.0, 32);
    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.ringMesh = new THREE.Mesh(this.ringGeometry, this.ringMaterial);

    this.group = new THREE.Group();
    this.group.add(this.mesh);
    this.group.add(this.light);
    this.group.add(this.ringMesh);
  }

  /**
   * Set the spacecraft position from ECI coordinates.
   */
  updatePosition(positionKm: [number, number, number], compressed: boolean): void {
    const [sx, sy, sz] = eciToScene(positionKm, compressed);
    const newPos = new THREE.Vector3(sx, sy, sz);

    // Orient along velocity vector (direction of travel)
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

  /**
   * Trigger a highlight pulse — opacity fades from 0 to 0.7 and back over ~2 seconds.
   */
  highlight(): void {
    this.highlightActive = true;
    this.highlightProgress = 0;
  }

  /**
   * Animate — gentle spin when no velocity data, highlight fade, ring billboard.
   */
  update(camera?: THREE.Camera): void {
    if (!this.hasVelocity) {
      this.mesh.rotation.y += 0.01;
    }

    // Billboard: make ring face camera
    if (camera) {
      this.ringMesh.quaternion.copy(camera.quaternion);
    }

    // Highlight animation (~2 seconds at 60fps = 120 frames)
    if (this.highlightActive) {
      this.highlightProgress += 1 / 120; // ~2s at 60fps
      if (this.highlightProgress >= 1) {
        this.highlightActive = false;
        this.highlightProgress = 0;
        this.ringMaterial.opacity = 0;
      } else {
        // Sine curve: 0 -> 0.7 -> 0
        this.ringMaterial.opacity = 0.7 * Math.sin(this.highlightProgress * Math.PI);
      }
    }
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.ringGeometry.dispose();
    this.ringMaterial.dispose();
    this.light.dispose();
    this.group.clear();
  }
}
