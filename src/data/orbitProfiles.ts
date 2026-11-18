import type { Car } from './cars';
import { exteriorFor } from './exteriors';

// Side-elevation landmarks are normalized to the full body envelope. X increases
// from the tailgate (0) to the nose (1). Heights are fractions of overall height.
// The landmarks describe exterior appearance, not published trim specifications.
export interface OrbitProfile {
  frontAxleU: number;
  wheelRadius: number;
  sill: number;
  archPower: number;
  belt: [rear: number, mid: number, cowl: number, nose: number];
  cabin: [rearBase: number, rearRoof: number, frontRoof: number, frontBase: number];
  roofDrop: [rear: number, front: number];
  roofHalfWidth: number;
  windows: [quarterBase: number, quarterTop: number, bBottom: number, bTop: number];
  quarter: 'square' | 'kick' | 'taper' | 'floating' | 'pickup';
  spoiler: number;
  rearLamp:
    | 'j5'
    | 'j7'
    | 'cross'
    | 'hrv'
    | 'sportage'
    | 'hs'
    | 'h6gt'
    | 'omoda'
    | 'tiggo7'
    | 'tiggo8'
    | 'tiggo9'
    | 'shark'
    | 'standard';
  shoulderLine: 'straight' | 'hollow' | 'blade' | 'stepped';
  sideTrim: 'black' | 'chrome' | 'paint';
}

type ProfileRow = [
  model: string,
  axle: number,
  tyre: number,
  sill: number,
  arch: number,
  belt: OrbitProfile['belt'],
  cabin: OrbitProfile['cabin'],
  endDrops: OrbitProfile['roofDrop'],
  roofHalfWidth: number,
  windows: OrbitProfile['windows'],
  quarter: OrbitProfile['quarter'],
  spoiler: number,
  rearLamp: OrbitProfile['rearLamp'],
  shoulderLine: OrbitProfile['shoulderLine'],
  sideTrim: OrbitProfile['sideTrim'],
];

const rows: ProfileRow[] = [
  [
    'Jaecoo J5',
    0.806,
    0.352,
    0.284,
    2.18,
    [0.664, 0.65, 0.628, 0.586],
    [0.05, 0.141, 0.608, 0.724],
    [0.056, 0.039],
    0.835,
    [0.213, 0.207, 0.533, 0.48],
    'taper',
    0.085,
    'j5',
    'straight',
    'black',
  ],
  [
    'Jaecoo J7',
    0.81,
    0.371,
    0.3,
    2.72,
    [0.68, 0.664, 0.639, 0.599],
    [0.049, 0.118, 0.626, 0.731],
    [0.033, 0.028],
    0.857,
    [0.186, 0.185, 0.523, 0.481],
    'square',
    0.088,
    'j7',
    'straight',
    'chrome',
  ],
  [
    'Toyota Corolla Cross',
    0.803,
    0.355,
    0.291,
    2.2,
    [0.721, 0.666, 0.637, 0.559],
    [0.071, 0.168, 0.568, 0.728],
    [0.073, 0.05],
    0.787,
    [0.225, 0.142, 0.535, 0.462],
    'kick',
    0.096,
    'cross',
    'hollow',
    'black',
  ],
  [
    'Honda HR-V',
    0.807,
    0.345,
    0.257,
    2.09,
    [0.709, 0.678, 0.642, 0.591],
    [0.048, 0.196, 0.585, 0.734],
    [0.112, 0.042],
    0.808,
    [0.207, 0.123, 0.505, 0.45],
    'taper',
    0.124,
    'hrv',
    'straight',
    'chrome',
  ],
  [
    'Kia Sportage',
    0.808,
    0.364,
    0.295,
    2.31,
    [0.715, 0.678, 0.627, 0.552],
    [0.065, 0.17, 0.57, 0.745],
    [0.09, 0.052],
    0.792,
    [0.241, 0.158, 0.539, 0.466],
    'floating',
    0.14,
    'sportage',
    'blade',
    'chrome',
  ],
  [
    'MG HS',
    0.805,
    0.363,
    0.282,
    2.09,
    [0.718, 0.669, 0.624, 0.554],
    [0.076, 0.163, 0.59, 0.728],
    [0.101, 0.052],
    0.793,
    [0.223, 0.136, 0.535, 0.478],
    'taper',
    0.148,
    'hs',
    'hollow',
    'chrome',
  ],
  [
    'Haval H6 GT',
    0.813,
    0.377,
    0.303,
    2.4,
    [0.708, 0.679, 0.628, 0.566],
    [0.048, 0.231, 0.59, 0.74],
    [0.168, 0.065],
    0.805,
    [0.216, 0.102, 0.527, 0.465],
    'taper',
    0.157,
    'h6gt',
    'stepped',
    'black',
  ],
  [
    'Omoda 7',
    0.804,
    0.371,
    0.294,
    2.2,
    [0.706, 0.667, 0.629, 0.555],
    [0.071, 0.195, 0.601, 0.753],
    [0.144, 0.047],
    0.791,
    [0.219, 0.124, 0.529, 0.465],
    'floating',
    0.14,
    'omoda',
    'blade',
    'black',
  ],
  [
    'Chery Tiggo 7',
    0.807,
    0.356,
    0.28,
    2.25,
    [0.705, 0.668, 0.642, 0.585],
    [0.061, 0.135, 0.592, 0.735],
    [0.068, 0.042],
    0.818,
    [0.214, 0.173, 0.528, 0.476],
    'floating',
    0.109,
    'tiggo7',
    'hollow',
    'chrome',
  ],
  [
    'Chery Tiggo 8',
    0.807,
    0.369,
    0.296,
    2.33,
    [0.699, 0.666, 0.647, 0.592],
    [0.048, 0.111, 0.607, 0.728],
    [0.045, 0.044],
    0.822,
    [0.248, 0.201, 0.553, 0.496],
    'square',
    0.112,
    'tiggo8',
    'hollow',
    'chrome',
  ],
  [
    'Chery Tiggo 9',
    0.804,
    0.378,
    0.3,
    2.07,
    [0.694, 0.651, 0.635, 0.589],
    [0.047, 0.143, 0.589, 0.723],
    [0.064, 0.048],
    0.792,
    [0.237, 0.199, 0.565, 0.495],
    'taper',
    0.133,
    'tiggo9',
    'blade',
    'chrome',
  ],
  [
    'BYD Shark',
    0.843,
    0.398,
    0.334,
    3.25,
    [0.68, 0.688, 0.676, 0.609],
    [0.316, 0.328, 0.604, 0.727],
    [0.029, 0.05],
    0.84,
    [0.04, 0.04, 0.505, 0.5],
    'pickup',
    0,
    'shark',
    'stepped',
    'black',
  ],
];

const modelProfiles = rows.map(
  ([
    prefix,
    frontAxleU,
    wheelRadius,
    sill,
    archPower,
    belt,
    cabin,
    roofDrop,
    roofHalfWidth,
    windows,
    quarter,
    spoiler,
    rearLamp,
    shoulderLine,
    sideTrim,
  ]) => ({
    prefix,
    frontAxleU,
    wheelRadius,
    sill,
    archPower,
    belt,
    cabin,
    roofDrop,
    roofHalfWidth,
    windows,
    quarter,
    spoiler,
    rearLamp,
    shoulderLine,
    sideTrim,
  }),
);

export function orbitProfileFor(car: Car): OrbitProfile {
  const match = modelProfiles.find((row) => car.Model.startsWith(row.prefix));
  if (match) return match;
  const { roof, length, wheelbase } = exteriorFor(car);
  const isSedan = roof === 'sedan',
    upright = roof === 'upright';
  return {
    frontAxleU: 0.5 + wheelbase / (2 * length),
    wheelRadius: isSedan ? 0.327 : upright ? 0.39 : 0.361,
    sill: isSedan ? 0.24 : upright ? 0.32 : 0.3,
    archPower: 2,
    belt: [0.665, 0.65, 0.64, 0.57],
    cabin: [isSedan ? 0.135 : 0.045, isSedan ? 0.315 : upright ? 0.105 : 0.155, 0.59, 0.755],
    roofDrop: [isSedan ? 0.11 : 0.065, 0.045],
    roofHalfWidth: upright ? 0.824 : 0.776,
    windows: [0.23, 0.18, 0.535, 0.48],
    quarter: isSedan ? 'taper' : 'square',
    spoiler: isSedan ? 0 : 0.09,
    rearLamp: 'standard',
    shoulderLine: 'straight',
    sideTrim: 'black',
  };
}

export function wheelStations(car: Car) {
  const { length, wheelbase } = exteriorFor(car);
  const front = orbitProfileFor(car).frontAxleU;
  return { front, rear: front - wheelbase / length };
}
