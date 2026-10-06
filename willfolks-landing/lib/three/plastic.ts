import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export const ACID = 0xc5ff0a;
export const LIME = 0x8ce000;
export const INK = 0x050702;

/** Soft studio reflections without shipping an HDR file. */
export function applyStudioEnvironment(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
}

interface PlasticOptions {
  color?: number;
  /** 0 = clear resin, 1 = fully frosted. */
  frost?: number;
  thickness?: number;
  attenuationDistance?: number;
}

/**
 * Matte translucent plastic, the kind handhelds were moulded from: light
 * passes through, scatters (roughness blurs the transmission) and picks up
 * the green of the resin the deeper it travels (attenuation).
 */
export function createPlastic(options: PlasticOptions = {}) {
  const { color = ACID, frost = 0.42, thickness = 1.4, attenuationDistance = 1.1 } = options;
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: frost,
    metalness: 0,
    transmission: 1,
    thickness,
    ior: 1.46,
    attenuationColor: new THREE.Color(LIME),
    attenuationDistance,
    clearcoat: 0.6,
    clearcoatRoughness: 0.35,
    specularIntensity: 0.9,
    envMapIntensity: 1.1,
    side: THREE.FrontSide,
  });
}

/** Opaque glossy ink, for the bits that should read through the plastic. */
export function createInk() {
  return new THREE.MeshStandardMaterial({
    color: INK,
    roughness: 0.35,
    metalness: 0.1,
    envMapIntensity: 0.6,
  });
}
