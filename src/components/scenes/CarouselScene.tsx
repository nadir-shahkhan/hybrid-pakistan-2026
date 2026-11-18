import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Car } from '../../data/cars';
import { SceneCanvas } from './SceneCanvas';
import { ProceduralCar } from './ProceduralCar';
import { StudioEnvironment } from './StudioEnvironment';

const ringDeckY = -0.20;
const centerDeckY = -0.08;

interface CarouselSceneProps {
  cars: Car[];
  visibleIds: Set<string>;
  selected: Car;
  onSelect: (car: Car) => void;
}

export default function CarouselScene(props: CarouselSceneProps) {
  return (
    <SceneCanvas
      camera={{ position: [0, 17, 29], fov: 43, near: 0.1, far: 120 }}
      label="Interactive circular carousel containing all 30 hybrid variants"
    >
      <CarouselWorld {...props} />
    </SceneCanvas>
  );
}

function CarouselWorld({ cars, visibleIds, selected, onSelect }: CarouselSceneProps) {
  const ring = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);
  const { camera, size } = useThree();
  const step = (Math.PI * 2) / cars.length;
  const selectedIndex = Math.max(0, cars.findIndex((car) => car.Model === selected.Model));

  useEffect(() => {
    targetRotation.current = Math.PI / 2 - selectedIndex * step;
  }, [selectedIndex, step]);

  useEffect(() => {
    const position: [number, number, number] = size.width < 768 ? [0, 24, 39] : [0, 17, 29];
    camera.position.set(...position);
    camera.updateProjectionMatrix();
  }, [camera, size.width]);

  useFrame((_, delta) => {
    if (!ring.current) return;
    const difference = targetRotation.current - ring.current.rotation.y;
    ring.current.rotation.y += difference * (1 - Math.exp(-delta * 4));
  });

  return (
    <>
      <StudioEnvironment />
      <mesh position-y={ringDeckY - 0.21} receiveShadow>
        <cylinderGeometry args={[17.4, 17.8, 0.42, 96]} />
        <meshStandardMaterial color="#0e1517" metalness={0.65} roughness={0.48} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position-y={ringDeckY + 0.01}>
        <torusGeometry args={[15.1, 0.025, 6, 128]} />
        <meshBasicMaterial color="#29423f" transparent opacity={0.7} />
      </mesh>
      <mesh position-y={centerDeckY - 0.16}>
        <cylinderGeometry args={[3.45, 3.65, 0.32, 64]} />
        <meshStandardMaterial color="#121b1d" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position-y={centerDeckY + 0.01}>
        <torusGeometry args={[3.3, 0.025, 6, 80]} />
        <meshBasicMaterial color={selected.Type === 'HEV' ? '#35d0b5' : '#4385ff'} />
      </mesh>
      <group ref={ring}>
        {cars.map((car, index) => (
          <CarouselItem
            key={car.Model}
            car={car}
            angle={index * step}
            selected={car.Model === selected.Model}
            visible={visibleIds.has(car.Model)}
            onSelect={onSelect}
          />
        ))}
      </group>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.42}
        target={[0, 0, 0]}
      />
    </>
  );
}

interface CarouselItemProps {
  car: Car;
  angle: number;
  selected: boolean;
  visible: boolean;
  onSelect: (car: Car) => void;
}

function CarouselItem({ car, angle, selected, visible, onSelect }: CarouselItemProps) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const group = useRef<THREE.Group>(null);
  const fade = useRef(1);
  const destination = useRef(new THREE.Vector3());
  const ringPosition = new THREE.Vector3(Math.cos(angle) * 15, ringDeckY, Math.sin(angle) * 15);

  useFrame((_, delta) => {
    if (!group.current) return;
    const smoothing = 1 - Math.exp(-delta * 5);
    if (selected) destination.current.set(0, centerDeckY, 0);
    else destination.current.copy(ringPosition);
    group.current.position.lerp(destination.current, smoothing);
    fade.current = THREE.MathUtils.damp(fade.current, visible ? 1 : 0, 7, delta);
    const scale = (selected ? 1.02 : 0.42) * Math.max(0.001, fade.current);
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, scale, 6, delta));
    group.current.visible = fade.current > 0.015;
    if (selected) {
      if (!reduceMotion) group.current.rotation.y += Math.min(delta, 0.05) * 0.13;
    } else {
      group.current.rotation.y = -angle + Math.PI / 2;
    }
  });

  const select = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (visible) onSelect(car);
  };

  return (
    <group
      ref={group}
      position={ringPosition}
      scale={0.42}
      onClick={select}
      onPointerOver={(event) => {
        event.stopPropagation();
        if (visible) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <ProceduralCar car={car} simplified={!selected} />
    </group>
  );
}
