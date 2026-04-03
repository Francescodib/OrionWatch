import * as THREE from 'three';
import { eciToScene } from '../utils/coordinates';

const TRAIL_LENGTH = 20;
const PARTICLE_COUNT = 30;

/**
 * Premium spacecraft marker:
 * - Glowing sphere core with additive halo
 * - Sprite visible from any distance
 * - Luminous trail behind the craft
 * - Sparkle particles
 * - Targeting reticle (distance-adaptive)
 */
export class SpacecraftObject {
  readonly group: THREE.Group;

  // ---- Core body ----
  private readonly coreGeo: THREE.SphereGeometry;
  private readonly coreMat: THREE.MeshStandardMaterial;
  private readonly coreMesh: THREE.Mesh;

  // ---- Glow shell (additive) ----
  private readonly glowGeo: THREE.SphereGeometry;
  private readonly glowMat: THREE.MeshBasicMaterial;
  private readonly glowMesh: THREE.Mesh;

  // ---- Halo sprite (visible from afar) ----
  private readonly haloSprite: THREE.Sprite;
  private readonly haloMat: THREE.SpriteMaterial;
  private readonly haloTexture: THREE.CanvasTexture;

  // ---- Lights ----
  private readonly light: THREE.PointLight;
  private readonly fillLight: THREE.PointLight;

  // ---- Trail ----
  private readonly trailGeo: THREE.BufferGeometry;
  private readonly trailMat: THREE.LineBasicMaterial;
  private readonly trailLine: THREE.Line;
  private readonly trailPositions: Float32Array;
  private readonly trailColors: Float32Array;
  private trailIndex = 0;

  // ---- Sparkle particles ----
  private readonly particleGeo: THREE.BufferGeometry;
  private readonly particleMat: THREE.PointsMaterial;
  private readonly particles: THREE.Points;
  private readonly particleOffsets: Float32Array;
  private readonly particlePhases: Float32Array;

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
    // ---- Core sphere ----
    this.coreGeo = new THREE.SphereGeometry(0.3, 16, 16);
    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0xaaeeff,
      emissive: 0x00d4ff,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.8,
    });
    this.coreMesh = new THREE.Mesh(this.coreGeo, this.coreMat);

    // ---- Glow shell ----
    this.glowGeo = new THREE.SphereGeometry(0.5, 16, 16);
    this.glowMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.glowMesh = new THREE.Mesh(this.glowGeo, this.glowMat);

    // ---- Halo sprite (radial gradient, visible from far) ----
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
    grad.addColorStop(0.2, 'rgba(0, 212, 255, 0.4)');
    grad.addColorStop(0.5, 'rgba(0, 180, 255, 0.1)');
    grad.addColorStop(1, 'rgba(0, 150, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    this.haloTexture = new THREE.CanvasTexture(canvas);
    this.haloMat = new THREE.SpriteMaterial({
      map: this.haloTexture,
      color: 0x00d4ff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.haloSprite = new THREE.Sprite(this.haloMat);
    this.haloSprite.scale.set(4, 4, 1);

    // ---- Lights ----
    this.light = new THREE.PointLight(0x00d4ff, 3, 40);
    this.fillLight = new THREE.PointLight(0xffffff, 0.5, 15);

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
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.trailLine = new THREE.Line(this.trailGeo, this.trailMat);
    this.trailLine.frustumCulled = false;

    // ---- Sparkle particles ----
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    this.particleOffsets = new Float32Array(PARTICLE_COUNT * 3);
    this.particlePhases = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.particleOffsets[i * 3] = (Math.random() - 0.5) * 3;
      this.particleOffsets[i * 3 + 1] = (Math.random() - 0.5) * 3;
      this.particleOffsets[i * 3 + 2] = (Math.random() - 0.5) * 3;
      this.particlePhases[i] = Math.random() * Math.PI * 2;
      particlePositions[i * 3] = this.particleOffsets[i * 3]!;
      particlePositions[i * 3 + 1] = this.particleOffsets[i * 3 + 1]!;
      particlePositions[i * 3 + 2] = this.particleOffsets[i * 3 + 2]!;
    }
    this.particleGeo = new THREE.BufferGeometry();
    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));
    this.particleMat = new THREE.PointsMaterial({
      color: 0xaaddff,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.particles = new THREE.Points(this.particleGeo, this.particleMat);

    // ---- Reticle rings (unchanged) ----
    this.innerRingGeo = new THREE.RingGeometry(1.2, 1.4, 32);
    this.innerRingMat = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
    this.innerRingMesh = new THREE.Mesh(this.innerRingGeo, this.innerRingMat);

    this.outerRingGeo = new THREE.RingGeometry(2.8, 3.0, 48);
    this.outerRingMat = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false });
    this.outerRingMesh = new THREE.Mesh(this.outerRingGeo, this.outerRingMat);

    this.highlightGeo = new THREE.RingGeometry(4.0, 5.0, 48);
    this.highlightMat = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    this.highlightMesh = new THREE.Mesh(this.highlightGeo, this.highlightMat);

    // ---- Assemble group ----
    this.group = new THREE.Group();
    this.group.add(this.coreMesh);
    this.group.add(this.glowMesh);
    this.group.add(this.haloSprite);
    this.group.add(this.light);
    this.group.add(this.fillLight);
    this.group.add(this.particles);
    this.group.add(this.innerRingMesh);
    this.group.add(this.outerRingMesh);
    this.group.add(this.highlightMesh);
    // Trail is in world space, added to scene by SceneCore
  }

  /** The trail line must be added to the scene root (not the group). */
  get trail(): THREE.Line {
    return this.trailLine;
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

    // Update trail — shift everything back, add new point at end
    if (this.trailIndex < TRAIL_LENGTH) {
      // Still filling
      const off = this.trailIndex * 3;
      this.trailPositions[off] = sx;
      this.trailPositions[off + 1] = sy;
      this.trailPositions[off + 2] = sz;
      this.trailIndex++;
    } else {
      // Shift left, add to end
      this.trailPositions.copyWithin(0, 3);
      const off = (TRAIL_LENGTH - 1) * 3;
      this.trailPositions[off] = sx;
      this.trailPositions[off + 1] = sy;
      this.trailPositions[off + 2] = sz;
    }

    // Update colors (fade from dark to cyan)
    const count = this.trailIndex;
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 1;
      this.trailColors[i * 3] = t * 0;
      this.trailColors[i * 3 + 1] = t * 0.83;
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

    // Glow pulse
    this.glowMat.opacity = 0.12 + 0.06 * Math.sin(t * 2);
    this.haloSprite.material.opacity = 0.3 + 0.15 * Math.sin(t * 1.5);

    // Sparkle particles — gentle Brownian motion
    const posAttr = this.particleGeo.getAttribute('position') as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phase = this.particlePhases[i]!;
      const ox = this.particleOffsets[i * 3]!;
      const oy = this.particleOffsets[i * 3 + 1]!;
      const oz = this.particleOffsets[i * 3 + 2]!;
      pos[i * 3] = ox + Math.sin(t * 0.5 + phase) * 0.3;
      pos[i * 3 + 1] = oy + Math.cos(t * 0.7 + phase * 1.3) * 0.3;
      pos[i * 3 + 2] = oz + Math.sin(t * 0.4 + phase * 0.7) * 0.3;
    }
    posAttr.needsUpdate = true;
    this.particleMat.opacity = 0.4 + 0.3 * Math.sin(t * 3);

    // Billboard + distance-adaptive scale for reticle rings
    if (camera) {
      const camWorldQuat = camera.quaternion;
      const groupWorldQuat = this.group.quaternion.clone().invert();
      const localQuat = groupWorldQuat.multiply(camWorldQuat);
      this.innerRingMesh.quaternion.copy(localQuat);
      this.outerRingMesh.quaternion.copy(localQuat);
      this.highlightMesh.quaternion.copy(localQuat);

      const dist = camera.position.distanceTo(this.group.position);
      const scale = Math.max(1, dist / 30);
      this.innerRingMesh.scale.setScalar(scale);
      this.outerRingMesh.scale.setScalar(scale);
      this.highlightMesh.scale.setScalar(scale);

      // Halo sprite also scales with distance
      const haloScale = Math.max(4, dist / 8);
      this.haloSprite.scale.set(haloScale, haloScale, 1);
    }

    // Ring pulse
    this.innerRingMat.opacity = 0.4 + 0.2 * Math.sin(t * 2);
    this.outerRingMat.opacity = 0.2 + 0.1 * Math.sin(t * 2 + 1);

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
    this.particleGeo.dispose();
    this.particleMat.dispose();
    this.innerRingGeo.dispose();
    this.innerRingMat.dispose();
    this.outerRingGeo.dispose();
    this.outerRingMat.dispose();
    this.highlightGeo.dispose();
    this.highlightMat.dispose();
    this.light.dispose();
    this.fillLight.dispose();
    this.group.clear();
  }
}
