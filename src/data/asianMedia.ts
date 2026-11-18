function angle(model: string, frame: number) {
  return `cars/${model}/angle-${String(frame).padStart(2, '0')}.webp`;
}

function rotation(model: string, count: number) {
  return Array.from({ length: count }, (_, frame) => angle(model, frame));
}

const sorentoViews = [
  { file: angle('sorento', 0), label: 'Front three-quarter' },
  { file: angle('sorento', 1), label: 'Side profile' },
  { file: angle('sorento', 2), label: 'Rear three-quarter' },
];

const sorentoSpin = rotation('sorento', 8);

export const asianMedia = {
  'Toyota Corolla Cross': {
    source: 'https://toyota-indus.com/corolla-cross/',
    views: [
      { file: 'cars/corolla-cross/front.webp', label: 'Front three-quarter' },
      { file: 'cars/corolla-cross/woodland.webp', label: 'Exterior in daylight', photo: true },
      { file: 'cars/corolla-cross/rear.webp', label: 'Rear three-quarter', photo: true },
    ],
  },
  'Honda HR-V': {
    source: 'https://www.honda.com.pk/hrv-ehev',
    note: 'Honda Pakistan supplies the exterior views. The orbit model also uses the side profile from Honda’s UK HR-V e:HEV guide. Trim details may vary.',
    views: [
      { file: 'cars/hr-v/front.webp', label: 'Front three-quarter' },
      { file: 'cars/hr-v/grille.webp', label: 'Body-colour grille', photo: true },
    ],
  },
  'Hyundai Elantra': {
    source: 'https://hyundai-nishat.com/elantra-hybrid/',
    views: [
      { file: angle('elantra', 0), label: 'Front three-quarter' },
      { file: angle('elantra', 4), label: 'Side profile' },
      { file: angle('elantra', 9), label: 'Rear three-quarter' },
    ],
    spin: rotation('elantra', 36),
  },
  'Hyundai Tucson': {
    source: 'https://hyundai-nishat.com/tucson-hybrid/',
    views: [
      { file: angle('tucson', 0), label: 'Front three-quarter' },
      { file: angle('tucson', 5), label: 'Side profile' },
      { file: angle('tucson', 11), label: 'Rear three-quarter' },
    ],
    spin: rotation('tucson', 36),
  },
  'Hyundai Santa Fe': {
    source: 'https://hyundai-nishat.com/santa-fe/',
    views: [
      { file: angle('santa-fe', 0), label: 'Front three-quarter' },
      { file: angle('santa-fe', 5), label: 'Side profile' },
      { file: angle('santa-fe', 11), label: 'Rear three-quarter' },
    ],
    spin: rotation('santa-fe', 36),
  },
  'Kia Sportage L': {
    source: 'https://kia-luckymotorcorp.com/showroom/the-all-new-sportage-l/',
    note: 'Kia Pakistan supplies the exterior views. The 3D rear uses Kia America’s 2026 Sportage Hybrid EX reference. Rear trim can vary by market.',
    views: [
      { file: 'cars/sportage-l/front.webp', label: 'Front three-quarter' },
      { file: 'cars/sportage-l/fascia.webp', label: 'Front fascia', photo: true },
      { file: 'cars/sportage-l/headlamp.webp', label: 'Star Map lighting', photo: true },
    ],
  },
  'Kia Sorento 1.6T HEV': {
    source: 'https://kia-luckymotorcorp.com/showroom/the-all-new-sorento/',
    views: sorentoViews,
    spin: sorentoSpin,
  },
  'Kia Sorento PHEV': {
    source: 'https://kia-luckymotorcorp.com/showroom/the-all-new-sorento-phev/',
    note: 'The exterior turntable shows the Sorento body shared with the HEV. The charge-port photo shows the plug-in hybrid.',
    views: [
      ...sorentoViews,
      { file: 'cars/sorento/charging.webp', label: 'PHEV charge port', photo: true },
    ],
    spin: sorentoSpin,
  },
};
