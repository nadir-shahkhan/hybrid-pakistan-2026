import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Car } from '../../data/cars';

// Source photographs are calibrated against the same coordinate system as
// the carved mesh. Project onto the triangle surface, including when orbiting
// above the car. Each view is periodically blended into the adjacent capture.
interface Reconstruction {
  wheel: [front: number, rear: number, radius: number, trackHalf: number, width: number];
  height: number;
  length: number;
  width: number;
  positions: string;
  indices: string;
  atlas: string;
  layout: [number, number];
  angles: [firstDegrees: number, elevationDegrees: number, distance: number, pivotY: number];
  cameras: [number, number, number, number][];
  wheelOffsets: [number, number, number, number][];
}

const assets = import.meta.glob<Reconstruction>('../../assets/turntable-meshes/*.json', {
  import: 'default',
});
const models: [string, string][] = [
  ['Hyundai Elantra', 'elantra'],
  ['Hyundai Tucson', 'tucson'],
  ['Hyundai Santa Fe', 'santa-fe'],
  ['Kia Sorento', 'sorento'],
  ['Jetour T1', 'jetour-t1'],
  ['Jetour T2', 'jetour-t2'],
  ['Haval H6 HEV', 'haval-h6-hev'],
  ['Haval H6 PHEV', 'haval-h6-phev'],
  ['Haval Jolion HEV', 'haval-jolion-hev'],
  ['GWM Tank 500 PHEV', 'tank-500-phev'],
];

function modelKey(car: Car) {
  return models.find(([prefix]) => car.Model === prefix || car.Model.startsWith(prefix + ' '))?.[1];
}

export function hasSpinReconstruction(car: Car) {
  return Boolean(modelKey(car));
}

function decode(encoded: string): ArrayBuffer {
  const chars = atob(encoded);
  const bytes = new Uint8Array(chars.length);
  for (let i = 0; i < chars.length; i++) bytes[i] = chars.charCodeAt(i);
  return bytes.buffer;
}

const vertexShader = `
  varying vec3 vPoint;
  varying vec3 vSurfaceNormal;
  varying vec3 vEye;
  void main() {
    vPoint = position;
    vSurfaceNormal = normal;
    vEye = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D atlas;
  uniform vec2 layoutSize;
  uniform vec3 dimensions;
  uniform vec3 roofColour;
  uniform vec4 cameraSetup;
  uniform vec4 calibration[N_CAMERAS];
  uniform vec4 wheelOffsets[N_CAMERAS];
  uniform vec4 wheelCentres;
  varying vec3 vPoint;
  varying vec3 vSurfaceNormal;
  varying vec3 vEye;

  vec3 photograph(int frame) {
    float theta = cameraSetup.x + float(frame) * (6.28318530718 / float(N_CAMERAS));
    float ct = cos(theta), st = sin(theta);
    float ce = cos(cameraSetup.y), se = sin(cameraSetup.y);
    float h = ct*vPoint.x - st*vPoint.z;
    float height = vPoint.y - cameraSetup.w;
    float perspective = 1.0 - (ce*h + se*height) / cameraSetup.z;
    vec2 plane = vec2(-st*vPoint.x - ct*vPoint.z, ce*height - se*h) / perspective;
    vec4 affine = calibration[frame];
    vec2 f = (vPoint.xy - vec2(wheelCentres.x,wheelCentres.z)) / wheelCentres.z;
    vec2 r = (vPoint.xy - vec2(wheelCentres.y,wheelCentres.z)) / wheelCentres.z;
    float sideWeight=smoothstep(.40,.80,abs(vPoint.z)/wheelCentres.w);
    vec4 correction=wheelOffsets[frame];
    vec2 warp=(correction.xy*(1.-smoothstep(.86,2.0,length(f)))+
               correction.zw*(1.-smoothstep(.86,2.0,length(r))))*sideWeight;
    vec2 at = clamp(plane * affine.xz + affine.yw + warp, vec2(0.0025), vec2(0.9975));
    vec2 tile = vec2(mod(float(frame), layoutSize.x), floor(float(frame) / layoutSize.x));
    vec2 uv = (tile+at) / layoutSize;
    return texture2D(atlas, vec2(uv.x, 1.0-uv.y)).rgb;
  }

  vec3 captureHeading(vec2 direction) {
    float capture = mod((atan(direction.y,direction.x) - cameraSetup.x)/6.28318530718,1.0) * float(N_CAMERAS);
    int first = int(floor(capture));
    int next = (first+1) % N_CAMERAS;
    float blend = smoothstep(0.14, 0.86, fract(capture));
    return mix(photograph(first), photograph(next), blend);
  }

  void main() {
    vec3 normal = normalize(vSurfaceNormal);
    vec2 eyeDirection = normalize(vec2(vEye.x, -vEye.z));
    vec3 colour = captureHeading(eyeDirection);
    float viewPitch = normalize(vEye-vec3(0.,cameraSetup.w,0.)).y;
    float longitudinal = vPoint.x/dimensions.x;
    float end = sign(longitudinal);
    float top = smoothstep(.16,.71,normal.y) * smoothstep(.16,.31,abs(longitudinal));
    float hidden = top * (1.-smoothstep(-.26,.2,eyeDirection.x*end)) * smoothstep(.05,.22,viewPitch);
    if (hidden > .015) {
      // From a high rear camera the bonnet becomes visible beyond the
      // windscreen. Use its forward capture, which actually saw that paint.
      vec2 endView=vec2(.86*end,sign(eyeDirection.y)*.51);
      colour=mix(colour,captureHeading(endView),hidden);
    }
    // The cameras are near belt height. Above the capture ring, the horizon on
    // glass projects across the top. Finish the unobserved high roof in paint
    // and roof glass, preserving photographed pillars and upper window frames.
    float crown = smoothstep(.88,.975,vPoint.y/dimensions.y) * smoothstep(.22,.80,normal.y);
    vec2 roofPoint = vec2(vPoint.x/dimensions.x, vPoint.z/dimensions.z);
    vec2 pane = abs((roofPoint-vec2(-.107,0.))/vec2(.195,.317));
    float glass = 1.0-smoothstep(.965,1.0,max(pane.x,pane.y));
    float sheen = .89+.11*sin(roofPoint.x*8.+roofPoint.y*2.)+.08*abs(roofPoint.y);
    vec3 lid = mix(roofColour*sheen,vec3(.028,.041,.055)*sheen,glass*.94);
    colour = mix(colour,lid,crown*mix(.33,1.0,smoothstep(.08,.31,viewPitch)));
    // The capture ring has no underside exposure. Keep the undertray recessed.
    colour *= mix(0.28,1.0,smoothstep(-0.82,-0.18,normal.y));
    gl_FragColor = vec4(colour,1.0);
    #include <colorspace_fragment>
  }
`;

interface Prototype {
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  tyres: THREE.BufferGeometry;
  wheels: THREE.BufferGeometry;
  tyreMaterial: THREE.MeshStandardMaterial;
  wheelMaterial: THREE.MeshBasicMaterial;
  texture: THREE.Texture;
}

const paints: Record<string, string> = {
  elantra: '#873746',
  tucson: '#4a554e',
  'santa-fe': '#71839b',
  sorento: '#827a70',
  'jetour-t1': '#8b8880',
  'jetour-t2': '#929aa3',
  'haval-h6-hev': '#303633',
  'haval-h6-phev': '#d1d1cf',
  'haval-jolion-hev': '#918a81',
  'tank-500-phev': '#d3d9e1',
};

function wheelGeometry(data: Reconstruction) {
  const [front, rear, radius, trackHalf, width] = data.wheel;
  const tyres: THREE.BufferGeometry[] = [],
    wheels: THREE.BufferGeometry[] = [];
  const [cols, rows] = data.layout;
  for (const [which, axle] of [front, rear].entries()) {
    const tile = data.cameras.length + which;
    for (const side of [-1, 1]) {
      const meridian = [
        [-0.48, 0.88],
        [-0.51, 0.94],
        [-0.43, 0.985],
        [-0.28, 1],
        [0.28, 1],
        [0.43, 0.985],
        [0.51, 0.94],
        [0.48, 0.88],
      ].map(([z, r]) => new THREE.Vector2(radius * r, z * width));
      const tyre = new THREE.LatheGeometry(meridian, 44);
      tyre.rotateX(Math.PI / 2);
      tyre.translate(axle, radius, side * trackHalf);
      tyres.push(tyre);

      const disc = new THREE.CircleGeometry(radius * 0.945, 44);
      const uv = disc.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) {
        const u = 0.5 + (uv.getX(i) - 0.5) * 0.945,
          v = 0.5 + (uv.getY(i) - 0.5) * 0.945;
        uv.setXY(i, ((tile % cols) + u) / cols, 1 - (Math.floor(tile / cols) + 1 - v) / rows);
      }
      if (side < 0) disc.rotateY(Math.PI);
      disc.translate(axle, radius, side * (trackHalf + width * 0.511));
      wheels.push(disc);
    }
  }
  const tyreMesh = mergeGeometries(tyres)!;
  const wheelMesh = mergeGeometries(wheels)!;
  [...tyres, ...wheels].forEach((g) => g.dispose());
  return { tyres: tyreMesh, wheels: wheelMesh };
}

async function createPrototype(key: string): Promise<Prototype> {
  const data = await assets['../../assets/turntable-meshes/' + key + '.json']();
  const packed = new Int16Array(decode(data.positions));
  const positions = Float32Array.from(packed, (coordinate) => coordinate / 10000);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(decode(data.indices)), 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  try {
    const texture = await new THREE.TextureLoader().loadAsync('data:image/webp;base64,' + data.atlas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const [first, elevation, distance, pivot] = data.angles;
    const material = new THREE.ShaderMaterial({
      defines: { N_CAMERAS: data.cameras.length },
      uniforms: {
        atlas: { value: texture },
        dimensions: { value: new THREE.Vector3(data.length, data.height, data.width) },
        roofColour: { value: new THREE.Color(paints[key]) },
        layoutSize: { value: new THREE.Vector2(...data.layout) },
        cameraSetup: {
          value: new THREE.Vector4(
            THREE.MathUtils.degToRad(first),
            THREE.MathUtils.degToRad(elevation),
            distance,
            pivot,
          ),
        },
        calibration: { value: data.cameras.map((row) => new THREE.Vector4(...row)) },
        wheelOffsets: { value: data.wheelOffsets.map((row) => new THREE.Vector4(...row)) },
        wheelCentres: {
          value: new THREE.Vector4(...(data.wheel.slice(0, 4) as [number, number, number, number])),
        },
      },
      vertexShader,
      fragmentShader,
      toneMapped: false,
    });
    return {
      geometry,
      material,
      texture,
      ...wheelGeometry(data),
      tyreMaterial: new THREE.MeshStandardMaterial({
        color: '#202428',
        roughness: 0.87,
        metalness: 0.025,
        side: THREE.DoubleSide,
      }),
      wheelMaterial: new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
    };
  } catch (error) {
    geometry.dispose();
    throw error;
  }
}

const shared = new Map<string, { resource: Promise<Prototype>; users: number }>();
const owners = new WeakMap<THREE.Group, { key: string; prototype: Prototype }>();

export async function loadSpinReconstruction(car: Car): Promise<THREE.Group> {
  const key = modelKey(car);
  if (!key) throw new Error('No calibrated turntable for ' + car.Model);
  let entry = shared.get(key);
  if (!entry) {
    entry = { resource: createPrototype(key), users: 0 };
    shared.set(key, entry);
  }
  entry.users++;
  try {
    const prototype = await entry.resource;
    const group = new THREE.Group();
    group.name = car.Model;
    const mesh = new THREE.Mesh(prototype.geometry, prototype.material);
    mesh.name = key + ' reconstructed exterior';
    mesh.castShadow = true;
    const tyres = new THREE.Mesh(prototype.tyres, prototype.tyreMaterial);
    const wheels = new THREE.Mesh(prototype.wheels, prototype.wheelMaterial);
    tyres.castShadow = true;
    group.add(mesh, tyres, wheels);
    owners.set(group, { key, prototype });
    return group;
  } catch (error) {
    if (--entry.users === 0) shared.delete(key);
    throw error;
  }
}

export function disposeSpinReconstruction(group: THREE.Group) {
  const owner = owners.get(group);
  if (!owner) return;
  owners.delete(group);
  group.clear();
  const entry = shared.get(owner.key);
  if (entry && --entry.users === 0) {
    shared.delete(owner.key);
    owner.prototype.texture.dispose();
    owner.prototype.tyres.dispose();
    owner.prototype.wheels.dispose();
    owner.prototype.tyreMaterial.dispose();
    owner.prototype.wheelMaterial.dispose();
    owner.prototype.material.dispose();
    owner.prototype.geometry.dispose();
  }
}
