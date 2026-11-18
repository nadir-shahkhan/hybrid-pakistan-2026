import { Html, Line, OrbitControls, useCursor } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Car } from '../../data/cars';
import { MAX_PRICE, MIN_PRICE, numericValue, plottingEVRange } from '../../lib/carUtils';
import { Price, TypeBadge } from '../ui/CarUI';
import { SceneCanvas } from './SceneCanvas';
import { StudioEnvironment } from './StudioEnvironment';

export type ScatterMetric = 'power' | 'torque';

interface ScatterSceneProps {
  cars: Car[];
  visibleIds: Set<string>;
  metric: ScatterMetric;
  onOpen: (car: Car) => void;
}

export default function ScatterScene(props: ScatterSceneProps) {
  return (
    <SceneCanvas
      camera={{ position: [15, 13, 19], fov: 43, near: 0.1, far: 100 }}
      label="Three-dimensional price, performance, and electric range data plot"
    >
      <ScatterWorld {...props} />
    </SceneCanvas>
  );
}

function ScatterWorld({ cars, visibleIds, metric, onOpen }: ScatterSceneProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  useCursor(hovered !== null);
  const yMax = metric === 'power' ? 650 : 1000;
  const plotted = useMemo(() => cars.map((car) => ({
    car,
    value: numericValue(metric === 'power' ? car.PowerHp : car.TorqueNm),
  })), [cars, metric]);

  return (
    <>
      <StudioEnvironment />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.07}
        enablePan={false}
        minDistance={13}
        maxDistance={38}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.48}
        target={[0, 3.2, 0]}
      />
      <Axes metric={metric} />
      {plotted.map(({ car, value }) => value !== null && (
        <DataPoint
          key={car.Model}
          car={car}
          metricValue={value}
          yMax={yMax}
          visible={visibleIds.has(car.Model)}
          hovered={hovered === car.Model}
          onHover={setHovered}
          onOpen={onOpen}
        />
      ))}
    </>
  );
}

function positionFor(car: Car, value: number, yMax: number): [number, number, number] {
  return [
    THREE.MathUtils.mapLinear(car.PricePKR, MIN_PRICE, MAX_PRICE, -9, 9),
    THREE.MathUtils.mapLinear(value, 0, yMax, 0.25, 8.5),
    THREE.MathUtils.mapLinear(plottingEVRange(car), 0, 190, 6, -6),
  ];
}

interface DataPointProps {
  car: Car;
  metricValue: number;
  yMax: number;
  visible: boolean;
  hovered: boolean;
  onHover: (model: string | null) => void;
  onOpen: (car: Car) => void;
}

function DataPoint({ car, metricValue, yMax, visible, hovered, onHover, onOpen }: DataPointProps) {
  const group = useRef<THREE.Group>(null);
  const color = car.Type === 'HEV' ? '#35d0b5' : '#4385ff';
  const position = positionFor(car, metricValue, yMax);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = visible ? (hovered ? 1.45 : 1) : 0.001;
    const scale = THREE.MathUtils.damp(group.current.scale.x, target, 8, delta);
    group.current.scale.setScalar(scale);
    group.current.visible = scale > 0.015;
    group.current.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const material = object.material as THREE.Material;
      material.transparent = true;
      material.opacity = visible ? (object.userData.halo ? 0.13 : 1) : Math.max(0, scale);
    });
  });

  const open = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (visible) onOpen(car);
  };

  return (
    <group ref={group} position={position}>
      <mesh
        onClick={open}
        onPointerOver={(event) => { event.stopPropagation(); if (visible) onHover(car.Model); }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.4} roughness={0.25} />
      </mesh>
      <mesh userData={{ halo: true }}>
        <sphereGeometry args={[0.38, 12, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.13} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {hovered && visible && (
        <Html position={[0, 0.55, 0]} center distanceFactor={13} zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
          <div className="w-56 rounded-xl border border-white/15 bg-[#0a1012]/95 p-3 shadow-2xl backdrop-blur-xl">
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="font-display text-xs font-medium leading-4 text-white">{car.Model}</span>
              <TypeBadge type={car.Type} subtle />
            </div>
            <Price price={car.PricePKR} className="font-display text-lg text-white" />
            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-white/50">
              <span>Power <b className="ml-1 font-medium text-white/85">{car.PowerHp ?? '—'}{car.PowerHp ? ' hp' : ''}</b></span>
              <span>EV range <b className="ml-1 font-medium text-white/85">{car.EVRangeKm ?? '—'}{car.EVRangeKm ? ' km' : ''}</b></span>
            </div>
            <span className="mt-2 block text-[9px] uppercase tracking-wider text-hev">Click for full specifications</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function Axes({ metric }: { metric: ScatterMetric }) {
  const yMax = metric === 'power' ? 650 : 1000;
  const yTicks = metric === 'power' ? [0, 200, 400, 600] : [0, 250, 500, 750, 1000];
  return (
    <group>
      <Line points={[[-9, 0, 6], [9.5, 0, 6]]} color="#6f8583" lineWidth={1} />
      <Line points={[[-9, 0, 6], [-9, 9, 6]]} color="#6f8583" lineWidth={1} />
      <Line points={[[-9, 0, 6], [-9, 0, -6.5]]} color="#6f8583" lineWidth={1} />
      <AxisLabel position={[0, -0.15, 7.1]} text="PRICE • PKR" />
      <AxisLabel position={[-10, 9.2, 6]} text={metric === 'power' ? 'POWER • HP' : 'TORQUE • NM'} />
      <AxisLabel position={[-9, -0.15, -7.4]} text="EV RANGE • KM" />
      {[MIN_PRICE, 11_000_000, 17_000_000, MAX_PRICE].map((price) => {
        const x = THREE.MathUtils.mapLinear(price, MIN_PRICE, MAX_PRICE, -9, 9);
        return <AxisLabel key={price} position={[x, -0.2, 6.45]} text={`${price / 1_000_000}m`} small />;
      })}
      {yTicks.map((tick) => (
        <AxisLabel key={tick} position={[-9.75, THREE.MathUtils.mapLinear(tick, 0, yMax, 0.25, 8.5), 6]} text={String(tick)} small />
      ))}
      {[0, 60, 120, 180].map((range) => (
        <AxisLabel key={range} position={[-9.5, -0.2, THREE.MathUtils.mapLinear(range, 0, 190, 6, -6)]} text={String(range)} small />
      ))}
      <gridHelper args={[18, 18, '#263a3b', '#182526']} position={[0, 0.01, 0]} material-transparent material-opacity={0.48} />
    </group>
  );
}

function AxisLabel({ position, text, small = false }: { position: [number, number, number]; text: string; small?: boolean }) {
  return (
    <Html position={position} center style={{ pointerEvents: 'none' }} zIndexRange={[5, 0]}>
      <span className={`whitespace-nowrap rounded bg-[#080c0d]/80 px-1.5 py-1 font-display font-medium tracking-[0.12em] text-white/45 ${small ? 'text-[8px]' : 'text-[9px]'}`}>
        {text}
      </span>
    </Html>
  );
}
