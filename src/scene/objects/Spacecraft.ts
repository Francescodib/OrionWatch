import * as THREE from 'three';
import { eciToScene } from '../utils/coordinates';

const TRAIL_LENGTH = 20;

/**
 * Spacecraft marker — clean, professional:
 * - Capsule geometry (Orion-like shape)
 * - Additive glow shell
 * - Halo sprite for far-distance visibility
 * - Luminous trail
 * - Targeting reticle (distance-adaptive)
 */
export class SpacecraftObject {
  // ---- Pre-allocated reusable temporaries (avoid per-frame GC) ----
  private static _tmpVec = new THREE.Vector3();
  private static _tmpDelta = new THREE.Vector3();
  private static _tmpTarget = new THREE.Vector3();
  private static _tmpMat = new THREE.Matrix4();
  private static _tmpQuat = new THREE.Quaternion();
  private static _billboardQuat = new THREE.Quaternion();

  readonly group: THREE.Group;

  // ---- Core capsule ----
  private readonly coreGeo: THREE.CapsuleGeometry;
  private readonly coreMat: THREE.MeshStandardMaterial;
  private readonly coreMesh: THREE.Mesh;

  // ---- Glow shell ----
  private readonly glowGeo: THREE.SphereGeometry;
  private readonly glowMat: THREE.MeshBasicMaterial;
  private readonly glowMesh: THREE.Mesh;

  // ---- Halo sprite ----
  private readonly haloSprite: THREE.Sprite;
  private readonly haloMat: THREE.SpriteMaterial;
  private readonly haloTexture: THREE.CanvasTexture;

  // ---- Lights ----
  private readonly light: THREE.PointLight;

  // ---- Trail ----
  private readonly trailGeo: THREE.BufferGeometry;
  private readonly trailMat: THREE.LineBasicMaterial;
  private readonly trailLine: THREE.Line;
  private readonly trailPositions: Float32Array;
  private readonly trailColors: Float32Array;
  private trailIndex = 0;

  // ---- Reticle rings ----
  private readonly innerRingGeo: THREE.RingGeometry;
  private readonly innerRingMat: THREE.MeshBasicMaterial;
  private readonly innerRingMesh: THREE.Mesh;
  private readonly outerRingGeo: THREE.RingGeometry;
  private readonly outerRingMat: THREE.MeshBasicMaterial;
  private readonly outerRingMesh: THREE.Mesh;
  private readonly highlightGeo: THREE.RingGeometry;
  private readonly highlightMat: THREE.MeshBasicMaterial;
  private readonly highlightMesh: THREE.Mesh;
  private highlightProgress = 0;
  private highlightActive = false;

  private previousPosition = new THREE.Vector3();
  private hasVelocity = false;

  constructor() {
    // ---- Capsule core ----
    this.coreGeo = new THREE.CapsuleGeometry(0.2, 0.5, 4, 12);
    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0xccddff,
      emissive: 0x00aadd,
      emissiveIntensity: 1.0,
      roughness: 0.3,
      metalness: 0.7,
    });
    this.coreMesh = new THREE.Mesh(this.coreGeo, this.coreMat);
    this.coreMesh.rotation.x = Math.PI / 2;

    // ---- Glow shell ----
    this.glowGeo = new THREE.SphereGeometry(0.5, 12, 12);
    this.glowMat = new THREE.MeshBasicMaterial({
      color: 0x00bbee,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.glowMesh = new THREE.Mesh(this.glowGeo, this.glowMat);

    // ---- Halo sprite ----
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0, 200, 255, 0.6)');
    grad.addColorStop(0.3, 'rgba(0, 180, 240, 0.2)');
    grad.addColorStop(1, 'rgba(0, 150, 220, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    this.haloTexture = new THREE.CanvasTexture(canvas);
    this.haloMat = new THREE.SpriteMaterial({
      map: this.haloTexture,
      color: 0x00ccff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.haloSprite = new THREE.Sprite(this.haloMat);
    this.haloSprite.scale.set(3, 3, 1);

    // ---- Light ----
    this.light = new THREE.PointLight(0x00ccff, 2, 30);

    // ---- Trail ----
    this.trailPositions = new Float32Array(TRAIL_LENGTH * 3);
    this.trailColors = new Float32Array(TRAIL_LENGTH * 3);
    this.trailGeo = new THREE.BufferGeometry();
    this.trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3).setUsage(THREE.DynamicDrawUsage));
    this.trailGeo.setAttribute('color', new THREE.BufferAttribute(this.trailColors, 3).setUsage(THREE.DynamicDrawUsage));
    this.trailGeo.setDrawRange(0, 0);
    this.trailMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.trailLine = new THREE.Line(this.trailGeo, this.trailMat);
    this.trailLine.frustumCulled = false;

    // ---- Reticle rings ----
    this.innerRingGeo = new THREE.RingGeometry(1.2, 1.4, 32);
    this.innerRingMat = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
    this.innerRingMesh = new THREE.Mesh(this.innerRingGeo, this.innerRingMat);

    this.outerRingGeo = new THREE.RingGeometry(2.8, 3.0, 48);
    this.outerRingMat = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false });
    this.outerRingMesh = new THREE.Mesh(this.outerRingGeo, this.outerRingMat);

    this.highlightGeo = new THREE.RingGeometry(4.0, 5.0, 48);
    this.highlightMat = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    this.highlightMesh = new THREE.Mesh(this.highlightGeo, this.highlightMat);

    // ---- Assemble ----
    this.group = new THREE.Group();
    this.group.add(this.coreMesh);
    this.group.add(this.glowMesh);
    this.group.add(this.haloSprite);
    this.group.add(this.light);
    this.group.add(this.innerRingMesh);
    this.group.add(this.outerRingMesh);
    this.group.add(this.highlightMesh);
  }

  get trail(): THREE.Line {
    return this.trailLine;
  }

  updatePosition(positionKm: [number, number, number], compressed: boolean): void {
    const [sx, sy, sz] = eciToScene(positionKm, compressed);
    const newPos = SpacecraftObject._tmpVec.set(sx, sy, sz);

    const delta = SpacecraftObject._tmpDelta.subVectors(newPos, this.previousPosition);
    if (delta.lengthSq() > 0.001) {
      const target = SpacecraftObject._tmpTarget.addVectors(newPos, delta.normalize());
      const lookMatrix = SpacecraftObject._tmpMat.lookAt(newPos, target, THREE.Object3D.DEFAULT_UP);
      const targetQuat = SpacecraftObject._tmpQuat.setFromRotationMatrix(lookMatrix);
      this.group.quaternion.slerp(targetQuat, 0.1);
      this.hasVelocity = true;
    }

    this.previousPosition.copy(newPos);
    this.group.position.copy(newPos);

    // Trail: shift back, add new point
    if (this.trailIndex < TRAIL_LENGTH) {
      const off = this.trailIndex * 3;
      this.trailPositions[off] = sx;
      this.trailPositions[off + 1] = sy;
      this.trailPositions[off + 2] = sz;
      this.trailIndex++;
    } else {
      this.trailPositions.copyWithin(0, 3);
      const off = (TRAIL_LENGTH - 1) * 3;
      this.trailPositions[off] = sx;
      this.trailPositions[off + 1] = sy;
      this.trailPositions[off + 2] = sz;
    }

    const count = this.trailIndex;
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 1;
      this.trailColors[i * 3] = t * 0;
      this.trailColors[i * 3 + 1] = t * 0.78;
      this.trailColors[i * 3 + 2] = t * 1;
    }

    const posAttr = this.trailGeo.getAttribute('position') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
    const colAttr = this.trailGeo.getAttribute('color') as THREE.BufferAttribute;
    colAttr.needsUpdate = true;
    this.trailGeo.setDrawRange(0, count);
  }

  highlight(): void {
    this.highlightActive = true;
    this.highlightProgress = 0;
  }

  update(camera?: THREE.Camera): void {
    if (!this.hasVelocity) {
      this.coreMesh.rotation.y += 0.01;
    }

    const t = performance.now() * 0.001;

    // Subtle glow pulse
    this.glowMat.opacity = 0.10 + 0.04 * Math.sin(t * 2);

    // Billboard + distance-adaptive scale
    if (camera) {
      const groupWorldQuat = SpacecraftObject._tmpQuat.copy(this.group.quaternion).invert();
      const localQuat = SpacecraftObject._billboardQuat.copy(groupWorldQuat).multiply(camera.quaternion);
      this.innerRingMesh.quaternion.copy(localQuat);
      this.outerRingMesh.quaternion.copy(localQuat);
      this.highlightMesh.quaternion.copy(localQuat);

      const dist = camera.position.distanceTo(this.group.position);
      const scale = Math.max(1, dist / 30);
      this.innerRingMesh.scale.setScalar(scale);
      this.outerRingMesh.scale.setScalar(scale);
      this.highlightMesh.scale.setScalar(scale);

      const haloScale = Math.max(3, dist / 10);
      this.haloSprite.scale.set(haloScale, haloScale, 1);
    }

    // Ring pulse
    this.innerRingMat.opacity = 0.4 + 0.15 * Math.sin(t * 2);
    this.outerRingMat.opacity = 0.2 + 0.08 * Math.sin(t * 2 + 1);

    // Locate highlight
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
    this.coreGeo.dispose();
    this.coreMat.dispose();
    this.glowGeo.dispose();
    this.glowMat.dispose();
    this.haloTexture.dispose();
    this.haloMat.dispose();
    this.trailGeo.dispose();
    this.trailMat.dispose();
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
