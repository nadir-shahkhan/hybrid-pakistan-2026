import * as THREE from 'three';
import type { Car } from '../../data/cars';
import { photoPanelsFor } from './photoPanels';

const flankImages = import.meta.glob<string>('../../assets/orbit-flanks/*.webp', {
  eager: true,
  query: '?inline',
  import: 'default',
});
const loader = new THREE.TextureLoader();

function sideTexture(model: string, surface: 'body' | 'glass' | 'windshield') {
  const texture = loader.load(flankImages[`../../assets/orbit-flanks/${model}-${surface}.webp`]);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Each texture sits on its corresponding real 3D panel, including in profile. */
export function applyVehicleSkins(model: THREE.Group, car: Car) {
  const panels = photoPanelsFor(car);
  if (!panels) return;
  const body = sideTexture(panels.model, 'body');
  const glass = sideTexture(panels.model, 'glass');
  const windshield = sideTexture(panels.model, 'windshield');
  for (const mesh of model.children) {
    if (!(mesh instanceof THREE.Mesh)) continue;
    let map: THREE.Texture;
    if (mesh.name === 'orbitFrontFascia') map = panels.front;
    else if (mesh.name === 'orbitRearFascia' && panels.rear) map = panels.rear;
    else if (mesh.name === 'orbitWindshield') map = windshield;
    else if (mesh.name.startsWith('orbitWheel')) map = panels.wheel;
    else if (mesh.name.startsWith('orbitFlank')) map = body;
    else if (mesh.name.startsWith('orbitCabin')) map = glass;
    else continue;
    mesh.material.map?.dispose();
    mesh.material.dispose();
    mesh.material = new THREE.MeshBasicMaterial({
      name: mesh.name,
      map,
      toneMapped: false,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.012,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    mesh.castShadow = false;
    mesh.renderOrder = 1;
  }
}
