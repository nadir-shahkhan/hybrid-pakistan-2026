import * as THREE from 'three';
import type { Car } from '../../data/cars';

const images = import.meta.glob<string>('../../assets/orbit-panels/*.webp', {
  eager: true,
  query: '?inline',
  import: 'default',
});

const tails = import.meta.glob<string>('../../assets/orbit/tails/*.webp', {
  eager: true,
  query: '?inline',
  import: 'default',
});

const detailTails: Readonly<Record<string, string>> = {
  'byd-shark-6': 'shark',
  'corolla-cross': 'cross',
  'mg-hs-hybrid-plus': 'mg',
  'mg-hs-super-hybrid': 'mg-super',
  'jaecoo-j7': 'j7',
  'omoda-7': 'omoda',
  'tiggo-7': 'tiggo7',
  'tiggo-8': 'tiggo8',
  'tiggo-9': 'tiggo9',
};

const identities: ReadonlyArray<readonly [string, string]> = [
  ['Jaecoo J5', 'jaecoo-j5'],
  ['Jaecoo J7', 'jaecoo-j7'],
  ['Toyota Corolla Cross', 'corolla-cross'],
  ['Honda HR-V', 'hr-v'],
  ['Kia Sportage', 'sportage-l'],
  ['MG HS Hybrid+', 'mg-hs-hybrid-plus'],
  ['MG HS Super Hybrid', 'mg-hs-super-hybrid'],
  ['Haval H6 GT', 'haval-h6-gt'],
  ['Omoda 7', 'omoda-7'],
  ['Chery Tiggo 7', 'tiggo-7'],
  ['Chery Tiggo 8', 'tiggo-8'],
  ['Chery Tiggo 9', 'tiggo-9'],
  ['BYD Shark', 'byd-shark-6'],
];

const loader = new THREE.TextureLoader();

function makePanel(url: string) {
  const texture = loader.load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Each model owns the returned textures and may dispose them with its materials. */
export function photoPanelsFor(car: Car) {
  const identity = identities.find(([prefix]) => car.Model.startsWith(prefix));
  if (!identity) return undefined;
  const model = identity[1];
  const stem = '../../assets/orbit-panels/' + model + '-';
  const rearUrl = images[stem + 'rear.webp'] ?? tails['../../assets/orbit/tails/' + detailTails[model] + '.webp'];
  return {
    model,
    front: makePanel(images[stem + 'front.webp']),
    wheel: makePanel(images[stem + 'wheel.webp']),
    rear: rearUrl ? makePanel(rearUrl) : undefined,
  };
}
