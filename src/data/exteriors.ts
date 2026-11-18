import type { Car } from './cars';

// Approximate exterior envelopes in metres, used only by the illustrated orbit view.
// Roof shape, lighting signature and grille are independent of the dataset's body class.
export type Roof = 'estate' | 'upright' | 'fastback' | 'sedan' | 'pickup';
export type Grille = 'waterfall' | 'mesh' | 'bars' | 'diamonds' | 'slots';
export type Lamps = 'blade' | 'drop' | 'pixel' | 'claw' | 'jewel' | 'starmap' | 'square' | 'tee';

interface Exterior {
  name: string;
  make: string;
  length: number;
  width: number;
  height: number;
  wheelbase: number;
  roof: Roof;
  grille: Grille;
  lamps: Lamps;
  paint: string;
  contrastRoof: boolean;
  spokes: number;
}

type Profile = [
  prefix: string,
  badge: string,
  length: number,
  width: number,
  height: number,
  wheelbase: number,
  roof: Roof,
  grille: Grille,
  lamps: Lamps,
  paint: string,
  spokes: number,
  contrastRoof?: boolean,
];

const profiles: Profile[] = [
  ['Jaecoo J5', 'J5', 4.38, 1.86, 1.68, 2.62, 'upright', 'waterfall', 'blade', '#497d7e', 5, true],
  ['Jaecoo J7', 'J7', 4.5, 1.87, 1.67, 2.67, 'upright', 'waterfall', 'pixel', '#aaaec2', 5, true],
  ['Haval Jolion', 'JOLION', 4.47, 1.84, 1.62, 2.7, 'estate', 'diamonds', 'drop', '#a59f94', 5],
  ['Haval H6 GT', 'H6 GT', 4.73, 1.94, 1.73, 2.74, 'fastback', 'mesh', 'claw', '#484849', 5],
  ['Haval H6', 'H6', 4.7, 1.89, 1.73, 2.74, 'estate', 'bars', 'drop', '#3b4a48', 6],
  ['Toyota Corolla Cross', 'COROLLA CROSS', 4.46, 1.83, 1.62, 2.64, 'estate', 'mesh', 'blade', '#28529a', 5],
  ['Honda HR-V', 'HR-V', 4.35, 1.79, 1.59, 2.61, 'fastback', 'bars', 'blade', '#c1d9e1', 5],
  ['MG HS', 'HS', 4.67, 1.89, 1.66, 2.77, 'estate', 'diamonds', 'blade', '#696666', 5],
  ['Hyundai Elantra', 'ELANTRA', 4.68, 1.83, 1.42, 2.72, 'sedan', 'diamonds', 'claw', '#ab253c', 5],
  ['Hyundai Tucson', 'TUCSON', 4.64, 1.87, 1.67, 2.76, 'estate', 'diamonds', 'jewel', '#52635e', 5],
  ['Hyundai Santa Fe', 'SANTA FE', 4.79, 1.9, 1.71, 2.77, 'estate', 'mesh', 'tee', '#91a2b7', 5],
  ['Kia Sportage', 'SPORTAGE', 4.66, 1.87, 1.67, 2.76, 'estate', 'mesh', 'starmap', '#797a7d', 5],
  ['Kia Sorento', 'SORENTO', 4.82, 1.9, 1.7, 2.82, 'upright', 'mesh', 'tee', '#968f87', 5],
  ['Chery Tiggo 7', 'TIGGO 7', 4.55, 1.86, 1.7, 2.67, 'estate', 'diamonds', 'blade', '#9faebb', 5],
  ['Chery Tiggo 8', 'TIGGO 8', 4.725, 1.86, 1.705, 2.71, 'estate', 'diamonds', 'claw', '#2689ac', 6],
  ['Chery Tiggo 9', 'TIGGO 9', 4.81, 1.93, 1.74, 2.8, 'estate', 'diamonds', 'blade', '#207975', 7],
  ['Omoda 7', 'OMODA 7', 4.66, 1.88, 1.67, 2.72, 'fastback', 'diamonds', 'claw', '#5aa4ab', 5, true],
  ['Jetour T1', 'T1', 4.71, 1.97, 1.85, 2.8, 'upright', 'slots', 'square', '#a09f95', 6, true],
  ['Jetour T2', 'T2', 4.79, 2.01, 1.88, 2.8, 'upright', 'slots', 'pixel', '#a4aab0', 6, true],
  ['BYD Shark', 'SHARK 6', 5.46, 1.97, 1.93, 3.26, 'pickup', 'slots', 'drop', '#d44f2c', 6],
  ['GWM Tank', 'TANK 500', 5.08, 1.93, 1.91, 2.85, 'upright', 'bars', 'square', '#dde2e5', 8],
];

const exteriors = profiles.map(
  ([prefix, name, length, width, height, wheelbase, roof, grille, lamps, paint, spokes, contrastRoof]) => ({
    prefix,
    name,
    make: prefix.split(' ')[0].toUpperCase(),
    length,
    width,
    height,
    wheelbase,
    roof,
    grille,
    lamps,
    paint,
    spokes,
    contrastRoof: contrastRoof ?? false,
  }),
);

export function exteriorFor(car: Car): Exterior {
  const profile = exteriors.find(({ prefix }) => car.Model.startsWith(prefix));
  if (profile && car.Type === 'PHEV' && (profile.name === 'HS' || profile.name === 'H6')) {
    return { ...profile, paint: '#e5e5e2' };
  }
  return (
    profile ?? {
      ...exteriors[0],
      name: car.Model,
      make: car.Model.split(' ')[0].toUpperCase(),
    }
  );
}
