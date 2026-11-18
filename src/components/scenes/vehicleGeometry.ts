import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { exteriorFor } from '../../data/exteriors';
import { orbitProfileFor, wheelStations } from '../../data/orbitProfiles';
import type { Car } from '../../data/cars';
import { fasciaMap } from './fascia';

type Pt = [number, number, number];
type Surface = (u: number, v: number) => Pt;
type Mat = THREE.Material;
const mix = THREE.MathUtils.lerp;

function panel(uSteps: number, vSteps: number, sample: Surface) {
  const coordinates: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= uSteps; i++) {
    for (let j = 0; j <= vSteps; j++) {
      coordinates.push(...sample(i / uSteps, j / vSteps));
      uv.push(i / uSteps, j / vSteps);
      if (i < uSteps && j < vSteps) {
        const a = i * (vSteps + 1) + j,
          b = a + vSteps + 1;
        indices.push(a, b, b + 1, a, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(coordinates, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function rearGlassMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const sky = ctx.createLinearGradient(0, 0, 64, canvas.height);
  sky.addColorStop(0, '#15212a');
  sky.addColorStop(0.30, '#273640');
  sky.addColorStop(0.54, '#303f48');
  sky.addColorStop(0.83, '#19262f');
  sky.addColorStop(1, '#111b22');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Put the fine copper traces into the filtered glass texture so they stay smooth at a distance.
  ctx.strokeStyle = 'rgba(155, 125, 102, 0.14)';
  ctx.lineWidth = 0.8;
  for (let y = 59; y < 211; y += 19) {
    ctx.beginPath();
    ctx.moveTo(12, y);
    ctx.quadraticCurveTo(256, y + 4, 500, y);
    ctx.stroke();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshPhysicalMaterial({
    map,
    roughness: 0.31,
    metalness: 0.12,
    envMapIntensity: 0.22,
    specularIntensity: 0.16,
    clearcoat: 0.08,
    clearcoatRoughness: 0.29,
  });
}

export function buildVehicle(car: Car, simple: boolean, photoSurfaces = true) {
  const profile = orbitProfileFor(car);
  const detailedPhoto = photoSurfaces && profile.rearLamp !== 'standard';
  const spec = exteriorFor(car);
  const { length: L, width: W, height: H, wheelbase: wb } = spec;
  const pickup = spec.roof === 'pickup',
    sedan = spec.roof === 'sedan';
  const upright = spec.roof === 'upright' || pickup;
  const fast = sedan || spec.roof === 'fastback';
  const rugged = /Jetour|Tank|Shark/.test(car.Model);
  const paint = new THREE.MeshPhysicalMaterial({
    color: spec.paint,
    metalness: 0.58,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.17,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#192933',
    metalness: 0.14,
    roughness: 0.24,
    envMapIntensity: 0.4,
    clearcoat: 0.46,
    clearcoatRoughness: 0.24,
  });
  const material = (color: string, metalness: number, roughness: number) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const trim = material('#242a2e', 0.15, 0.52),
    rubber = material('#1c2023', 0.03, 0.82);
  const alloy = material('#b3bcc0', 0.83, 0.27),
    graphite = material('#424b50', 0.65, 0.34);
  const rotor = material('#787c7c', 0.68, 0.43);
  const seam = material('#323c3e', 0.25, 0.54);
  const darkRoof = material('#11191d', 0.24, 0.38);
  const mirrorCap = material('#172127', 0.3, 0.33);
  const rearLens = material('#8c1821', 0.16, 0.26);
  const batches = new Map<Mat, THREE.BufferGeometry[]>();
  const add = (mat: Mat, geo: THREE.BufferGeometry) => {
    if (!batches.has(mat)) batches.set(mat, []);
    batches.get(mat)!.push(geo);
  };
  const photoPanel = (name: string, geo: () => THREE.BufferGeometry) => {
    if (!detailedPhoto) return;
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -1,
    });
    mat.name = name;
    add(mat, geo());
  };
  const box = (mat: Mat, dims: Pt, pos: Pt, radius = 0.015) => {
    const geo = new RoundedBoxGeometry(...dims, 1, Math.min(radius, ...dims.map((n) => n * 0.45)));
    geo.translate(...pos);
    add(mat, geo);
  };
  const tube = (mat: Mat, pts: Pt[], radius: number) => {
    const curve = new THREE.CatmullRomCurve3(
      pts.map((p) => new THREE.Vector3(...p)),
      false,
      'centripetal',
    );
    add(mat, new THREE.TubeGeometry(curve, Math.max(pts.length * 2, 6), radius, simple ? 4 : 6, false));
  };
  const half = L / 2,
    w = W / 2,
    wheel = profile.wheelRadius;
  const centerY = wheel,
    sill = profile.sill;
  const wheelU = wheelStations(car);
  const longitudinal = (u: number) => L * (u - 0.5);
  const wheels = [longitudinal(wheelU.rear), longitudinal(wheelU.front)];
  const [rearBase, rearRoof, frontRoof, frontBase] = profile.cabin.map(longitudinal);
  const belt = H * profile.belt[1];
  function shoulder(x: number) {
    const u = THREE.MathUtils.clamp(x / L + 0.5, 0, 1);
    const [rear, waist, cowl, bonnet] = profile.belt;
    const cowlU = profile.cabin[3];
    if (u < 0.46) return H * mix(rear, waist, THREE.MathUtils.smoothstep(u, 0, 0.46));
    if (u < cowlU) return H * mix(waist, cowl, THREE.MathUtils.smoothstep(u, 0.46, cowlU));
    return H * mix(cowl, bonnet, THREE.MathUtils.smoothstep(u, cowlU, 1));
  }
  const archRadius = wheel + (pickup ? 0.062 : 0.04);
  function archHeight(distance: number, radius: number) {
    return (
      radius *
      Math.pow(
        Math.max(0, 1 - Math.pow(Math.abs(distance / radius), profile.archPower)),
        1 / profile.archPower,
      )
    );
  }
  function archY(x: number) {
    const d = Math.min(...wheels.map((axle) => Math.abs(x - axle)));
    return d < archRadius ? centerY + archHeight(d, archRadius) : sill;
  }
  function hullWidth(x: number) {
    return w * (1 - 0.035 * Math.pow(Math.abs(x / half), 5));
  }
  function sideWidth(x: number, v: number) {
    const axleDistance = Math.min(...wheels.map((axle) => Math.abs(x - axle)));
    const fender = 0.021 * Math.exp(-((axleDistance / 0.43) ** 2)) * (1 - 0.54 * v);
    const doorScoop =
      0.024 *
      Math.exp(-(((v - 0.4) / 0.18) ** 2)) *
      (1 - THREE.MathUtils.smoothstep(Math.abs(x), wb * 0.23, wb * 0.5));
    const u = x / L + 0.5;
    const beltCrease =
      profile.shoulderLine === 'straight'
        ? 0.83
        : profile.shoulderLine === 'stepped'
          ? 0.75 + 0.07 * Math.cos(u * Math.PI * 2)
          : 0.66 + 0.2 * (1 - u);
    const swage =
      (profile.shoulderLine === 'blade' ? 0.035 : 0.019) * Math.exp(-(((v - beltCrease) / 0.1) ** 2));
    const doorSculpt =
      profile.shoulderLine === 'hollow' ? 1.8 : profile.shoulderLine === 'straight' ? 0.48 : 1.15;
    return (
      hullWidth(x) * (0.954 + 0.04 * Math.sin(v * Math.PI * 0.85)) + fender - doorScoop * doorSculpt + swage
    );
  }
  function topAt(x: number, z: number) {
    const lateral = Math.abs(z) / sideWidth(x, 1);
    const hood = THREE.MathUtils.smoothstep(x, half * 0.35, half * 0.67);
    return (
      shoulder(x) +
      0.061 * (1 - lateral * lateral) +
      hood * 0.026 * Math.exp(-(((lateral - 0.68) / 0.13) ** 2))
    );
  }
  // Project all three adjoining sheets onto the same rounded shoulder. The
  // continuously bending surface carries reflections from the hood to the grille.
  function bodyPoint(x: number, z: number, v: number): Pt {
    const width = sideWidth(x, v),
      floor = archY(x),
      top = topAt(x, z);
    const y = mix(floor, top, v);
    const longRadius = x > 0 ? (upright ? 0.25 : 0.35) : upright ? 0.22 : 0.3;
    const wideRadius = upright ? 0.15 : 0.2;
    const upperRadius = Math.min(upright ? 0.103 : 0.13, (top - floor) * 0.28);
    const lowerRadius = Math.min(0.065, (top - floor) * 0.21);
    const dx = Math.max(0, (Math.abs(x) - half + longRadius) / longRadius);
    const dz = Math.max(0, (Math.abs(z) - width + wideRadius) / wideRadius);
    const up = Math.max(0, 1 - (top - y) / upperRadius);
    const down = Math.max(0, 1 - (y - floor) / lowerRadius);
    const inset = 1 - 1 / Math.max(1, Math.hypot(dx, dz, up + down));
    const valance =
      Math.pow(Math.abs(x / half), 9) *
      (0.1 * (1 - THREE.MathUtils.smoothstep(v, 0, 0.38)) + 0.025 * THREE.MathUtils.smoothstep(v, 0.7, 1));
    return [
      x - Math.sign(x) * (dx * longRadius * inset + valance),
      y - (up * upperRadius - down * lowerRadius) * inset,
      z - Math.sign(z) * dz * wideRadius * inset,
    ];
  }
  const flank = (x: number, side: number, v: number, bias = 0): Pt => {
    const point = bodyPoint(x, side * sideWidth(x, v), v);
    point[2] += side * bias;
    return point;
  };
  // Continuous side panels rise over a circular opening at each axle.
  for (const side of [-1, 1]) {
    const sidePanel = (u: number, v: number): Pt => {
      return flank(mix(-half, half, u), side, v);
    };
    add(paint, panel(simple ? 88 : 160, simple ? 10 : 16, sidePanel));
    photoPanel('orbitFlank' + (side > 0 ? 'Left' : 'Right'), () =>
      panel(simple ? 80 : 150, simple ? 10 : 18, (u, v) => flank(mix(-half, half, u), side, v, 0.006)),
    );
    if (!sedan)
      add(
        trim,
        panel(simple ? 72 : 120, 3, (u, v) => flank(mix(-half, half, u), side, mix(0.012, 0.105, v), 0.003)),
      );
    for (const axle of wheels) {
      const r = archRadius + 0.003;
      const arc: Pt[] = Array.from({ length: 25 }, (_, i) => {
        const a = (Math.PI * i) / 24,
          x = axle + r * Math.cos(a);
        const point = flank(x, side, 0, 0.004);
        point[1] += centerY + archHeight(r * Math.cos(a), r) - archY(x);
        return point;
      });
      tube(
        sedan ? paint : trim,
        arc,
        sedan ? 0.014 : pickup ? 0.055 : profile.rearLamp === 'cross' ? 0.043 : 0.026,
      );
    }
    const rocker: Pt[] = [wheels[0] + wheel + 0.04, 0, wheels[1] - wheel - 0.04].map((x) =>
      flank(x, side, 0.015, 0.003),
    );
    tube(trim, rocker, rugged ? 0.06 : 0.034);
    // Wrap the lamp lens around the physical quarter panel. Its extent and
    // taper follow the individual hatch; pickup lamps rise up the rear corners.
    const lensLength: Record<string, number> = {
      cross: 0.42,
      j5: 0.2,
      j7: 0.22,
      hrv: 0.33,
      sportage: 0.27,
      hs: 0.41,
      h6gt: 0.31,
      omoda: 0.32,
      tiggo7: 0.31,
      tiggo8: 0.23,
      tiggo9: 0.31,
      shark: 0.15,
    };
    const reach = lensLength[profile.rearLamp];
    if (reach) {
      const taper = profile.rearLamp === 'shark' ? 0.76 : 0.2;
      const lamp = (u: number, v: number): Pt => {
        const x = -half + mix(0.029, reach, u);
        const mid = pickup ? 0.624 : 0.862 + 0.034 * u;
        const thick = (pickup ? 0.314 : 0.053) * mix(1, taper, u);
        return flank(x, side, mid + thick * (v * 2 - 1), 0.01);
      };
      add(rearLens, panel(9, 3, lamp));
    }
    if (profile.sideTrim === 'chrome') {
      const strip = [0.035, 0.16, 0.57, 0.94, 0.975].map((u, i) => {
        const x = mix(wheels[0] + wheel + 0.055, wheels[1] - wheel - 0.055, u);
        return flank(x, side, i === 0 || i === 4 ? 0.15 : 0.17, 0.013);
      });
      tube(alloy, strip, spec.name === 'SPORTAGE' ? 0.019 : 0.011);
    }
  }
  const bonnet = (start: number, end: number, zLeft: number, zRight: number, segments: number) => {
    add(
      paint,
      panel(segments, simple ? 18 : 28, (u, v) => {
        const x = mix(start, end, u),
          z = mix(zLeft, zRight, v) * sideWidth(x, 1);
        return bodyPoint(x, z, 1);
      }),
    );
  };
  if (pickup) {
    // The bed floor is visible through a physical opening in the body shell.
    const tailCap = -half + 0.105,
      cabWall = rearBase - 0.042;
    bonnet(-half, tailCap, -1, 1, 5);
    bonnet(tailCap, cabWall, -1, -0.87, 14);
    bonnet(tailCap, cabWall, 0.87, 1, 14);
    bonnet(cabWall, half, -1, 1, 34);
  } else {
    bonnet(-half, half, -1, 1, simple ? 32 : 52);
  }
  if (!simple)
    for (const side of [-1, 1]) {
      const hoodSeam = Array.from({ length: 16 }, (_, i) => {
        const t = i / 15,
          x = mix(frontBase + 0.03, half - 0.11, t);
        const point = bodyPoint(x, side * w * mix(0.84, 0.675, t), 1);
        point[1] += 0.0015;
        return point;
      });
      tube(seam, hoodSeam, 0.0035);
    }
  for (const sign of [-1, 1]) {
    const x = sign * half;
    const bumperSurface =
      (offset: number): Surface =>
      (u, v) => {
        const z = (u * 2 - 1) * sideWidth(x, v) * (sign === 1 ? -1 : 1);
        const p = bodyPoint(x, z, v);
        p[0] += sign * offset;
        return p;
      };
    add(paint, panel(36, 16, bumperSurface(0)));
    const decal = new THREE.MeshStandardMaterial({
      map: fasciaMap(spec, sign === 1),
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
      roughness: 0.4,
      metalness: 0.25,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    decal.name = sign === 1 ? 'orbitFrontFascia' : 'orbitRearFascia';
    add(decal, panel(36, 16, bumperSurface(0.003)));
    const edge: Pt[] = Array.from({ length: 11 }, (_, i) => bumperSurface(0.002)(i / 10, 0.025));
    tube(trim, edge, 0.029);
  }
  box(trim, [wb + 0.32, 0.095, W * 0.69], [(wheels[0] + wheels[1]) * 0.5, sill + 0.015, 0], 0.04);

  // Horizontal rings follow the tumblehome from belt line to roof. Windows share
  // the same surface as the pillars, so the windscreen joins the side glass.
  const glassW = w * (sedan ? 0.926 : upright ? 0.954 : 0.937),
    roofW = w * profile.roofHalfWidth;
  const rearX = (v: number) => mix(rearBase, rearRoof, v),
    frontX = (v: number) => mix(frontBase, frontRoof, v);
  const roofEdgeY = (x: number) => {
    const u = THREE.MathUtils.clamp((x - rearRoof) / (frontRoof - rearRoof), 0, 1);
    return H - 0.044 - profile.roofDrop[0] * Math.pow(1 - u, 3.1) - profile.roofDrop[1] * Math.pow(u, 3.2);
  };
  const cabinWidth = (v: number) => mix(glassW, roofW, v) + 0.016 * Math.sin(v * Math.PI);
  const cabinY = (x: number, v: number) => mix(bodyPoint(x, glassW, 1)[1] - 0.018, roofEdgeY(x), v);
  const sidePt = (side: number, u: number, v: number, bias = 0): Pt => {
    const x = mix(rearX(v), frontX(v), u);
    return [
      x,
      cabinY(x, v),
      side * (cabinWidth(v) + 0.022 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v) + bias),
    ];
  };
  for (const side of [-1, 1]) {
    add(
      spec.contrastRoof ? trim : paint,
      panel(10, 6, (u, v) => sidePt(side, u, v)),
    );
    const [cBottom, cTop, bBottom, bTop] = profile.windows;
    const cThickness = profile.quarter === 'floating' ? 0.01 : 0.016;
    const lastPost = profile.quarter === 'square' ? 0.058 : profile.quarter === 'floating' ? 0.04 : 0.069;
    const rearTop = profile.quarter === 'taper' ? 0.115 : profile.quarter === 'kick' ? 0.137 : 0.064;
    const rearLow = profile.quarter === 'taper' ? 0.025 : profile.quarter === 'kick' ? 0.042 : lastPost;
    // The dark pillars and body-coloured C/D posts have separate geometry so the
    // characteristic rear quarter stays recognizable even at grazing angles.
    const regions: [number, number, number, number][] = pickup
      ? [
          [0.052, bBottom - 0.011, 0.058, bTop - 0.009],
          [bBottom + 0.011, 0.958, bTop + 0.009, 0.95],
        ]
      : [
          [rearLow, cBottom - cThickness, rearTop, cTop - cThickness],
          [cBottom + cThickness, bBottom - 0.01, cTop + cThickness, bTop - 0.01],
          [bBottom + 0.01, 0.977, bTop + 0.01, 0.947],
        ];
    const windowPt = (region: [number, number, number, number], u: number, v: number): Pt => {
      const [low0, low1, top0, top1] = region;
      const q = mix(mix(low0, low1, u), mix(top0, top1, u), v);
      const kick =
        profile.quarter === 'square' || pickup ? 0.015 : profile.quarter === 'floating' ? 0.23 : 0.17;
      const bottom = 0.07 + kick * Math.pow(Math.max(0, 1 - q / 0.38), 1.6);
      const top = 0.916 - 0.049 * Math.pow(Math.abs(2 * q - 1), 3);
      return sidePt(side, q, mix(bottom, top, v), 0.005);
    };
    for (const region of regions)
      add(
        glass,
        panel(9, 6, (u, v) => windowPt(region, u, v)),
      );
    const pillar = (bottom: number, top: number, width: number) => {
      add(
        trim,
        panel(2, 5, (u, v) =>
          sidePt(side, mix(bottom, top, v) + (u - 0.5) * width, mix(0.062, 0.92, v), 0.0065),
        ),
      );
    };
    pillar(bBottom, bTop, 0.026);
    if (!pickup && profile.quarter !== 'floating') pillar(cBottom, cTop, cThickness * 2.1);
    const molding: Pt[] = Array.from({ length: 15 }, (_, i) => {
      const q = mix(rearLow, 0.967, i / 14);
      const kick =
        profile.quarter === 'square' || pickup ? 0.015 : profile.quarter === 'floating' ? 0.23 : 0.17;
      return sidePt(side, q, 0.065 + kick * Math.pow(Math.max(0, 1 - q / 0.38), 1.6), 0.01);
    });
    tube(profile.sideTrim === 'chrome' ? alloy : trim, molding, 0.0075);
    photoPanel('orbitCabin' + (side > 0 ? 'Left' : 'Right'), () =>
      panel(16, 9, (u, v) => sidePt(side, u, v, 0.011)),
    );
    const mirror = sidePt(side, 0.875, 0.145, 0.03);
    tube(trim, [mirror, [mirror[0] - 0.04, mirror[1] + 0.038, mirror[2] + side * 0.118]], 0.024);
    box(
      pickup ? paint : mirrorCap,
      [0.188, 0.106, 0.136],
      [mirror[0] - 0.046, mirror[1] + 0.07, mirror[2] + side * 0.146],
      0.046,
    );
    if (!simple)
      box(
        glass,
        [0.012, 0.067, 0.097],
        [mirror[0] - 0.139, mirror[1] + 0.071, mirror[2] + side * 0.15],
        0.005,
      );
    if (!simple && !detailedPhoto) {
      for (const ratio of [0.15, 0.537, 0.926]) {
        const [x, upper] = sidePt(side, ratio, 0.02);
        const topV = THREE.MathUtils.clamp(
          (upper - 0.028 - archY(x)) / (topAt(x, side * sideWidth(x, 1)) - archY(x)),
          0.72,
          0.93,
        );
        const ends: Pt[] = [
          flank(x, side, topV, 0.003),
          flank(x + 0.018, side, 0.68, 0.003),
          flank(x - 0.016, side, 0.38, 0.003),
          flank(x - 0.035, side, 0.12, 0.003),
        ];
        tube(seam, ends, 0.005);
      }
      for (const ratio of [0.24, 0.615]) {
        const [x, y] = sidePt(side, ratio, 0);
        box(
          spec.contrastRoof ? trim : paint,
          [0.133, 0.028, 0.028],
          [x, y - 0.073, side * (sideWidth(x, 0.9) + 0.008)],
          0.012,
        );
      }
    }
  }
  for (const front of [true, false]) {
    const end: Surface = (u, v) => {
      const x = front ? frontX(v) : rearX(v),
        z = (2 * u - 1) * cabinWidth(v);
      const curve =
        (1 - (2 * u - 1) ** 2) *
        (mix(front ? 0.135 : 0.1, front ? 0.085 : 0.063, v) + Math.sin(v * Math.PI) * 0.026);
      return [x + (front ? curve : -curve), cabinY(x, v) + mix(0.02, 0.041, v) * (1 - (2 * u - 1) ** 2), z];
    };
    if (front) {
      add(paint, panel(12, 6, end));
    } else {
      // Leave an opening in the tailgate beneath the glass; two overlapping curved surfaces can flicker.
      const frame = (u0: number, u1: number, v0: number, v1: number) =>
        add(paint, panel(16, 8, (u, v) => end(mix(u0, u1, u), mix(v0, v1, v))));
      frame(0, 1, 0, 0.075);
      frame(0, 1, 0.909, 1);
      frame(0, 0.030, 0.07, 0.914);
      frame(0.970, 1, 0.07, 0.914);
    }
    add(
      front ? glass : rearGlassMaterial(),
      panel(16, 8, (u, v) => {
        const p = end(mix(0.027, 0.973, u), mix(0.07, 0.914, v));
        p[0] += front ? 0.006 : -0.006;
        return p;
      }),
    );
    photoPanel(front ? 'orbitWindshield' : 'orbitBacklight', () =>
      panel(20, 10, (u, v) => {
        const p = end(mix(0.027, 0.973, front ? 1 - u : u), mix(0.07, 0.914, v));
        p[0] += front ? 0.012 : -0.012;
        return p;
      }),
    );
    if (!front && !pickup) {
      const wiper: Pt[] = [
        [0.46, 0.14],
        [0.58, 0.114],
        [0.73, 0.137],
        [0.817, 0.159],
      ].map(([u, v]) => {
        const p = end(u, v);
        p[0] -= 0.022;
        return p;
      });
      tube(trim, wiper, 0.009);
    }
  }
  const roofSurface: Surface = (u, v) => {
    const crown = 1 - (2 * v - 1) ** 2;
    const x = mix(rearRoof - 0.063 * crown, frontRoof + 0.085 * crown, u),
      z = (2 * v - 1) * roofW;
    return [x, roofEdgeY(mix(rearRoof, frontRoof, u)) + 0.041 * crown + 0.008 * Math.sin(u * Math.PI), z];
  };
  add(spec.contrastRoof ? darkRoof : paint, panel(12, 12, roofSurface));
  if (!simple && !pickup)
    add(
      glass,
      panel(10, 8, (u, v) => {
        const p = roofSurface(mix(0.19, 0.89, u), mix(0.16, 0.84, v));
        p[1] += 0.003;
        return p;
      }),
    );
  if (!fast || spec.name === 'H6 GT') {
    for (const side of [-1, 1]) {
      const railZ = side * roofW * 0.83;
      const rail: Pt[] = [0.05, 0.15, 0.46, 0.79, 0.93].map((u, index) => {
        const x = mix(rearRoof, frontRoof, u);
        return [x, roofEdgeY(x) + (index === 0 || index === 4 ? 0.016 : 0.072), railZ];
      });
      tube(graphite, rail, 0.018);
    }
  }
  if (profile.spoiler > 0) {
    const wing =
      (lower: boolean): Surface =>
      (u, v) => {
        const z = (v * 2 - 1) * roofW,
          crown = 1 - (v * 2 - 1) ** 2;
        const x = rearRoof - 0.056 * crown - profile.spoiler * (1 - u) + 0.052 * u;
        const y =
          roofEdgeY(rearRoof) +
          0.025 * crown +
          0.013 * Math.sin(Math.PI * u) +
          (spec.name === 'H6 GT' ? 0.054 : 0.027) * (1 - u) -
          (lower ? 0.031 : 0);
        return [x, y, z];
      };
    const wingMat =
      profile.quarter === 'floating' || spec.name === 'H6 GT' || spec.contrastRoof ? darkRoof : paint;
    if (!simple) {
      const stopLight: Pt[] = Array.from({ length: 9 }, (_, i) => {
        const p = wing(true)(0.06, mix(0.31, 0.69, i / 8));
        p[1] -= 0.004;
        p[0] -= 0.004;
        return p;
      });
      tube(rearLens, stopLight, 0.007);
    }
    add(wingMat, panel(4, 16, wing(false)));
    add(trim, panel(4, 16, wing(true)));
    add(
      trim,
      panel(16, 1, (u, v) => {
        const p = wing(false)(0, u);
        p[1] -= v * 0.031;
        return p;
      }),
    );
    // Coupe tail gets a second lip at the raised hatch, below the roof spoiler.
    if (spec.name === 'H6 GT')
      box(graphite, [0.17, 0.055, W * 0.96], [-half + 0.035, shoulder(-half) + 0.072, 0], 0.022);
  }
  if (pickup) {
    const start = -half + 0.105,
      end = rearBase - 0.042,
      mid = (start + end) * 0.5;
    const depth = 0.415,
      floor = belt - depth;
    const inner = 0.87 * w,
      len = end - start,
      wallH = depth + 0.037;
    box(trim, [len, 0.075, inner * 2], [mid, floor, 0], 0.028);
    box(trim, [0.06, wallH, inner * 2], [end - 0.026, floor + wallH * 0.5, 0], 0.017);
    box(trim, [0.064, wallH, inner * 2], [start + 0.026, floor + wallH * 0.5, 0], 0.017);
    for (const side of [-1, 1]) {
      box(trim, [len, wallH, 0.06], [mid, floor + wallH * 0.5, side * (inner - 0.027)], 0.019);
      box(trim, [len + 0.04, 0.045, 0.104], [mid, belt + 0.032, side * inner], 0.018);
      box(trim, [0.68, 0.2, 0.195], [wheels[0], floor + 0.115, side * (inner - 0.12)], 0.082);
    }
    for (let i = 0; i < 12; i++)
      box(
        graphite,
        [len - 0.11, 0.018, 0.019],
        [mid, floor + 0.043, mix(-inner * 0.87, inner * 0.87, i / 11)],
        0.005,
      );
  }
  for (const axle of wheels)
    for (const side of [-1, 1]) {
      const z = side * (w - 0.101),
        tireDepth = 0.208,
        rim = wheel * (rugged ? 0.578 : 0.658);
      const profile = [
        [-0.5, rim * 0.99],
        [-0.54, rim * 1.1],
        [-0.57, wheel * 0.87],
        [-0.45, wheel * 0.97],
        [-0.29, wheel],
        [0.29, wheel],
        [0.45, wheel * 0.97],
        [0.57, wheel * 0.87],
        [0.54, rim * 1.1],
        [0.5, rim * 0.99],
      ];
      const tire = new THREE.LatheGeometry(
        profile.map(([a, r]) => new THREE.Vector2(r, a * tireDepth)),
        simple ? 24 : 48,
      );
      tire.rotateX(Math.PI / 2);
      tire.translate(axle, centerY, z);
      add(rubber, tire);
      const face = z + side * tireDepth * 0.54;
      const disk = (mat: Mat, r: number, depth: number, offset: number, dx = 0, dy = 0) => {
        const geo = new THREE.CylinderGeometry(r, r, depth, simple ? 24 : 48);
        geo.rotateX(Math.PI / 2);
        geo.translate(axle + dx, centerY + dy, face + side * offset);
        add(mat, geo);
      };
      disk(graphite, rim, 0.02, -0.074);
      disk(rotor, rim * 0.78, 0.016, -0.042);
      disk(graphite, rim * 0.36, 0.024, -0.031);
      box(
        graphite,
        [rim * 0.255, rim * 0.52, 0.04],
        [axle + rim * 0.6, centerY + 0.028, face - side * 0.029],
        0.016,
      );
      const ring = new THREE.TorusGeometry(rim * 0.976, 0.013, 8, simple ? 24 : 48);
      ring.translate(axle, centerY, face);
      add(alloy, ring);
      // Each cast blade has a tapering face, a machined ridge and dark return walls.
      const blade = (
        root: number,
        tip: number,
        angle: number,
        sweep: number,
        baseWidth: number,
        tipWidth: number,
      ) => {
        const at = (u: number, widthAcross: number, recess = 0): Pt => {
          const a = angle + sweep * u,
            radius = mix(root, tip, u) * rim;
          const tangent = widthAcross * mix(baseWidth, tipWidth, u) * rim;
          const depth =
            0.014 + 0.012 * Math.sin(u * Math.PI) - u * 0.014 + 0.005 * (1 - Math.abs(widthAcross)) - recess;
          return [
            axle + radius * Math.cos(a) - tangent * Math.sin(a),
            centerY + radius * Math.sin(a) + tangent * Math.cos(a),
            face + side * depth,
          ];
        };
        add(
          alloy,
          panel(4, 2, (u, v) => at(u, v * 2 - 1)),
        );
        for (const edge of [-1, 1])
          add(
            graphite,
            panel(4, 1, (u, v) => at(u, edge, v * 0.029)),
          );
      };
      for (let spoke = 0; spoke < spec.spokes; spoke++) {
        const angle = (spoke * Math.PI * 2) / spec.spokes;
        blade(0.2, 0.975, angle, rugged ? 0.075 : 0.22, rugged ? 0.151 : 0.116, rugged ? 0.092 : 0.061);
        if (!rugged) blade(0.51, 0.963, angle + 0.08, -0.21, 0.076, 0.042);
      }
      const wheelName =
        'orbitWheel' + (axle === wheels[1] ? 'Front' : 'Rear') + (side > 0 ? 'Left' : 'Right');
      photoPanel(wheelName, () => {
        const cap = new THREE.CircleGeometry(rim * 1.025, simple ? 32 : 56);
        if (side < 0) cap.rotateY(Math.PI);
        cap.translate(axle, centerY, face + side * 0.05);
        return cap;
      });
      disk(graphite, rim * 0.266, 0.035, 0.009);
      disk(alloy, rim * 0.165, 0.016, 0.029);
      if (!simple)
        for (let lug = 0; lug < 5; lug++) {
          const a = (lug * Math.PI * 2) / 5;
          disk(alloy, 0.01, 0.011, 0.03, rim * 0.218 * Math.cos(a), rim * 0.218 * Math.sin(a));
        }
    }
  if (spec.name === 'T2' || spec.name === 'TANK 500') {
    const spare = new THREE.CylinderGeometry(wheel * 0.93, wheel * 0.95, 0.22, 36);
    spare.rotateZ(Math.PI / 2);
    spare.translate(-half - 0.08, belt - 0.035, 0);
    add(trim, spare);
    const cover = new THREE.CylinderGeometry(wheel * 0.81, wheel * 0.85, 0.045, 36);
    cover.rotateZ(Math.PI / 2);
    cover.translate(-half - 0.195, belt - 0.035, 0);
    add(paint, cover);
  }
  const group = new THREE.Group();
  batches.forEach((parts, mat) => {
    mat.side = THREE.DoubleSide;
    const flat = parts.map((p) => (p.index ? p.toNonIndexed() : p));
    const geo = mergeGeometries(flat, false)!;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = mat.name;
    mesh.castShadow = !simple && !(mat instanceof THREE.MeshBasicMaterial);
    mesh.receiveShadow = true;
    group.add(mesh);
    new Set([...parts, ...flat]).forEach((p) => p.dispose());
  });
  return group;
}

export function disposeVehicle(group: THREE.Group) {
  const maps = new Set<THREE.Texture>();
  for (const child of group.children) {
    if (!(child instanceof THREE.Mesh)) continue;
    const mat = child.material as THREE.MeshStandardMaterial;
    if (mat.map) maps.add(mat.map);
    mat.dispose();
    child.geometry.dispose();
  }
  for (const map of maps) map.dispose();
}
