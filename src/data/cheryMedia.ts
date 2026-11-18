import type { VehicleMedia } from './vehicleMedia';

// The two i-DM configurators supply ordered, full rotations in one paint colour.
function jetourFrames(model: 't1' | 't2') {
  return Array.from({ length: 36 }, (_, index) =>
    `cars/jetour-${model}/spin-${String(index).padStart(2, '0')}.webp`
  );
}

const t1 = jetourFrames('t1');
const t2 = jetourFrames('t2');

export const cheryMedia = {
  'Jaecoo J5': {
    source: 'https://omodajaecoo.pk/jaecoo-j5-shs-h',
    note: 'The Comfort and Premium entries share Jaecoo Pakistan’s J5 SHS-H exterior images.',
    views: [
      { file: 'cars/jaecoo-j5/front.webp', label: 'Front three-quarter' },
      { file: 'cars/jaecoo-j5/rear.webp', label: 'Open tailgate', photo: true },
      { file: 'cars/jaecoo-j5/lakeside.webp', label: 'Front grille', photo: true },
    ],
  },
  'Jaecoo J7': {
    source: 'https://omodajaecoo.pk/jaecoo-j7-shs-p',
    views: [
      { file: 'cars/jaecoo-j7/front.webp', label: 'Front three-quarter' },
      { file: 'cars/jaecoo-j7/rear.webp', label: 'Rear three-quarter', photo: true },
      { file: 'cars/jaecoo-j7/front-road.webp', label: 'Front on the road', photo: true },
    ],
  },
  'Omoda 7': {
    source: 'https://omodajaecoo.pk/omoda-7-shs-p',
    views: [
      { file: 'cars/omoda-7/front.webp', label: 'Front three-quarter' },
      { file: 'cars/omoda-7/opposite.webp', label: 'Opposite three-quarter' },
      { file: 'cars/omoda-7/side.webp', label: 'Side profile', photo: true },
      { file: 'cars/omoda-7/rear.webp', label: 'Rear lights', photo: true },
    ],
  },
  'Chery Tiggo 7': {
    source: 'https://www.cherypakistan.com/chery-tiggo-7/',
    views: [
      { file: 'cars/tiggo-7/side.webp', label: 'Side profile' },
      { file: 'cars/tiggo-7/front.webp', label: 'Front three-quarter', photo: true },
    ],
  },
  'Chery Tiggo 8': {
    source: 'https://www.cherypakistan.com/chery-tiggo-8/',
    views: [
      { file: 'cars/tiggo-8/side.webp', label: 'Side profile' },
      { file: 'cars/tiggo-8/front.webp', label: 'Front three-quarter', photo: true },
    ],
  },
  'Chery Tiggo 9': {
    source: 'https://www.cherypakistan.com/chery-tiggo-9/',
    views: [
      { file: 'cars/tiggo-9/side.webp', label: 'Side profile' },
      { file: 'cars/tiggo-9/front.webp', label: 'Front view', photo: true },
      { file: 'cars/tiggo-9/rear.webp', label: 'Rear three-quarter', photo: true },
    ],
  },
  'Jetour T1': {
    source: 'https://jetour.com.pk/t1iDM',
    spin: t1,
    views: [
      { file: 'cars/jetour-t1/front.webp', label: 'Front three-quarter' },
      { file: 'cars/jetour-t1/side.webp', label: 'Side profile' },
      { file: 'cars/jetour-t1/rear.webp', label: 'Rear three-quarter' },
    ],
  },
  'Jetour T2': {
    source: 'https://jetour.com.pk/t2iDM',
    spin: t2,
    views: [
      { file: 'cars/jetour-t2/front.webp', label: 'Front three-quarter' },
      { file: 'cars/jetour-t2/side.webp', label: 'Side profile' },
      { file: 'cars/jetour-t2/rear.webp', label: 'Rear three-quarter' },
    ],
  },
} satisfies Record<string, VehicleMedia>;
