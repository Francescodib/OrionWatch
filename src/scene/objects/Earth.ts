import * as THREE from 'three';
import { detectPerformanceTier, EARTH_SEGMENTS } from '../utils/lod';

/**
 * Earth sphere with optional texture and a subtle atmospheric glow ring.
 */
export class EarthObject {
  readonly group: THREE.Group;

  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.MeshPhongMaterial;
  private readonly geometry: THREE.SphereGeometry;
  private glowMesh: THREE.Mesh | null = null;
  private glowMaterial: THREE.ShaderMaterial | null = null;
  private glowGeometry: THREE.SphereGeometry | null = null;

  /** Radius in scene units (1 unit = 1 000 km). */
  static readonly RADIUS = 6.371;

  constructor() {
    const tier = detectPerformanceTier();
    const segments = EARTH_SEGMENTS[tier];

    this.geometry = new THREE.SphereGeometry(EarthObject.RADIUS, segments, segments);
    this.material = new THREE.MeshPhongMaterial({
      color: 0x1a3a5c,
      shininess: 25,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.group = new THREE.Group();
    this.group.add(this.mesh);

    this.createAtmosphereGlow();
  }

  /**
   * Creates a subtle blue atmosphere glow around Earth using a custom
   * back-face shader that simulates limb brightening.
   */
  private createAtmosphereGlow(): void {
    const glowRadius = EarthObject.RADIUS * 1.15;

    this.glowGeometry = new THREE.SphereGeometry(glowRadius, 32, 32);
    this.glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x4da6ff) },
        viewVector: { value: new THREE.Vector3(0, 0, 1) },
      },
      vertexShader: /* glsl */ `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(0.65 - dot(vNormal, vNormel), 3.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, intensity * 0.6);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    this.glowMesh = new THREE.Mesh(this.glowGeometry, this.glowMaterial);
    this.group.add(this.glowMesh);
  }

  /**
   * Asynchronously load the Earth texture.  Until it arrives the mesh
   * keeps its fallback blue colour.
   */
  loadTexture(): void {
    const url = `${import.meta.env.BASE_URL || "/"}textures/earth_2k.jpg`;
    const img = new Image();
    // Do NOT set img.crossOrigin — server has no CORS headers
    img.onload = () => {
      const texture = new THREE.Texture(img);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      this.material.map = texture;
      this.material.color.set(0xffffff);
      this.material.needsUpdate = true;
    };
    img.onerror = () => {
      console.warn("Earth texture failed:", url);
    };
    img.src = url;
  }

  /**
   * Called every frame to slowly rotate Earth around its axis.
   */
  update(_camera?: THREE.Camera): void {
    this.mesh.rotation.y += 0.0002;

    // Keep glow facing the camera if a camera reference is provided
    if (_camera && this.glowMaterial) {
      (this.glowMaterial.uniforms['viewVector']!.value as THREE.Vector3).subVectors(
        _camera.position,
        this.group.position,
      );
    }
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.map?.dispose();
    this.material.dispose();

    if (this.glowGeometry) this.glowGeometry.dispose();
    if (this.glowMaterial) this.glowMaterial.dispose();

    this.group.clear();
  }
}
