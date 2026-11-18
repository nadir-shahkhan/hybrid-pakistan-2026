const gwmAngles = [
  ['frontRightQuarter', 'Front three-quarter'],
  ['rightSide', 'Right profile'],
  ['rearRightQuarter', 'Right rear three-quarter'],
  ['rear', 'Rear'],
  ['rearLeftQuarter', 'Left rear three-quarter'],
  ['leftSide', 'Left profile'],
  ['frontLeftQuarter', 'Left front three-quarter'],
  ['front', 'Front'],
] as const;

function gwmTurntable(folder: string) {
  const file = (name: string) => `cars/${folder}/${name}.webp`;
  return {
    source: `https://www.gwm-pakistan.com/models/${folder}`,
    views: gwmAngles.map(([name, label], index) => ({
      file: file(index === 0 ? 'cover' : name),
      label,
    })),
    spin: gwmAngles.map(([name]) => file(name)),
  };
}

export const gwmMedia = {
  'Haval Jolion HEV': gwmTurntable('haval-jolion-hev'),
  'Haval H6 HEV': gwmTurntable('haval-h6-hev'),
  'Haval H6 PHEV': gwmTurntable('haval-h6-phev'),
  'GWM Tank 500 PHEV': gwmTurntable('tank-500-phev'),
  'Haval H6 GT': {
    source: 'https://gwm-creek.com/haval-h6-gt',
    views: [
      { file: 'cars/haval-h6-gt/cover.webp', label: 'Front three-quarter' },
      { file: 'cars/haval-h6-gt/side.webp', label: 'Side profile' },
      { file: 'cars/haval-h6-gt/on-road.webp', label: 'On the road', photo: true },
    ],
  },
  'MG HS Hybrid+': {
    source: 'https://mgmotors.com.pk/model/mg-hs-hybrid-plus',
    views: [
      { file: 'cars/mg-hs-hybrid-plus/cover.webp', label: 'Front three-quarter' },
      { file: 'cars/mg-hs-hybrid-plus/side.webp', label: 'Side profile', photo: true },
      { file: 'cars/mg-hs-hybrid-plus/rear.webp', label: 'Rear three-quarter', photo: true },
    ],
  },
  'MG HS Super Hybrid': {
    source: 'https://mgmotors.com.pk/model/mg-hs-super-hybrid',
    views: [
      { file: 'cars/mg-hs-super-hybrid/cover.webp', label: 'Front three-quarter' },
      { file: 'cars/mg-hs-super-hybrid/on-road.webp', label: 'Waterfront exterior', photo: true },
    ],
  },
  'BYD Shark 6': {
    source: 'https://www.byd-mega.com/vehicles/shark',
    views: [
      { file: 'cars/byd-shark-6/cover.webp', label: 'Front three-quarter' },
      { file: 'cars/byd-shark-6/side.webp', label: 'Side profile' },
      { file: 'cars/byd-shark-6/tailgate.webp', label: 'Tailgate detail', photo: true },
    ],
  },
};
