import type { exteriorFor } from '../../data/exteriors';
type Exterior = ReturnType<typeof exteriorFor>;
type Point = [number, number];

export function drawTailgate(ctx: CanvasRenderingContext2D, car: Exterior): boolean {
  const name = car.name;
  const illustrated = ['J5', 'J7', 'HR-V', 'H6 GT', 'SPORTAGE', 'OMODA 7'];
  if (!illustrated.includes(name)) return false;
  const stroke = (points: Point[], color: string, width: number) => {
    ctx.beginPath();
    for (const [i, [x, y]] of points.entries()) {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  };
  const label = (text: string, y: number, size: number, color: string) => {
    ctx.font = '600 ' + size + 'px Arial,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(text, 256, y);
  };
  const polygon = (p: Point[], color: string) => {
    ctx.beginPath();
    p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  if (name === 'J5' || name === 'J7') {
    polygon(
      [
        [4, 23],
        [70, 24],
        [256, 26],
        [442, 24],
        [508, 23],
        [507, 47],
        [460, 53],
        [52, 53],
        [5, 46],
      ],
      '#293034',
    );
    stroke(
      [
        [10, 29],
        [105, 32],
        [407, 32],
        [502, 29],
      ],
      '#a13235',
      4,
    );
    if (name === 'J5') {
      for (let i = 0; i < 11; i++)
        for (const x of [9 + i * 4, 503 - i * 4])
          stroke(
            [
              [x, 32],
              [x - 1, 40],
            ],
            '#eb7773',
            1.7,
          );
      label('J A E C O O', 46, 12, '#c7cbd0');
    }
    stroke(
      [
        [41, 54],
        [43, 138],
        [60, 160],
        [448, 160],
        [466, 140],
        [470, 54],
      ],
      '#434e51',
      1.4,
    );
  } else if (name === 'HR-V') {
    polygon(
      [
        [0, 28],
        [32, 31],
        [109, 47],
        [400, 47],
        [480, 31],
        [512, 28],
        [505, 46],
        [424, 68],
        [87, 68],
        [5, 44],
      ],
      '#303139',
    );
    stroke(
      [
        [5, 34],
        [94, 52],
        [418, 52],
        [507, 34],
      ],
      '#e45351',
      4.8,
    );
    stroke(
      [
        [10, 43],
        [94, 62],
        [134, 62],
      ],
      '#a8363b',
      2,
    );
    stroke(
      [
        [502, 43],
        [418, 62],
        [378, 62],
      ],
      '#a8363b',
      2,
    );
    ctx.strokeStyle = '#bcc5c5';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(242, 75, 28, 17, 5);
    ctx.stroke();
    label('H', 89, 16, '#c1c9c7');
  } else if (name === 'SPORTAGE') {
    polygon(
      [
        [5, 24],
        [76, 29],
        [127, 40],
        [386, 40],
        [436, 29],
        [507, 24],
        [498, 63],
        [454, 65],
        [430, 50],
        [82, 50],
        [58, 65],
        [14, 63],
      ],
      '#252a2e',
    );
    for (const side of [0, 1]) {
      ctx.save();
      if (side) {
        ctx.translate(512, 0);
        ctx.scale(-1, 1);
      }
      stroke(
        [
          [10, 29],
          [72, 34],
          [91, 40],
        ],
        '#e35656',
        4.5,
      );
      stroke(
        [
          [14, 33],
          [19, 57],
          [39, 61],
          [64, 55],
        ],
        '#c23a42',
        4,
      );
      ctx.restore();
    }
    stroke(
      [
        [233, 90],
        [233, 77],
        [246, 88],
        [246, 77],
        [253, 78],
        [263, 89],
        [273, 77],
        [273, 90],
      ],
      '#c4c9cb',
      2.7,
    );
  } else if (name === 'H6 GT') {
    polygon(
      [
        [4, 30],
        [68, 34],
        [101, 43],
        [411, 43],
        [444, 34],
        [508, 30],
        [499, 54],
        [429, 62],
        [82, 62],
        [11, 54],
      ],
      '#292d32',
    );
    stroke(
      [
        [8, 35],
        [96, 48],
        [416, 48],
        [504, 35],
      ],
      '#a8323f',
      4.5,
    );
    for (const side of [0, 1]) {
      ctx.save();
      if (side) {
        ctx.translate(512, 0);
        ctx.scale(-1, 1);
      }
      for (let i = 0; i < 4; i++)
        stroke(
          [
            [16 + i * 13, 41 + i],
            [22 + i * 13, 48 + i],
          ],
          '#f27470',
          3,
        );
      ctx.restore();
    }
    label('H A V A L', 86, 15, '#bac0c2');
  }
  if (name === 'OMODA 7') label('O M O D A', 86, 14, '#bdc6c9');
  // The plate pocket, licence plate lights and bumper are separate from the lamps.
  polygon(
    [
      [59, 191],
      [111, 184],
      [401, 184],
      [453, 191],
      [492, 201],
      [479, 236],
      [32, 236],
      [19, 201],
    ],
    '#282f32',
  );
  stroke(
    [
      [60, 219],
      [105, 224],
      [407, 224],
      [452, 219],
    ],
    '#7c898b',
    3,
  );
  for (const x of [25, 450])
    stroke(
      [
        [x, 181],
        [x + 33, 178],
      ],
      '#8d333a',
      3,
    );
  const y = name === 'J7' ? 90 : 115;
  ctx.fillStyle = '#20272a';
  ctx.beginPath();
  ctx.roundRect(195, y, 122, 28, 3);
  ctx.fill();
  label(name, y + 19, 13, '#e2e4e4');
  return true;
}
