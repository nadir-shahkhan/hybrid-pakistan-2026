import * as THREE from 'three';
import { drawTailgate } from './taillights';
import type { exteriorFor } from '../../data/exteriors';
type Exterior = ReturnType<typeof exteriorFor>;

type Point = [number, number];

// A single curved decal keeps the closely spaced grille and LED elements legible
// without drawing hundreds of individual meshes on the overview platform.
export function fasciaMap(car: Exterior, front: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(1.5, 1.25);
  const path = (points: Point[], fill: string, stroke?: string, width = 1) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.lineWidth = width;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  };
  const line = (points: Point[], color: string, width: number) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  };
  const text = (s: string, y: number, size: number, color: string) => {
    ctx.font = 'bold ' + size + 'px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(s, 256, y);
  };

  const customRear = !front && drawTailgate(ctx, car);
  if (front) {
    const waterfall = car.grille === 'waterfall';
    const truck = car.grille === 'slots';
    const wide = ['SANTA FE', 'TUCSON', 'SPORTAGE', 'ELANTRA', 'H6'].includes(car.name);
    const left = wide ? 36 : waterfall ? 101 : 76;
    const y = car.name === 'HS' || car.name === 'OMODA 7' ? 73 : 36;
    const grill: Point[] = [
      [left + 17, y],
      [495 - left, y],
      [512 - left, y + 12],
      [498 - left, 142],
      [463 - left, 157],
      [left + 49, 157],
      [left + 14, 142],
      [left, y + 12],
    ];
    path(grill, '#11191d', '#859097', 3);
    ctx.save();
    ctx.clip();
    if (waterfall) {
      for (let x = left; x < 512 - left; x += 13) {
        line(
          [
            [x + 4, y],
            [x, 162],
          ],
          '#475157',
          7,
        );
        line(
          [
            [x + 2, y],
            [x - 2, 162],
          ],
          '#d0d5d5',
          2,
        );
      }
    } else if (car.grille === 'bars' || truck) {
      for (let row = 0; row < (truck ? 2 : 6); row++) {
        const top = y + 13 + row * (truck ? 45 : 20);
        line(
          [
            [left, top - 2],
            [150, top + 4],
            [362, top + 4],
            [512 - left, top - 2],
          ],
          truck ? '#424b4d' : '#889297',
          truck ? 13 : 5,
        );
        line(
          [
            [left, top - 3],
            [150, top + 3],
            [362, top + 3],
            [512 - left, top - 3],
          ],
          '#c0c7c8',
          1.2,
        );
      }
    } else {
      for (let row = 0; row < 11; row++) {
        for (let col = 0; col < 38; col++) {
          const x = left + col * 15 + (row % 2) * 7.5,
            top = y + row * 13;
          line(
            [
              [x - 6, top],
              [x, top + 5],
              [x + 6, top],
            ],
            car.grille === 'diamonds' ? '#879295' : '#475156',
            2,
          );
          line(
            [
              [x, top + 5],
              [x + 6, top],
            ],
            '#c0c7c8',
            1,
          );
        }
      }
    }
    ctx.restore();
    for (const side of [0, 1]) {
      ctx.save();
      if (side) {
        ctx.translate(512, 0);
        ctx.scale(-1, 1);
      }
      const drop = ['drop', 'square', 'pixel', 'tee', 'starmap'].includes(car.lamps);
      path(
        [
          [7, 30],
          [62, 33],
          [107, 44],
          [94, drop ? 68 : 56],
          [57, 65],
          [38, drop ? 121 : 66],
          [10, drop ? 121 : 59],
        ],
        '#182126',
        '#6f828a',
        2,
      );
      for (let i = 0; i < (drop ? 3 : 4); i++) {
        ctx.fillStyle = '#a0b4bd';
        ctx.fillRect(16 + i * 11, 46 + i * 0.7, 7, 7);
      }
      if (car.lamps === 'jewel') {
        for (let i = 0; i < 4; i++)
          path(
            [
              [10 + i * 15, 33 + i * 5],
              [34 + i * 15, 36 + i * 5],
              [26 + i * 15, 47 + i * 5],
            ],
            '#e4f8ff',
          );
      } else if (car.lamps === 'pixel') {
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = '#d5f5ff';
          ctx.fillRect(12 + i * 13, 34, 9, 8);
        }
      } else if (car.lamps === 'square') {
        line(
          [
            [17, 103],
            [13, 41],
            [64, 43],
            [70, 90],
            [56, 95],
          ],
          '#e5f8fc',
          5,
        );
      } else {
        const signature: Point[] =
          car.lamps === 'starmap'
            ? [
                [98, 43],
                [66, 42],
                [14, 34],
                [28, 50],
                [29, 109],
                [40, 116],
              ]
            : car.lamps === 'tee'
              ? [
                  [11, 35],
                  [83, 42],
                  [40, 40],
                  [37, 115],
                ]
              : car.lamps === 'drop'
                ? [
                    [94, 42],
                    [16, 36],
                    [15, 111],
                    [27, 117],
                  ]
                : car.lamps === 'claw'
                  ? [
                      [10, 34],
                      [47, 38],
                      [60, 47],
                      [101, 47],
                    ]
                  : [
                      [10, 34],
                      [58, 37],
                      [99, 45],
                    ];
        line(signature, '#d8f6fa', 5);
      }
      path(
        [
          [11, 156],
          [64, 163],
          [77, 199],
          [27, 193],
        ],
        '#151b1c',
      );
      line(
        [
          [25, 184],
          [58, 188],
        ],
        '#738387',
        2,
      );
      ctx.restore();
    }
    if (truck) {
      ctx.fillStyle = '#222b2e';
      ctx.fillRect(158, 66, 196, 37);
      text(car.make, 94, 28, '#d3d8d7');
    } else {
      ctx.fillStyle = '#1e282c';
      ctx.fillRect(227, 62, 58, 17);
      text(car.make, 75, 11, '#e3e7e7');
    }
    path(
      [
        [53, 204],
        [113, 198],
        [399, 198],
        [459, 204],
        [443, 225],
        [69, 225],
      ],
      '#252d31',
    );
    line(
      [
        [70, 226],
        [442, 226],
      ],
      '#9ba3a4',
      3,
    );
  } else if (!customRear) {
    const connected = !['COROLLA CROSS', 'SORENTO', 'TANK 500', 'T2', 'T1'].includes(car.name);
    if (connected)
      line(
        [
          [13, 52],
          [90, 61],
          [422, 61],
          [499, 52],
        ],
        '#9e3032',
        5,
      );
    for (const s of [0, 1]) {
      ctx.save();
      if (s) {
        ctx.translate(512, 0);
        ctx.scale(-1, 1);
      }
      const tall = ['pickup', 'upright'].includes(car.roof) && !connected;
      path(
        [
          [7, 39],
          [81, 45],
          [103, 54],
          [81, 66],
          [29, 65],
          [12, tall ? 120 : 72],
        ],
        '#591721',
        '#5a383b',
      );
      line(
        tall
          ? [
              [17, 108],
              [16, 49],
              [69, 51],
            ]
          : [
              [12, 46],
              [47, 50],
              [90, 54],
            ],
        '#fb6863',
        4,
      );
      if (car.lamps === 'jewel' || car.name === 'ELANTRA')
        line(
          [
            [37, 50],
            [52, 78],
            [61, 56],
          ],
          '#d84c4a',
          4,
        );
      line(
        [
          [18, 178],
          [48, 177],
        ],
        '#b4393a',
        3,
      );
      ctx.restore();
    }
    text(car.make, 91, 13, '#d6dbdb');
    line(
      [
        [45, 171],
        [96, 184],
        [416, 184],
        [467, 171],
      ],
      '#394349',
      2,
    );
    path(
      [
        [30, 208],
        [87, 217],
        [425, 217],
        [482, 208],
        [469, 233],
        [43, 233],
      ],
      '#3b4447',
    );
  }
  if (!customRear) {
    ctx.fillStyle = '#252c2e';
    ctx.fillRect(199, front ? 144 : 117, 114, 24);
    ctx.strokeStyle = '#a4aaaa';
    ctx.lineWidth = 1;
    ctx.strokeRect(199, front ? 144 : 117, 114, 24);
    text(car.name, front ? 160 : 133, 12, '#e7e9e6');
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
