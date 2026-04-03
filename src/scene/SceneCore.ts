import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { SpacecraftState } from '@/data/targets/types';
import { EarthObject } from './objects/Earth';
import { MoonObject } from './objects/Moon';
import { SpacecraftObject } from './objects/Spacecraft';
import { TrajectoryLine } from './objects/Trajectory';
import { PredictedTrajectoryLine } from './objects/PredictedTrajectory';
import { DistanceRings } from './objects/DistanceRings';

/**
 * Compute the approximate Sun direction in ECI coordinates for a given date.
 * Uses a simplified solar position model based on ecliptic longitude from J2000.
 */
function getSunDirectionECI(date: Date): THREE.Vector3 {
  const J2000 = new Date("2000-01-01T12:00:00Z").getTime();
  const daysSinceJ2000 = (date.getTime() - J2000) / 86400000;
  // Mean longitude of the Sun (degrees)
  const L = (280.460 + 0.9856474 * daysSinceJ2000) % 360;
  // Mean anomaly (degrees)
  const g = ((357.528 + 0.9856003 * daysSinceJ2000) % 360) * Math.PI / 180;
  // Ecliptic longitude (degrees)
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
  // Obliquity of ecliptic
  const epsilon = 23.439 * Math.PI / 180;

  // Convert to ECI direction (unit vector, distance doesn't matter for lighting)
  return new THREE.Vector3(
    Math.cos(lambda),
    Math.sin(lambda) * Math.cos(epsilon),
    Math.sin(lambda) * Math.sin(epsilon),
  );
}

export class SceneCore {
  // ---- Three.js fundamentals ----
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  // ---- Scene objects ----
  private earth: EarthObject;
  private moon: MoonObject | null = null;
  private spacecraft: SpacecraftObject;
  private trajectory: TrajectoryLine;
  private predictedTrajectory: PredictedTrajectoryLine;
  private distanceRings: DistanceRings;

  // ---- Lights ----
  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  // ---- Starfield ----
  private starfield: THREE.Points;
  private starfieldGeometry: THREE.BufferGeometry;
  private starfieldMaterial: THREE.PointsMaterial;
  private starBaseSizes: Float32Array;
  private starTwinklePhases: Float32Array;

  // ---- Sun indicator ----
  private sunSprite: THREE.Sprite;
  private sunSpriteMaterial: THREE.SpriteMaterial;
  private sunLine: THREE.Line;
  private sunLineMaterial: THREE.LineBasicMaterial;

  // ---- Ecliptic grid ----
  private grid: THREE.GridHelper;

  // ---- Lifecycle ----
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver;
  private container: HTMLDivElement;
  private compressed = true;
  private disposed = false;
  private frameCallbacks: (() => void)[] = [];
  private frameCount = 0;

  constructor(container: HTMLDivElement) {
    this.container = container;
    const { clientWidth: w, clientHeight: h } = container;

    // ---- Renderer ----
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // ---- Scene ----
    this.scene = new THREE.Scene();

    // ---- Camera ----
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 3000);
    this.camera.position.set(20, 15, 20);

    // ---- Controls ----
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 800;
    this.controls.target.set(0, 0, 0);

    // ---- Lights (positioned from real sun direction) ----
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    const initialSunDir = getSunDirectionECI(new Date());
    this.directionalLight.position.copy(initialSunDir.clone().multiplyScalar(200));
    this.scene.add(this.directionalLight);

    this.ambientLight = new THREE.AmbientLight(0x222244, 0.5);
    this.scene.add(this.ambientLight);

    // ---- Starfield with twinkle ----
    const starCount = 500;
    const starPositions = new Float32Array(starCount * 3);
    this.starBaseSizes = new Float32Array(starCount);
    this.starTwinklePhases = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 800 + Math.random() * 200;
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);
      this.starBaseSizes[i] = 0.5 + Math.random() * 0.7;
      this.starTwinklePhases[i] = Math.random() * Math.PI * 2;
    }

    this.starfieldGeometry = new THREE.BufferGeometry();
    this.starfieldGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const sizesAttr = new THREE.BufferAttribute(new Float32Array(this.starBaseSizes), 1);
    sizesAttr.setUsage(THREE.DynamicDrawUsage);
    this.starfieldGeometry.setAttribute('size', sizesAttr);

    this.starfieldMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      sizeAttenuation: true,
      depthWrite: false,
    });
    this.starfield = new THREE.Points(this.starfieldGeometry, this.starfieldMaterial);
    this.scene.add(this.starfield);

    // ---- Ecliptic reference grid ----
    this.grid = new THREE.GridHelper(200, 20, 0x112233, 0x0a1520);
    (this.grid.material as THREE.Material).transparent = true;
    (this.grid.material as THREE.Material).opacity = 0.08;
    (this.grid.material as THREE.Material).depthWrite = false;
    this.scene.add(this.grid);

    // ---- Sun direction indicator ----
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 32;
    sunCanvas.height = 32;
    const ctx = sunCanvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 221, 68, 0.8)');
    gradient.addColorStop(0.3, 'rgba(255, 200, 50, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 200, 50, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const sunTexture = new THREE.CanvasTexture(sunCanvas);
    this.sunSpriteMaterial = new THREE.SpriteMaterial({
      map: sunTexture,
      color: 0xffdd44,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    this.sunSprite = new THREE.Sprite(this.sunSpriteMaterial);
    this.sunSprite.scale.set(8, 8, 1);
    this.sunSprite.position.copy(initialSunDir.clone().multiplyScalar(300));
    this.scene.add(this.sunSprite);

    // Thin line from origin toward sun
    const sunLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      initialSunDir.clone().multiplyScalar(300),
    ]);
    this.sunLineMaterial = new THREE.LineBasicMaterial({
      color: 0xffdd44,
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
    });
    this.sunLine = new THREE.Line(sunLineGeo, this.sunLineMaterial);
    this.scene.add(this.sunLine);

    // ---- Distance rings ----
    this.distanceRings = new DistanceRings();
    this.scene.add(this.distanceRings.group);
    this.distanceRings.buildRings(this.compressed);

    // ---- Earth ----
    this.earth = new EarthObject();
    this.scene.add(this.earth.group);
    requestAnimationFrame(() => {
      if (!this.disposed) this.earth.loadTexture();
    });

    // ---- Spacecraft ----
    this.spacecraft = new SpacecraftObject();
    this.scene.add(this.spacecraft.group);

    // ---- Trajectory ----
    this.trajectory = new TrajectoryLine();
    this.scene.add(this.trajectory.line);

    this.predictedTrajectory = new PredictedTrajectoryLine();
    this.scene.add(this.predictedTrajectory.line);

    // ---- Resize handling ----
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    // ---- Start render loop ----
    this.animate();
  }

  // ----------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------

  updateSpacecraft(state: SpacecraftState): void {
    this.spacecraft.updatePosition(state.positionKm, this.compressed);
  }

  updateTrajectory(history: SpacecraftState[]): void {
    const points = history.map((s) => s.positionKm);
    this.trajectory.setPoints(points, this.compressed);
  }

  updateFullTrajectory(past: SpacecraftState[], future: SpacecraftState[]): void {
    this.trajectory.setPoints(past.map((s) => s.positionKm), this.compressed);
    this.predictedTrajectory.setPoints(future.map((s) => s.positionKm), this.compressed);
  }

  setShowMoon(show: boolean): void {
    if (show && !this.moon) {
      this.moon = new MoonObject();
      this.scene.add(this.moon.group);
      this.scene.add(this.moon.orbitRing);
      this.moon.loadTexture();
      this.moon.updatePosition(new Date(), this.compressed);
      this.moon.buildOrbitRing(this.compressed);
    } else if (!show && this.moon) {
      this.scene.remove(this.moon.group);
      this.scene.remove(this.moon.orbitRing);
      this.moon.dispose();
      this.moon = null;
    }
  }

  setCompressed(compressed: boolean): void {
    this.compressed = compressed;
    if (this.moon) this.moon.buildOrbitRing(compressed);
    this.distanceRings.buildRings(compressed);
  }

  setCameraPosition(pos: [number, number, number]): void {
    this.camera.position.set(pos[0], pos[1], pos[2]);
    this.controls.update();
  }

  zoomIn(): void {
    const dir = new THREE.Vector3().subVectors(this.controls.target, this.camera.position).normalize();
    const dist = this.camera.position.distanceTo(this.controls.target);
    const step = dist * 0.25;
    if (dist - step > this.controls.minDistance) {
      this.camera.position.addScaledVector(dir, step);
      this.controls.update();
    }
  }

  zoomOut(): void {
    const dir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
    const dist = this.camera.position.distanceTo(this.controls.target);
    const step = dist * 0.25;
    if (dist + step < this.controls.maxDistance) {
      this.camera.position.addScaledVector(dir, step);
      this.controls.update();
    }
  }

  resetView(pos?: [number, number, number]): void {
    const target = pos ?? [20, 15, 20];
    this.camera.position.set(target[0], target[1], target[2]);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  /**
   * Point camera at the spacecraft and trigger a highlight pulse.
   */
  locateCraft(): void {
    const craftPos = this.spacecraft.group.position;
    // Set orbit target to craft position
    this.controls.target.copy(craftPos);
    // Position camera offset from craft
    const offset = new THREE.Vector3(5, 4, 5);
    this.camera.position.copy(craftPos).add(offset);
    this.controls.update();
    // Trigger highlight animation
    this.spacecraft.highlight();
  }

  /**
   * Update the Moon's position for an arbitrary date (used by playback).
   */
  updateMoonTime(date: Date): void {
    if (this.moon) {
      this.moon.updatePosition(date, this.compressed);
    }
  }

  /**
   * Update the directional light and sun indicators for an arbitrary date.
   */
  updateSunTime(date: Date): void {
    const sunDir = getSunDirectionECI(date);
    this.directionalLight.position.copy(sunDir.clone().multiplyScalar(200));
    this.sunSprite.position.copy(sunDir.clone().multiplyScalar(300));

    // Update sun line endpoint
    const positions = this.sunLine.geometry.attributes.position as THREE.BufferAttribute;
    const endpoint = sunDir.clone().multiplyScalar(300);
    positions.setXYZ(1, endpoint.x, endpoint.y, endpoint.z);
    positions.needsUpdate = true;
  }

  /** Project a world position to screen coordinates (px from top-left). */
  projectToScreen(worldX: number, worldY: number, worldZ: number): { x: number; y: number; visible: boolean } {
    const vec = new THREE.Vector3(worldX, worldY, worldZ);
    vec.project(this.camera);
    const { clientWidth: w, clientHeight: h } = this.container;
    return {
      x: (vec.x * 0.5 + 0.5) * w,
      y: (-vec.y * 0.5 + 0.5) * h,
      visible: vec.z < 1 && vec.z > -1,
    };
  }

  /** Register a callback to run each frame (for overlay labels). */
  registerFrameCallback(fn: () => void): void {
    this.frameCallbacks.push(fn);
  }

  unregisterFrameCallback(fn: () => void): void {
    this.frameCallbacks = this.frameCallbacks.filter((f) => f !== fn);
  }

  /** Get distance ring label data for overlay. */
  getDistanceRingLabels() {
    return this.distanceRings.labels;
  }

  dispose(): void {
    this.disposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.resizeObserver.disconnect();
    this.controls.dispose();

    this.earth.dispose();
    if (this.moon) {
      this.scene.remove(this.moon.orbitRing);
      this.moon.dispose();
    }
    this.spacecraft.dispose();
    this.trajectory.dispose();
    this.predictedTrajectory.dispose();
    this.distanceRings.dispose();

    this.starfieldGeometry.dispose();
    this.starfieldMaterial.dispose();

    this.sunSpriteMaterial.map?.dispose();
    this.sunSpriteMaterial.dispose();
    this.sunLine.geometry.dispose();
    this.sunLineMaterial.dispose();

    (this.grid.material as THREE.Material).dispose();
    this.grid.geometry.dispose();

    this.directionalLight.dispose();
    this.ambientLight.dispose();

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    this.scene.clear();
    this.frameCallbacks = [];
  }

  // ----------------------------------------------------------------
  // Private
  // ----------------------------------------------------------------

  private animate = (): void => {
    if (this.disposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    this.controls.update();
    this.frameCount++;

    // Scene objects
    this.earth.update(this.camera);
    this.spacecraft.update(this.camera);

    if (this.moon) {
      this.moon.updatePosition(new Date(), this.compressed);
    }

    // Update sun direction every 600 frames (barely changes)
    if (this.frameCount % 600 === 0) {
      this.updateSunTime(new Date());
    }

    // Starfield twinkle
    const time = performance.now() * 0.001;
    const sizeAttr = this.starfieldGeometry.getAttribute('size') as THREE.BufferAttribute;
    const sizes = sizeAttr.array as Float32Array;
    for (let i = 0; i < this.starBaseSizes.length; i++) {
      sizes[i] = this.starBaseSizes[i]! * (0.7 + 0.3 * Math.sin(time + this.starTwinklePhases[i]!));
    }
    sizeAttr.needsUpdate = true;

    // Frame callbacks (for overlay labels)
    for (const cb of this.frameCallbacks) cb();

    this.renderer.render(this.scene, this.camera);
  };

  private handleResize(): void {
    if (this.disposed) return;
    const { clientWidth: w, clientHeight: h } = this.container;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
