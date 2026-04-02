import * as THREE from 'three';
import { eciToScene } from '../utils/coordinates';

/**
 * Spacecraft marker rendered as an elongated capsule oriented along
 * the velocity vector, with a point light for glow.
 */
export class SpacecraftObject {
  readonly group: THREE.Group;

  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.MeshStandardMaterial;
  private readonly geometry: THREE.CapsuleGeometry;
  private readonly light: THREE.PointLight;
  private previousPosition = new THREE.Vector3();
  private hasVelocity = false;

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

    this.group = new THREE.Group();
    this.group.add(this.mesh);
    this.group.add(this.light);
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
   * Animate — gentle spin when no velocity data, otherwise hold orientation.
   */
  update(): void {
    if (!this.hasVelocity) {
      this.mesh.rotation.y += 0.01;
    }
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.light.dispose();
    this.group.clear();
  }
}
